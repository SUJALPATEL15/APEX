"""
train_apex_models.py - APEX end-to-end ML pipeline (PBL stages 6-18)

Two problems on the same dataset:
  A) Readiness_Score      -> regression
  B) Injury_Next_7_Days   -> imbalanced binary classification (probabilities must be calibrated)

Experimental design (leakage-safe, see PBL section 15)
  * TIME split: train = days 1-123, 7-day EMBARGO (days 124-130), test = last 50 days (131-180).
    The embargo is needed because the injury label of a day looks 7 days ahead.
  * All preprocessing (imputation, scaling, encoding) lives inside sklearn Pipelines fitted on train only.
  * Personal-baseline features use only PAST days of each athlete.
  * Hyper-parameters tuned with time-ordered CV (TimeSeriesSplit with a 7-day gap) on the TRAIN set only.
  * Test set is used once, for the final numbers.
  * Second check: athlete-grouped CV (GroupKFold) = performance on athletes never seen in training.

Outputs (apex_results/): comparison tables, metrics.json, error analysis, figures.
Models   : readiness_model.pkl, injury_model.pkl (refit on all 180 days for deployment), model_meta.json
"""
import json, time, warnings
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.ensemble import (RandomForestRegressor, RandomForestClassifier,
                              HistGradientBoostingRegressor, HistGradientBoostingClassifier)
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.metrics import (mean_absolute_error, mean_squared_error, r2_score, roc_auc_score,
                             average_precision_score, brier_score_loss, precision_recall_fscore_support,
                             confusion_matrix, precision_recall_curve)
from sklearn.calibration import calibration_curve
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from apex_features import (NUMERIC_FEATURES, CATEGORICAL_FEATURES, MODEL_FEATURES,
                           prepare_training_frame, PlattCalibrated)

warnings.filterwarnings("ignore")
SEED = 42
OUT, FIG = "apex_results", "apex_results/figures"
N_ATHLETES = 40
TRAIN_LAST_DAY, TEST_FIRST_DAY = 123, 131      # days 124-130 = embargo

# ----------------------------------------------------------------------------
# 1. Data + feature engineering + split
# ----------------------------------------------------------------------------
print("Loading dataset ...")
raw = pd.read_csv("apex_cricket_football_athlete_dataset.csv", parse_dates=["Date"])
df = prepare_training_frame(raw)
df["Day"] = (df["Date"] - df["Date"].min()).dt.days + 1

train = df[df.Day <= TRAIN_LAST_DAY].sort_values(["Date", "Athlete_ID"]).reset_index(drop=True)
test = df[df.Day >= TEST_FIRST_DAY].sort_values(["Date", "Athlete_ID"]).reset_index(drop=True)
print(f"Train rows {len(train)} (days 1-{TRAIN_LAST_DAY}) | embargo days {TRAIN_LAST_DAY+1}-{TEST_FIRST_DAY-1} | test rows {len(test)} (days {TEST_FIRST_DAY}-180)")

Xtr, Xte = train[MODEL_FEATURES], test[MODEL_FEATURES]
yr_tr, yr_te = train["Readiness_Score"], test["Readiness_Score"]
yi_tr, yi_te = train["Injury_Next_7_Days"], test["Injury_Next_7_Days"]
print(f"Injury prevalence: train {yi_tr.mean():.2%} ({yi_tr.sum()} pos) | test {yi_te.mean():.2%} ({yi_te.sum()} pos)")

# time-ordered CV: 7-day gap (7 days x 40 athletes rows) so label windows never overlap folds
tscv = TimeSeriesSplit(n_splits=4, gap=7 * N_ATHLETES)


def preprocessor(scale: bool):
    num = [("imp", SimpleImputer(strategy="median"))] + ([("sc", StandardScaler())] if scale else [])
    return ColumnTransformer([("num", Pipeline(num), NUMERIC_FEATURES),
                              ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES)])


def fmt_params(p):
    return ", ".join(f"{k.split('__')[-1]}={v}" for k, v in p.items()) if p else "-"


def tune(pipe, space, X, y, scoring, n_iter=10):
    t0 = time.time()
    size = int(np.prod([len(v) for v in space.values()]))
    s = RandomizedSearchCV(pipe, space, n_iter=min(n_iter, size), scoring=scoring, cv=tscv,
                           random_state=SEED, n_jobs=-1, refit=True)
    s.fit(X, y)
    return s.best_estimator_, s.best_params_, s.best_score_, time.time() - t0


# ----------------------------------------------------------------------------
# 2. READINESS (regression)
# ----------------------------------------------------------------------------
print("\n=== READINESS (regression) ===")
reg_models = {
    "Ridge Regression": (Pipeline([("pre", preprocessor(True)), ("m", Ridge())]),
                         {"m__alpha": [0.01, 0.1, 1, 10, 100, 1000]}),
    "Random Forest": (Pipeline([("pre", preprocessor(False)), ("m", RandomForestRegressor(random_state=SEED, n_jobs=-1))]),
                      {"m__n_estimators": [100, 200, 300], "m__max_depth": [6, 10, 14, None],
                       "m__min_samples_leaf": [3, 5, 10, 20], "m__max_features": ["sqrt", 0.5, 1.0]}),
    "Gradient Boosting (HistGB)": (Pipeline([("pre", preprocessor(False)), ("m", HistGradientBoostingRegressor(random_state=SEED))]),
                                   {"m__learning_rate": [0.03, 0.05, 0.1], "m__max_depth": [3, 5, None],
                                    "m__max_iter": [100, 200, 300], "m__min_samples_leaf": [10, 20, 40],
                                    "m__l2_regularization": [0.0, 1.0, 10.0]}),
}
rows, fitted_reg = [], {}
base = Pipeline([("pre", preprocessor(False)), ("m", DummyRegressor(strategy="mean"))]).fit(Xtr, yr_tr)
p = base.predict(Xte)
# validation score of the baseline with the same time-CV
from sklearn.model_selection import cross_val_score
base_val = -cross_val_score(Pipeline([("pre", preprocessor(False)), ("m", DummyRegressor())]), Xtr, yr_tr, cv=tscv, scoring="neg_mean_absolute_error").mean()
rows.append(dict(Model="Baseline (predict train mean)", Best_Hyperparameters="-", Val_MAE=base_val,
                 Test_MAE=mean_absolute_error(yr_te, p), Test_RMSE=mean_squared_error(yr_te, p) ** .5, Test_R2=r2_score(yr_te, p), Fit_sec=0.0))
for name, (pipe, space) in reg_models.items():
    est, bp, sc, secs = tune(pipe, space, Xtr, yr_tr, "neg_mean_absolute_error")
    p = est.predict(Xte); fitted_reg[name] = (est, bp)
    rows.append(dict(Model=name, Best_Hyperparameters=fmt_params(bp), Val_MAE=-sc, Test_MAE=mean_absolute_error(yr_te, p),
                     Test_RMSE=mean_squared_error(yr_te, p) ** .5, Test_R2=r2_score(yr_te, p), Fit_sec=secs))
    print(f"{name:28s} val MAE {-sc:.2f} | test MAE {rows[-1]['Test_MAE']:.2f}  R2 {rows[-1]['Test_R2']:.3f}")
reg_tab = pd.DataFrame(rows)
reg_tab.to_csv(f"{OUT}/comparison_readiness.csv", index=False)
best_reg_name = min(fitted_reg, key=lambda k: reg_tab.set_index("Model").loc[k, "Val_MAE"])  # chosen on VALIDATION only
best_reg, best_reg_params = fitted_reg[best_reg_name]
print("Selected readiness model (by validation MAE):", best_reg_name)

# ----------------------------------------------------------------------------
# 3. INJURY (imbalanced classification)
# ----------------------------------------------------------------------------
print("\n=== INJURY RISK (classification) ===")
clf_models = {
    "Logistic Regression": (Pipeline([("pre", preprocessor(True)), ("m", LogisticRegression(class_weight="balanced", max_iter=3000))]),
                            {"m__C": [0.001, 0.01, 0.1, 1, 10]}),
    "Random Forest": (Pipeline([("pre", preprocessor(False)), ("m", RandomForestClassifier(class_weight="balanced_subsample", random_state=SEED, n_jobs=-1))]),
                      {"m__n_estimators": [150, 300], "m__max_depth": [4, 6, 8, 12], "m__min_samples_leaf": [10, 20, 40],
                       "m__max_features": ["sqrt", 0.5]}),
    "Gradient Boosting (HistGB)": (Pipeline([("pre", preprocessor(False)), ("m", HistGradientBoostingClassifier(class_weight="balanced", random_state=SEED))]),
                                   {"m__learning_rate": [0.02, 0.05, 0.1], "m__max_depth": [2, 3, 4], "m__max_iter": [100, 200, 300],
                                    "m__min_samples_leaf": [20, 40, 80], "m__l2_regularization": [0.0, 1.0, 10.0]}),
}


def clf_metrics(y, s):
    return dict(Test_ROC_AUC=roc_auc_score(y, s), Test_PR_AUC=average_precision_score(y, s))


rows, fitted_clf = [], {}
rows.append(dict(Model="Baseline A (no skill, prior)", Best_Hyperparameters="-", Val_PR_AUC=float(yi_tr.mean()),
                 Test_ROC_AUC=0.5, Test_PR_AUC=float(yi_te.mean()), Fit_sec=0.0))
# Baseline B = the classic sports-science rule: risk rises with ACWR (score = ACWR)
rows.append(dict(Model="Baseline B (ACWR-only rule)", Best_Hyperparameters="score = ACWR", Val_PR_AUC=average_precision_score(yi_tr, train["ACWR"]),
                 **clf_metrics(yi_te, test["ACWR"]), Fit_sec=0.0))
for name, (pipe, space) in clf_models.items():
    est, bp, sc, secs = tune(pipe, space, Xtr, yi_tr, "average_precision")
    s = est.predict_proba(Xte)[:, 1]; fitted_clf[name] = (est, bp)
    rows.append(dict(Model=name, Best_Hyperparameters=fmt_params(bp), Val_PR_AUC=sc, **clf_metrics(yi_te, s), Fit_sec=secs))
    print(f"{name:28s} val PR-AUC {sc:.3f} | test ROC-AUC {rows[-1]['Test_ROC_AUC']:.3f}  PR-AUC {rows[-1]['Test_PR_AUC']:.3f}")

# Additional model for comparison: Random Forest + SMOTE (as in the first version of the project)
rf_best_params = {k.replace("m__", ""): v for k, v in fitted_clf["Random Forest"][1].items()}
smote_pipe = ImbPipeline([("pre", preprocessor(False)), ("smote", SMOTE(random_state=SEED)),
                          ("m", RandomForestClassifier(random_state=SEED, n_jobs=-1, **rf_best_params))])
vs = []
for tr_i, va_i in tscv.split(Xtr):
    m = clone(smote_pipe).fit(Xtr.iloc[tr_i], yi_tr.iloc[tr_i]); vs.append(average_precision_score(yi_tr.iloc[va_i], m.predict_proba(Xtr.iloc[va_i])[:, 1]))
smote_pipe.fit(Xtr, yi_tr); s = smote_pipe.predict_proba(Xte)[:, 1]
rows.append(dict(Model="Random Forest + SMOTE (additional)", Best_Hyperparameters="RF best params + SMOTE", Val_PR_AUC=float(np.mean(vs)),
                 **clf_metrics(yi_te, s), Fit_sec=0.0))
clf_tab = pd.DataFrame(rows)
clf_tab.to_csv(f"{OUT}/comparison_injury.csv", index=False)
print(f"{'RF + SMOTE (additional)':28s} val PR-AUC {np.mean(vs):.3f} | test ROC-AUC {rows[-1]['Test_ROC_AUC']:.3f}  PR-AUC {rows[-1]['Test_PR_AUC']:.3f}")

best_clf_name = max(fitted_clf, key=lambda k: clf_tab.set_index("Model").loc[k, "Val_PR_AUC"])  # chosen on VALIDATION only
best_clf, best_clf_params = fitted_clf[best_clf_name]
print("Selected injury model (by validation PR-AUC):", best_clf_name)


# ---- probability calibration (Platt) fitted on time-ordered OOF scores of the TRAIN set ----
def oof_scores(model, X, y, cv):
    idx, sc = [], []
    for a, b in cv.split(X):
        m = clone(model).fit(X.iloc[a], y.iloc[a])
        idx.append(b); sc.append(m.predict_proba(X.iloc[b])[:, 1])
    return np.concatenate(idx), np.concatenate(sc)


cal_cv = TimeSeriesSplit(n_splits=5, gap=7 * N_ATHLETES)
oi, osc = oof_scores(best_clf, Xtr, yi_tr, cal_cv)
cal = PlattCalibrated(best_clf).fit_calibrator(osc, yi_tr.iloc[oi].values)
oof_p = cal.calibrate(osc)

raw_te = best_clf.predict_proba(Xte)[:, 1]
cal_te = cal.predict_proba(Xte)[:, 1]
inj_final = dict(
    raw_brier=brier_score_loss(yi_te, raw_te), cal_brier=brier_score_loss(yi_te, cal_te),
    brier_no_skill=brier_score_loss(yi_te, np.full(len(yi_te), yi_tr.mean())),
    roc_auc=roc_auc_score(yi_te, cal_te), pr_auc=average_precision_score(yi_te, cal_te),
    mean_pred=float(cal_te.mean()), test_prevalence=float(yi_te.mean()))
print(f"Calibration: Brier raw {inj_final['raw_brier']:.4f} -> calibrated {inj_final['cal_brier']:.4f} (no-skill {inj_final['brier_no_skill']:.4f}); "
      f"mean predicted {inj_final['mean_pred']:.3f} vs observed {inj_final['test_prevalence']:.3f}")

# operating points chosen on TRAIN OOF only
yo = yi_tr.iloc[oi].values
pr, rc, th = precision_recall_curve(yo, oof_p)
f1 = 2 * pr[:-1] * rc[:-1] / np.clip(pr[:-1] + rc[:-1], 1e-9, None)
t_f1 = float(th[np.argmax(f1)])
t_mod, t_high = float(np.quantile(oof_p, 0.75)), float(np.quantile(oof_p, 0.92))
print(f"Thresholds (from train OOF): F1-optimal {t_f1:.3f} | Moderate (top 25%) {t_mod:.3f} | High (top 8%) {t_high:.3f}")

pred = (cal_te >= t_f1).astype(int)
prec, rec, f1s, _ = precision_recall_fscore_support(yi_te, pred, average="binary", zero_division=0)
cm = confusion_matrix(yi_te, pred)
inj_final.update(threshold_f1=t_f1, precision=prec, recall=rec, f1=f1s, confusion_matrix=cm.tolist(),
                 t_moderate=t_mod, t_high=t_high)
print(f"At F1 threshold: precision {prec:.3f} recall {rec:.3f} F1 {f1s:.3f}\nConfusion matrix [[TN FP],[FN TP]]:\n{cm}")
band = pd.cut(cal_te, [-1, t_mod, t_high, 2], labels=["Low", "Moderate", "High"])
band_tab = pd.DataFrame({"band": band, "y": yi_te.values}).groupby("band", observed=True).y.agg(["count", "sum", "mean"])
band_tab["lift_vs_base"] = band_tab["mean"] / yi_te.mean()
print("\nTest injury rate per risk band:\n", band_tab.round(3))
band_tab.to_csv(f"{OUT}/risk_band_validation.csv")

# ----------------------------------------------------------------------------
# 4. Second evaluation: unseen ATHLETES (GroupKFold)
# ----------------------------------------------------------------------------
print("\n=== Unseen-athlete evaluation (GroupKFold, 5 folds, all 180 days) ===")
dfa = df.reset_index(drop=True)
Xa, ga = dfa[MODEL_FEATURES], dfa["Athlete_ID"]
gk = GroupKFold(n_splits=5)
g_reg, g_clf = [], []
for a, b in gk.split(Xa, groups=ga):
    m = clone(best_reg).fit(Xa.iloc[a], dfa["Readiness_Score"].iloc[a]); pp = m.predict(Xa.iloc[b])
    g_reg.append((mean_absolute_error(dfa["Readiness_Score"].iloc[b], pp), r2_score(dfa["Readiness_Score"].iloc[b], pp)))
    m = clone(best_clf).fit(Xa.iloc[a], dfa["Injury_Next_7_Days"].iloc[a]); pp = m.predict_proba(Xa.iloc[b])[:, 1]
    g_clf.append((roc_auc_score(dfa["Injury_Next_7_Days"].iloc[b], pp), average_precision_score(dfa["Injury_Next_7_Days"].iloc[b], pp)))
g_reg, g_clf = np.array(g_reg), np.array(g_clf)
group_res = dict(readiness_MAE=(g_reg[:, 0].mean(), g_reg[:, 0].std()), readiness_R2=(g_reg[:, 1].mean(), g_reg[:, 1].std()),
                 injury_ROC_AUC=(g_clf[:, 0].mean(), g_clf[:, 0].std()), injury_PR_AUC=(g_clf[:, 1].mean(), g_clf[:, 1].std()))
for k, v in group_res.items():
    print(f"  {k:16s} {v[0]:.3f} +/- {v[1]:.3f}")

# ----------------------------------------------------------------------------
# 5. Error analysis + interpretation + figures
# ----------------------------------------------------------------------------
print("\n=== Error analysis & interpretation ===")
ea = []
rp = best_reg.predict(Xte)
test = test.assign(Readiness_Pred=rp, Readiness_Err=rp - yr_te, Readiness_AbsErr=np.abs(rp - yr_te), Injury_Prob=cal_te, Injury_Pred=pred)
ea.append("# Error analysis\n\n## Readiness regression (" + best_reg_name + ")\n")
ea.append(f"Test MAE {mean_absolute_error(yr_te, rp):.2f}, RMSE {mean_squared_error(yr_te, rp)**.5:.2f}, R2 {r2_score(yr_te, rp):.3f}\n")
for col in ["Session_Type", "Sport", "Position"]:
    ea.append(f"MAE by {col}:\n```\n" + test.groupby(col).Readiness_AbsErr.mean().round(2).to_string() + "\n```\n")
ea.append("Largest 10 errors:\n```\n" + test.nlargest(10, "Readiness_AbsErr")[["Athlete_Name", "Date", "Session_Type", "Readiness_Score", "Readiness_Pred", "Readiness_Err"]].round(1).to_string(index=False) + "\n```\n")
ea.append(f"Share of predictions within +/-10 points: {(test.Readiness_AbsErr <= 10).mean():.1%}\n")

ea.append(f"\n## Injury classifier ({best_clf_name} + Platt calibration)\n")
ea.append(f"Confusion matrix at F1-optimal threshold {t_f1:.3f} [[TN, FP],[FN, TP]]: {cm.tolist()}\n")
test["ACWR_band"] = pd.cut(test.ACWR, [0, .8, 1.3, 1.5, 9], labels=["<0.8", "0.8-1.3", "1.3-1.5", ">1.5"])
fn = test[(test.Injury_Next_7_Days == 1) & (test.Injury_Pred == 0)]
fp = test[(test.Injury_Next_7_Days == 0) & (test.Injury_Pred == 1)]
tp = test[(test.Injury_Next_7_Days == 1) & (test.Injury_Pred == 1)]
cmp_cols = ["ACWR", "Sleep_Hours", "HRV_z", "Soreness_Score", "Acute_WoW"]
ea.append("Mean feature values: missed injuries (FN) vs caught (TP) vs false alarms (FP):\n```\n" +
          pd.DataFrame({"FN": fn[cmp_cols].mean(), "TP": tp[cmp_cols].mean(), "FP": fp[cmp_cols].mean()}).round(2).to_string() + "\n```\n")
ea.append("Recall by session type:\n```\n" + test[test.Injury_Next_7_Days == 1].groupby("Session_Type").Injury_Pred.agg(["mean", "count"]).round(2).to_string() + "\n```\n")
ea.append("Recall by sport:\n```\n" + test[test.Injury_Next_7_Days == 1].groupby("Sport").Injury_Pred.agg(["mean", "count"]).round(2).to_string() + "\n```\n")
ea.append("Test injury rate per risk band (Low / Moderate / High):\n```\n" + band_tab.round(3).to_string() + "\n```\n")
ea.append("Likely reasons for errors: (1) injuries in the synthetic data are probabilistic - many follow low-risk days (irreducible noise); "
          "(2) 7-day label windows make neighbouring days nearly identical; (3) few positive examples (see support); (4) high-risk spikes are rare, "
          "so the model has limited examples of ACWR > 1.5.\n")
open(f"{OUT}/error_analysis.md", "w").write("\n".join(ea))

# permutation importance on the untouched test set
imp_rows = {}
for tag, est, y, scoring in [("readiness", best_reg, yr_te, "neg_mean_absolute_error"), ("injury", best_clf, yi_te, "average_precision")]:
    pi = permutation_importance(est, Xte, y, scoring=scoring, n_repeats=10, random_state=SEED, n_jobs=-1)
    imp = pd.Series(pi.importances_mean, index=MODEL_FEATURES).sort_values(ascending=False)
    imp_rows[tag] = imp
    imp.to_csv(f"{OUT}/feature_importance_{tag}.csv", header=["importance"])
    top = imp.head(10)[::-1]
    plt.figure(figsize=(7, 4.5)); top.plot.barh(color="#2a9d8f" if tag == "readiness" else "#e76f51")
    plt.title(f"Permutation importance - {tag} ({'MAE' if tag=='readiness' else 'PR-AUC'} drop)"); plt.tight_layout()
    plt.savefig(f"{FIG}/imp_{tag}.png", dpi=140); plt.close()
    print(f"Top features ({tag}):", ", ".join(f"{k} {v:.3f}" for k, v in imp.head(6).items()))

# figures: predicted vs actual, residuals, calibration, PR curve, model comparison
fig, ax = plt.subplots(1, 2, figsize=(11, 4.2))
ax[0].scatter(yr_te, rp, s=6, alpha=.4); ax[0].plot([10, 100], [10, 100], "r--"); ax[0].set_xlabel("Actual readiness"); ax[0].set_ylabel("Predicted"); ax[0].set_title(f"Readiness: predicted vs actual ({best_reg_name})")
ax[1].hist(rp - yr_te, bins=40, color="#8d99ae"); ax[1].set_title("Residuals (pred - actual)")
plt.tight_layout(); plt.savefig(f"{FIG}/readiness_pred_vs_actual.png", dpi=140); plt.close()

fig, ax = plt.subplots(1, 3, figsize=(15, 4.2))
for s_, lab in [(raw_te, "uncalibrated"), (cal_te, "calibrated (Platt)")]:
    fr, mp = calibration_curve(yi_te, s_, n_bins=8, strategy="quantile"); ax[0].plot(mp, fr, "o-", label=lab)
ax[0].plot([0, .5], [0, .5], "k--"); ax[0].set_xlabel("Predicted probability"); ax[0].set_ylabel("Observed frequency"); ax[0].legend(); ax[0].set_title("Calibration curve (test)")
p_, r_, _ = precision_recall_curve(yi_te, cal_te); ax[1].plot(r_, p_); ax[1].axhline(yi_te.mean(), color="gray", ls="--"); ax[1].set_xlabel("Recall"); ax[1].set_ylabel("Precision"); ax[1].set_title(f"Precision-Recall (AP {inj_final['pr_auc']:.2f})")
ax[2].imshow(cm, cmap="Blues"); [ax[2].text(j, i, cm[i, j], ha="center", va="center") for i in range(2) for j in range(2)]
ax[2].set_xticks([0, 1]); ax[2].set_yticks([0, 1]); ax[2].set_xlabel("Predicted"); ax[2].set_ylabel("Actual"); ax[2].set_title(f"Confusion matrix @ threshold {t_f1:.2f}")
plt.tight_layout(); plt.savefig(f"{FIG}/injury_evaluation.png", dpi=140); plt.close()

fig, ax = plt.subplots(1, 2, figsize=(12, 4))
reg_tab.set_index("Model")[["Val_MAE", "Test_MAE"]].plot.barh(ax=ax[0]); ax[0].set_title("Readiness - MAE (lower is better)")
clf_tab.set_index("Model")[["Val_PR_AUC", "Test_PR_AUC"]].plot.barh(ax=ax[1]); ax[1].set_title("Injury - PR-AUC (higher is better)")
plt.tight_layout(); plt.savefig(f"{FIG}/model_comparison.png", dpi=140); plt.close()

# ----------------------------------------------------------------------------
# 6. Deployment models: refit on ALL 180 days, save
# ----------------------------------------------------------------------------
print("\nRefitting selected models on all data for deployment ...")
dfa_sorted = df.sort_values(["Date", "Athlete_ID"]).reset_index(drop=True)
Xall = dfa_sorted[MODEL_FEATURES]
final_reg = clone(best_reg).fit(Xall, dfa_sorted["Readiness_Score"])
yall = dfa_sorted["Injury_Next_7_Days"]
oi2, osc2 = oof_scores(best_clf, Xall, yall, cal_cv)
final_clf = PlattCalibrated(clone(best_clf).fit(Xall, yall)).fit_calibrator(osc2, yall.iloc[oi2].values)
oof_all = final_clf.calibrate(osc2)
t_mod_f, t_high_f = float(np.quantile(oof_all, 0.75)), float(np.quantile(oof_all, 0.92))
joblib.dump(final_reg, "readiness_model.pkl")
joblib.dump(final_clf, "injury_model.pkl")
print("-> saved readiness_model.pkl, injury_model.pkl")

meta = dict(
    features=MODEL_FEATURES, numeric=NUMERIC_FEATURES, categorical=CATEGORICAL_FEATURES,
    readiness_model=best_reg_name, readiness_params=fmt_params(best_reg_params),
    injury_model=best_clf_name, injury_params=fmt_params(best_clf_params), calibration="Platt scaling on time-ordered OOF scores",
    split=dict(train_days="1-123", embargo_days="124-130", test_days="131-180", train_rows=len(train), test_rows=len(test)),
    thresholds=dict(moderate=t_mod_f, high=t_high_f, f1_optimal=t_f1),
    base_rate=float(df.Injury_Next_7_Days.mean()),
    readiness_status=dict(optimal=int(round(df.Readiness_Score.quantile(0.70))), fatigued=int(round(df.Readiness_Score.quantile(0.20)))),  # data-driven bands: top 30% / bottom 20%
    test_metrics=dict(readiness=reg_tab.iloc[[0] + [1 + list(fitted_reg).index(best_reg_name)]].to_dict("records"), injury=inj_final),
    unseen_athlete_cv={k: list(v) for k, v in group_res.items()},
    note="SYNTHETIC data - demonstration only, not for clinical or selection decisions.",
)
json.dump(meta, open("model_meta.json", "w"), indent=2, default=float)
json.dump(dict(readiness_table=reg_tab.round(4).to_dict("records"), injury_table=clf_tab.round(4).to_dict("records"),
               injury_final=inj_final, unseen_athlete_cv=meta["unseen_athlete_cv"]), open(f"{OUT}/metrics.json", "w"), indent=2, default=float)

# PBL-style comparison tables (markdown)
def md(tab, cols):
    return "| " + " | ".join(cols) + " |\n|" + "---|" * len(cols) + "\n" + "\n".join(
        "| " + " | ".join(f"{r[c]:.3f}" if isinstance(r[c], float) else str(r[c]) for c in cols) + " |" for _, r in tab.iterrows())
with open(f"{OUT}/model_comparison_tables.md", "w") as f:
    f.write("## Readiness (regression)\n\n" + md(reg_tab, ["Model", "Best_Hyperparameters", "Val_MAE", "Test_MAE", "Test_RMSE", "Test_R2"]))
    f.write("\n\n## Injury (classification)\n\n" + md(clf_tab, ["Model", "Best_Hyperparameters", "Val_PR_AUC", "Test_ROC_AUC", "Test_PR_AUC"]))
print("\n=== DONE ===")
print(reg_tab[["Model", "Val_MAE", "Test_MAE", "Test_R2"]].round(3).to_string(index=False))
print(clf_tab[["Model", "Val_PR_AUC", "Test_ROC_AUC", "Test_PR_AUC"]].round(3).to_string(index=False))

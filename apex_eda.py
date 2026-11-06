"""
apex_eda.py - Data understanding, data-quality check and EDA (PBL stages 3-5).
Writes figures to apex_results/figures and a text summary to apex_results/eda_summary.md
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

OUT = "apex_results"
FIG = os.path.join(OUT, "figures")
os.makedirs(FIG, exist_ok=True)
sns.set_theme(style="whitegrid")

df = pd.read_csv("apex_cricket_football_athlete_dataset.csv")
df["Date"] = pd.to_datetime(df["Date"])
lines = []
def log(s=""):
    print(s); lines.append(s)

# ---------------- 3. Dataset understanding ----------------
log("# APEX - Dataset understanding & EDA summary\n")
log("## Dataset summary")
log(f"- Observations: {len(df):,}  | Columns: {df.shape[1]}")
log(f"- Athletes: {df.Athlete_ID.nunique()} ({df.groupby('Sport').Athlete_ID.nunique().to_dict()})")
log(f"- Period: {df.Date.min().date()} to {df.Date.max().date()} ({df.groupby('Athlete_ID').Date.nunique().unique().tolist()} days per athlete)")
log("- Identifier columns: Athlete_ID, Athlete_Name, Date (not used as model features)")
log("- Targets: Readiness_Score (regression), Injury_Next_7_Days (binary classification)")
cat_cols = df.select_dtypes("object").columns.tolist()
num_cols = [c for c in df.select_dtypes("number").columns]
log(f"- Categorical: {cat_cols}")
log(f"- Numerical: {num_cols}\n")

# ---------------- 4. Data quality ----------------
log("## Data quality")
miss = df.isna().sum()
miss = miss[miss > 0]
log("Missing values (count / %):")
for c, v in miss.items():
    log(f"  - {c}: {v} ({v/len(df):.2%})")
log(f"- Duplicate full rows: {df.duplicated().sum()}  | duplicate (Athlete_ID, Date): {df.duplicated(['Athlete_ID','Date']).sum()}")
log(f"- Daily_Load == Session_Duration x sRPE on {(df.Daily_Load == df.Session_Duration*df.sRPE).mean():.1%} of rows")
log(f"- ACWR == Acute/Chronic on {(abs(df.ACWR - df.Acute_Load/df.Chronic_Load) < 0.01).mean():.1%} of rows")
rest = df[df.Session_Type == "Rest"]
log(f"- Rest rows: {len(rest)} (non-zero duration on {(rest.Session_Duration > 0).sum()})")
log("- Value ranges: " + ", ".join(f"{c} [{df[c].min():.1f}, {df[c].max():.1f}]" for c in ["Sleep_Hours", "HRV_ms", "Soreness_Score", "sRPE", "ACWR", "Readiness_Score"]))

log("\nOutliers (IQR rule, 1.5xIQR):")
for c in ["Session_Duration", "Total_Distance", "High_Speed_Running", "Accelerations_Decelerations", "Sleep_Hours", "HRV_ms", "Acute_Load", "ACWR", "Readiness_Score"]:
    q1, q3 = df[c].quantile([.25, .75]); iqr = q3 - q1
    n = ((df[c] < q1 - 1.5*iqr) | (df[c] > q3 + 1.5*iqr)).sum()
    log(f"  - {c}: {n} ({n/len(df):.1%})")
log("  Decision: outliers are physiologically plausible (match days, load spikes), so they are KEPT; "
    "tree models are robust and linear models use StandardScaler.")

# ---------------- 5. EDA ----------------
y = df.Injury_Next_7_Days
log("\n## Target analysis")
log(f"- Readiness_Score: mean {df.Readiness_Score.mean():.1f}, std {df.Readiness_Score.std():.1f}, range [{df.Readiness_Score.min():.1f}, {df.Readiness_Score.max():.1f}]")
log(f"- Injury_Next_7_Days: positives {y.sum()} ({y.mean():.2%}) vs {len(y)-y.sum()} negatives (imbalance ~{(1-y.mean())/y.mean():.0f}:1)")
bands = pd.cut(df.ACWR, [0, .8, 1.0, 1.3, 1.5, 9], labels=["<0.8", "0.8-1.0", "1.0-1.3", "1.3-1.5", ">1.5"])
tab = df.groupby(bands, observed=True).Injury_Next_7_Days.agg(["mean", "sum", "count"])
log("\nInjury rate by ACWR band:\n" + tab.round(3).to_string())
for name, b in [("Sleep_Hours", [0, 6.5, 7.5, 12]), ("HRV_ms", [0, 45, 55, 65, 200]), ("Soreness_Score", [0, 1, 2, 3, 4, 5])]:
    log(f"\nInjury rate by {name}:\n" + df.groupby(pd.cut(df[name], b), observed=True).Injury_Next_7_Days.mean().round(3).to_string())

# figures
fig, ax = plt.subplots(1, 2, figsize=(11, 4))
sns.histplot(df.Readiness_Score, bins=40, kde=True, ax=ax[0], color="#2a9d8f"); ax[0].set_title("Readiness_Score distribution")
sns.countplot(x=y, ax=ax[1], color="#e76f51"); ax[1].set_title("Injury_Next_7_Days (class imbalance)")
for p in ax[1].patches: ax[1].annotate(int(p.get_height()), (p.get_x()+p.get_width()/2, p.get_height()), ha="center", va="bottom")
plt.tight_layout(); plt.savefig(f"{FIG}/01_targets.png", dpi=140); plt.close()

fig, ax = plt.subplots(1, 3, figsize=(15, 4))
tab["mean"].mul(100).plot.bar(ax=ax[0], color="#e76f51"); ax[0].set_title("Injury rate (%) by ACWR band"); ax[0].set_xlabel("ACWR band")
df.groupby(pd.cut(df.Sleep_Hours, [0, 6, 6.5, 7, 7.5, 8, 12]), observed=True).Injury_Next_7_Days.mean().mul(100).plot.bar(ax=ax[1], color="#264653"); ax[1].set_title("Injury rate (%) by sleep hours")
df.groupby("Soreness_Score").Injury_Next_7_Days.mean().mul(100).plot.bar(ax=ax[2], color="#f4a261"); ax[2].set_title("Injury rate (%) by soreness score")
plt.tight_layout(); plt.savefig(f"{FIG}/02_injury_drivers.png", dpi=140); plt.close()

num = ["Session_Duration", "Total_Distance", "High_Speed_Running", "Accelerations_Decelerations", "sRPE", "Daily_Load",
       "Sleep_Hours", "Soreness_Score", "HRV_ms", "Acute_Load", "Chronic_Load", "ACWR", "Readiness_Score", "Injury_Next_7_Days"]
plt.figure(figsize=(11, 8.5)); sns.heatmap(df[num].corr(), annot=True, fmt=".2f", cmap="coolwarm", center=0, annot_kws={"size": 7})
plt.title("Correlation matrix"); plt.tight_layout(); plt.savefig(f"{FIG}/03_correlation.png", dpi=140); plt.close()

fig, ax = plt.subplots(1, 3, figsize=(15, 4))
sns.boxplot(data=df, x="Session_Type", y="Daily_Load", hue="Sport", ax=ax[0]); ax[0].set_title("Daily load by session type")
sns.boxplot(data=df, x="Position", y="Total_Distance", ax=ax[1]); ax[1].tick_params(axis="x", rotation=60); ax[1].set_title("Distance by position")
sns.boxplot(data=df, x="Sport", y="HRV_ms", ax=ax[2]); ax[2].set_title("HRV by sport")
plt.tight_layout(); plt.savefig(f"{FIG}/04_session_position.png", dpi=140); plt.close()

plt.figure(figsize=(8, 3.5)); (df.isna().mean()[lambda s: s > 0] * 100).sort_values().plot.barh(color="#8d99ae")
plt.title("Missing values (%) - wearable/self-report/GPS dropouts"); plt.xlabel("%"); plt.tight_layout(); plt.savefig(f"{FIG}/05_missing.png", dpi=140); plt.close()

a = df[df.Athlete_ID == df.Athlete_ID.iloc[0]].sort_values("Date")
fig, ax = plt.subplots(2, 1, figsize=(11, 6), sharex=True)
ax[0].plot(a.Date, a.Acute_Load, label="Acute (7d)"); ax[0].plot(a.Date, a.Chronic_Load, label="Chronic (28d, weekly units)"); ax[0].legend(); ax[0].set_title(f"{a.Athlete_Name.iloc[0]} - rolling loads")
ax[1].plot(a.Date, a.ACWR, color="#e76f51"); ax[1].axhspan(0.8, 1.3, color="green", alpha=.12); ax[1].axhline(1.5, color="red", ls="--"); ax[1].scatter(a.Date[a.Injury_Next_7_Days == 1], a.ACWR[a.Injury_Next_7_Days == 1], color="k", s=12, label="injury-window days"); ax[1].legend(); ax[1].set_title("ACWR (green = 0.8-1.3 sweet spot)")
plt.tight_layout(); plt.savefig(f"{FIG}/06_athlete_timeseries.png", dpi=140); plt.close()

with open(f"{OUT}/eda_summary.md", "w") as f:
    f.write("\n".join(lines))
print("\nSaved figures to", FIG)

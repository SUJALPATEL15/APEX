## Readiness (regression)

| Model | Best_Hyperparameters | Val_MAE | Test_MAE | Test_RMSE | Test_R2 |
|---|---|---|---|---|---|
| Baseline (predict train mean) | - | 10.287 | 9.895 | 12.963 | -0.004 |
| Ridge Regression | alpha=1 | 5.510 | 5.152 | 6.488 | 0.749 |
| Random Forest | n_estimators=200, min_samples_leaf=3, max_features=1.0, max_depth=14 | 5.677 | 5.394 | 6.733 | 0.729 |
| Gradient Boosting (HistGB) | min_samples_leaf=40, max_iter=200, max_depth=3, learning_rate=0.05, l2_regularization=1.0 | 5.430 | 5.170 | 6.470 | 0.750 |

## Injury (classification)

| Model | Best_Hyperparameters | Val_PR_AUC | Test_ROC_AUC | Test_PR_AUC |
|---|---|---|---|---|
| Baseline A (no skill, prior) | - | 0.086 | 0.500 | 0.093 |
| Baseline B (ACWR-only rule) | score = ACWR | 0.099 | 0.657 | 0.163 |
| Logistic Regression | C=0.001 | 0.160 | 0.670 | 0.206 |
| Random Forest | n_estimators=150, min_samples_leaf=40, max_features=sqrt, max_depth=4 | 0.149 | 0.686 | 0.219 |
| Gradient Boosting (HistGB) | min_samples_leaf=20, max_iter=100, max_depth=3, learning_rate=0.02, l2_regularization=0.0 | 0.152 | 0.631 | 0.194 |
| Random Forest + SMOTE (additional) | RF best params + SMOTE | 0.135 | 0.671 | 0.178 |
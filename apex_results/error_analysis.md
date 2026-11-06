# Error analysis

## Readiness regression (Gradient Boosting (HistGB))

Test MAE 5.17, RMSE 6.47, R2 0.750

MAE by Session_Type:
```
Session_Type
Match       4.72
Recovery    5.46
Rest        5.10
Taper       4.94
Training    5.16
```

MAE by Sport:
```
Sport
Cricket     5.35
Football    4.99
```

MAE by Position:
```
Position
All-rounder            5.43
Batter                 5.23
Bowler                 5.89
Defender               5.76
Forward                4.68
Goalkeeper             5.41
Midfielder             4.77
Wicketkeeper-Batter    4.72
```

Largest 10 errors:
```
          Athlete_Name       Date Session_Type  Readiness_Score  Readiness_Pred  Readiness_Err
        Jasprit Bumrah 2025-05-29     Recovery             81.1            56.8          -24.2
Trent Alexander-Arnold 2025-06-20         Rest             81.6            57.8          -23.8
                 Rodri 2025-05-21        Match             24.5            46.0           21.5
          Shreyas Iyer 2025-05-20     Recovery             82.2            61.2          -21.0
           Steve Smith 2025-05-24     Training             69.9            49.4          -20.5
         Hardik Pandya 2025-06-29     Training             40.2            60.6           20.4
            Ruben Dias 2025-06-09        Taper             45.3            64.6           19.2
              KL Rahul 2025-05-22     Recovery             40.5            59.7           19.2
       Virgil van Dijk 2025-06-22     Training             41.8            60.1           18.3
           Pat Cummins 2025-06-17     Training             77.4            59.3          -18.2
```

Share of predictions within +/-10 points: 87.9%


## Injury classifier (Logistic Regression + Platt calibration)

Confusion matrix at F1-optimal threshold 0.105 [[TN, FP],[FN, TP]]: [[1409, 405], [95, 91]]

Mean feature values: missed injuries (FN) vs caught (TP) vs false alarms (FP):
```
                  FN    TP    FP
ACWR            1.03  1.25  1.12
Sleep_Hours     8.10  7.05  7.29
HRV_z           0.21 -0.91 -0.73
Soreness_Score  1.49  2.43  2.45
Acute_WoW       1.11  1.37  1.24
```

Recall by session type:
```
              mean  count
Session_Type             
Match         0.77     26
Recovery      0.46     26
Rest          0.35     26
Taper         0.63     27
Training      0.41     81
```

Recall by sport:
```
          mean  count
Sport                
Cricket   0.53    101
Football  0.44     85
```

Test injury rate per risk band (Low / Moderate / High):
```
          count  sum   mean  lift_vs_base
band                                     
Low        1546  106  0.069         0.737
Moderate    288   41  0.142         1.531
High        166   39  0.235         2.526
```

Likely reasons for errors: (1) injuries in the synthetic data are probabilistic - many follow low-risk days (irreducible noise); (2) 7-day label windows make neighbouring days nearly identical; (3) few positive examples (see support); (4) high-risk spikes are rare, so the model has limited examples of ACWR > 1.5.

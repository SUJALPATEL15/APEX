# APEX - Dataset understanding & EDA summary

## Dataset summary
- Observations: 7,200  | Columns: 20
- Athletes: 40 ({'Cricket': 20, 'Football': 20})
- Period: 2025-01-01 to 2025-06-29 ([180] days per athlete)
- Identifier columns: Athlete_ID, Athlete_Name, Date (not used as model features)
- Targets: Readiness_Score (regression), Injury_Next_7_Days (binary classification)
- Categorical: ['Athlete_ID', 'Athlete_Name', 'Sport', 'Position', 'Session_Type']
- Numerical: ['Session_Duration', 'Total_Distance', 'High_Speed_Running', 'Accelerations_Decelerations', 'sRPE', 'Daily_Load', 'Sleep_Hours', 'Soreness_Score', 'HRV_ms', 'Acute_Load', 'Chronic_Load', 'ACWR', 'Readiness_Score', 'Injury_Next_7_Days']

## Data quality
Missing values (count / %):
  - Total_Distance: 102 (1.42%)
  - High_Speed_Running: 101 (1.40%)
  - Accelerations_Decelerations: 126 (1.75%)
  - Sleep_Hours: 104 (1.44%)
  - Soreness_Score: 112 (1.56%)
  - HRV_ms: 107 (1.49%)
- Duplicate full rows: 0  | duplicate (Athlete_ID, Date): 0
- Daily_Load == Session_Duration x sRPE on 100.0% of rows
- ACWR == Acute/Chronic on 100.0% of rows
- Rest rows: 867 (non-zero duration on 8)
- Value ranges: Sleep_Hours [4.2, 10.9], HRV_ms [17.0, 99.0], Soreness_Score [1.0, 5.0], sRPE [0.0, 9.0], ACWR [0.4, 2.1], Readiness_Score [15.0, 92.7]

Outliers (IQR rule, 1.5xIQR):
  - Session_Duration: 587 (8.2%)
  - Total_Distance: 80 (1.1%)
  - High_Speed_Running: 154 (2.1%)
  - Accelerations_Decelerations: 132 (1.8%)
  - Sleep_Hours: 39 (0.5%)
  - HRV_ms: 4 (0.1%)
  - Acute_Load: 22 (0.3%)
  - ACWR: 319 (4.4%)
  - Readiness_Score: 304 (4.2%)
  Decision: outliers are physiologically plausible (match days, load spikes), so they are KEPT; tree models are robust and linear models use StandardScaler.

## Target analysis
- Readiness_Score: mean 57.2, std 13.4, range [15.0, 92.7]
- Injury_Next_7_Days: positives 635 (8.82%) vs 6565 negatives (imbalance ~10:1)

Injury rate by ACWR band:
          mean  sum  count
ACWR                      
<0.8     0.043   60   1381
0.8-1.0  0.078  184   2348
1.0-1.3  0.112  292   2615
1.3-1.5  0.117   67    575
>1.5     0.114   32    281

Injury rate by Sleep_Hours:
Sleep_Hours
(0.0, 6.5]     0.233
(6.5, 7.5]     0.102
(7.5, 12.0]    0.067

Injury rate by HRV_ms:
HRV_ms
(0, 45]      0.138
(45, 55]     0.075
(55, 65]     0.084
(65, 200]    0.073

Injury rate by Soreness_Score:
Soreness_Score
(0, 1]    0.060
(1, 2]    0.111
(2, 3]    0.105
(3, 4]    0.176
(4, 5]    0.245
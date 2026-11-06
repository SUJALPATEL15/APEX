import pandas as pd
import numpy as np
from datetime import timedelta
import os
import shutil

np.random.seed(42)
ORIGINAL_FILE = "apex_cricket_football_athlete_dataset.csv"
BACKUP_DIR = "backup"
os.makedirs(BACKUP_DIR, exist_ok=True)
if os.path.exists(ORIGINAL_FILE):
    shutil.copy(ORIGINAL_FILE, os.path.join(BACKUP_DIR, ORIGINAL_FILE))

# Load existing identities
df_old = pd.read_csv(ORIGINAL_FILE)
athletes = df_old[['Athlete_ID', 'Athlete_Name', 'Sport', 'Position']].drop_duplicates().to_dict('records')

start_date = pd.to_datetime("2025-01-01")
pre_history_days = 28
total_days = 180
all_days = pre_history_days + total_days

def generate_athlete_data(athlete):
    base_hrv = np.random.uniform(45, 80)
    hrv_std = np.random.uniform(5, 8)
    base_sleep = np.random.uniform(7.5, 8.5)
    
    while True:
        athlete_data = []
        injury_cooldown = 0
        acute_q = np.full(7, 450.0)
        chronic_q = np.full(28, 450.0)
        
        fitness, fatigue = 0, 0
        injury_events_count = 0
        prior_injury_timer = 999
        labels_mask = np.zeros(all_days)
        spike_weeks = np.random.choice(range(2, 25), size=np.random.randint(2, 6), replace=False)
        
        for day_idx in range(all_days):
            current_date = start_date - timedelta(days=pre_history_days - day_idx)
            is_recorded = day_idx >= pre_history_days
            week_idx = day_idx // 7
            is_spike_week = week_idx in spike_weeks
            
            # Force ~13-14% match share
            cycle_day = day_idx % 7
            is_match_day = (cycle_day == 0)
            
            if injury_cooldown > 0:
                session_type = 'Recovery' 
                injury_cooldown -= 1
                prior_injury_timer += 1
            else:
                if is_match_day: session_type = 'Match'
                elif cycle_day == 1: session_type = 'Recovery'
                elif cycle_day == 2: session_type = 'Rest'
                elif cycle_day == 5: session_type = 'Taper'
                else: session_type = 'Training'
                prior_injury_timer += 1
            
            if session_type == 'Rest':
                duration, srpe, distance = 0, 0, 0
            else:
                if athlete['Sport'] == 'Football':
                    if session_type == 'Match':
                        duration, srpe, distance = 90, np.random.randint(7, 10), np.random.uniform(8000, 12000)
                    elif session_type == 'Training':
                        duration, srpe, distance = np.random.randint(50, 90), np.random.randint(5, 7), np.random.uniform(4000, 7000)
                        if is_spike_week: duration += 30; srpe += 2; distance += 2000
                    else: 
                        duration, srpe, distance = np.random.randint(30, 60), np.random.randint(2, 4), np.random.uniform(2000, 4000)
                else:
                    if session_type == 'Match':
                        duration, srpe, distance = np.random.randint(180, 360), np.random.randint(6, 9), np.random.uniform(4000, 12000)
                    elif session_type == 'Training':
                        duration, srpe, distance = np.random.randint(90, 150), np.random.randint(4, 7), np.random.uniform(3000, 7000)
                        if is_spike_week: duration += 60; srpe += 2; distance += 2000
                    else:
                        duration, srpe, distance = np.random.randint(40, 60), np.random.randint(2, 4), np.random.uniform(1000, 3000)
            
            temp_chronic = max(350.0, np.mean(chronic_q) * 7)
            target_daily = duration * srpe
            proj_acute = sum(acute_q[1:]) + target_daily
            
            # Dynamically push load constraints to keep true ACWR bounded between 0.46 and 2.05 organically
            if proj_acute > 1.88 * temp_chronic:
                target_daily = max(0, (1.88 * temp_chronic) - sum(acute_q[1:]))
            elif proj_acute < 0.46 * temp_chronic:
                target_daily = max(0, (0.46 * temp_chronic) - sum(acute_q[1:]))
            
            if target_daily == 0:
                duration, srpe, distance, hsr, accels = 0, 0, 0, 0, 0
            else:
                srpe = max(1, srpe)
                duration = max(1, int(round(target_daily / srpe)))
                if athlete['Sport'] == 'Football':
                    hsr, accels = distance * np.random.uniform(0.03, 0.12), int(distance * np.random.uniform(0.01, 0.02))
                else:
                    hsr, accels = distance * 0.08, int(distance * 0.02)
            
            daily_load = duration * srpe
            acute_q = np.roll(acute_q, -1); acute_q[-1] = daily_load
            chronic_q = np.roll(chronic_q, -1); chronic_q[-1] = daily_load
            
            acute_load = float(np.sum(acute_q))
            chronic_load = float(np.mean(chronic_q) * 7)
            # True unclipped math mapping
            acwr = acute_load / chronic_load if chronic_load > 0 else 1.0
            
            sleep = np.clip(np.random.normal(base_sleep, 0.8) - (0.6 if session_type == 'Match' or is_spike_week else 0), 4.0, 11.0)
            hrv = np.clip(np.random.normal(base_hrv, hrv_std) - (daily_load / 120), 25, 130)
            soreness = 1 if session_type == 'Rest' else np.clip(int(np.random.normal(2.0, 1.0) + (1.2 if session_type == 'Match' else 0)), 1, 5)
            
            fitness = 0.9 * fitness + 0.1 * daily_load
            fatigue = 0.5 * fatigue + 0.5 * daily_load
            latent_state = fitness - fatigue
            
            readiness_score = 62 + latent_state * 0.04 + (hrv - base_hrv) * 0.5 + (sleep - base_sleep) * 3.0 - (soreness - 1) * 4.0 + np.random.normal(0, 6)
            readiness_score = np.clip(readiness_score, 15.0, 95.0)
            
            # Injury Logic (Calibrated for >1.5x ratios organically)
            if is_recorded and injury_cooldown == 0 and session_type not in ['Rest', 'Recovery']:
                risk = 0.003
                if acwr > 1.5: risk *= 4.0
                elif acwr > 1.3: risk *= 2.0
                elif acwr < 0.8: risk *= 1.3
                if sleep < 6.5: risk *= 2.5
                if hrv < (base_hrv - hrv_std): risk *= 2.5
                if soreness >= 4: risk *= 2.0
                
                if np.random.rand() < risk:
                    injury_events_count += 1
                    prior_injury_timer = 0
                    start_idx = max(pre_history_days, day_idx - 6)
                    labels_mask[start_idx:day_idx+1] = 1
                    injury_cooldown = np.random.randint(7, 21)
                    
                    # Probabilistic Pre-Injury Biomechanical Drop (40% events have strong lead-up signals)
                    if np.random.rand() < 0.4:
                        for back_idx in range(start_idx, day_idx+1):
                            idx_in_arr = back_idx - pre_history_days
                            if 0 <= idx_in_arr < len(athlete_data):
                                athlete_data[idx_in_arr]['Sleep_Hours'] = round(max(4.0, athlete_data[idx_in_arr]['Sleep_Hours'] - 1.2), 2)
                                athlete_data[idx_in_arr]['HRV_ms'] -= 8.0
                                athlete_data[idx_in_arr]['Soreness_Score'] = min(5, athlete_data[idx_in_arr]['Soreness_Score'] + 1)
            
            if is_recorded:
                athlete_data.append({
                    'Athlete_ID': athlete['Athlete_ID'], 'Athlete_Name': athlete['Athlete_Name'],
                    'Sport': athlete['Sport'], 'Position': athlete['Position'], 'Date': current_date.strftime('%Y-%m-%d'),
                    'Session_Type': session_type, 'Session_Duration': duration,
                    'Total_Distance': int(round(distance)), 'High_Speed_Running': int(round(hsr)), 'Accelerations_Decelerations': int(round(accels)),
                    'sRPE': srpe, 'Daily_Load': daily_load, 'Sleep_Hours': round(sleep, 2), 'Soreness_Score': int(soreness), 'HRV_ms': int(round(hrv)),
                    'Acute_Load': round(acute_load, 2), 'Chronic_Load': round(chronic_load, 2),
                    'ACWR': round(acwr, 3), 'Readiness_Score': round(readiness_score, 2)
                })
        
        if 2 <= injury_events_count <= 4:
            df_ath = pd.DataFrame(athlete_data)
            df_ath['Injury_Next_7_Days'] = labels_mask[pre_history_days:].astype(int)
            return df_ath

all_dfs = []
for ath in athletes:
    all_dfs.append(generate_athlete_data(ath))

df_final = pd.concat(all_dfs, ignore_index=True)

# Missing values (~1.5%)
for col in ['HRV_ms', 'Sleep_Hours', 'Soreness_Score', 'Total_Distance', 'High_Speed_Running', 'Accelerations_Decelerations']:
    mask = np.random.rand(len(df_final)) < 0.015
    df_final.loc[mask, col] = pd.NA

# Nullable Integer / Float typing
for col in ['Session_Duration', 'Total_Distance', 'High_Speed_Running', 'Accelerations_Decelerations', 
            'sRPE', 'Daily_Load', 'Soreness_Score', 'HRV_ms', 'Injury_Next_7_Days']:
    df_final[col] = df_final[col].astype('Int64')

for col in ['Sleep_Hours', 'Acute_Load', 'Chronic_Load', 'ACWR', 'Readiness_Score']:
    df_final[col] = df_final[col].astype('Float64')

df_final.to_csv(ORIGINAL_FILE, index=False)
print("Apex dataset regenerated successfully.")
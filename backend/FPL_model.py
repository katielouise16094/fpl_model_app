import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor

# Feature definitions - must match model training
DEFENSIVE_FEATURES = [
    "now_cost", 
    "form", 
    "next_3_gw_fixtures", 
    "clean_sheets", 
    "saves"
]

ATTACKING_FEATURES = [
    "now_cost",
    "form",
    "next_3_gw_fixtures",
    "expected_goals",
    "expected_assists",
    "threat"
]

# Load scraped data
df = pd.read_csv("/Users/katiepowl/fpl-improver/backend/players.csv")

# Split into Defensive & Attacking Players (Ensure using copies to avoid SettingWithCopyWarning)
df_defensive = df[df["element_type"].isin([1, 2])].copy()  # Goalkeepers & Defenders
df_attacking = df[df["element_type"].isin([3, 4])].copy()  # Midfielders & Forwards

print("Checking for missing values in defensive features:")
print(df_defensive[DEFENSIVE_FEATURES].isnull().sum())

print("\nChecking for missing values in attacking features:")
print(df_attacking[ATTACKING_FEATURES].isnull().sum())

# Fill any missing values before training
df_defensive[DEFENSIVE_FEATURES] = df_defensive[DEFENSIVE_FEATURES].fillna(0)
df_attacking[ATTACKING_FEATURES] = df_attacking[ATTACKING_FEATURES].fillna(0)

# Function to estimate expected points 
# Update these functions in FPL_model.py

def estimate_defensive_expected_points(row):
    # Extract data (convert to float to avoid NaN issues)
    form = float(row.get("form", 0))          # form is already per-game
    saves = float(row.get("saves", 0))        
    clean_sheets = float(row.get("clean_sheets", 0))
    fixture_diff = float(row.get("next_3_gw_fixtures", 3))
    minutes = float(row.get("minutes", 0))    
    
    # Calculate per-game averages 
    games_played = max(1, minutes / 90)      # estimate games played
    saves_per_game = saves / games_played
    cs_per_game = clean_sheets / games_played
    
    # Points calculation (scaled to 3 GWs)
    base_points = form * 3                  # form is  per-GW
    saves_points = saves_per_game * 3 
    cs_points = cs_per_game * 3 * 4.5           
    
    # Fixture modifier 
    fixture_modifier = max(0.8, 1.2 - (fixture_diff - 3) * 0.1)
    
    # Total expected points
    expected_points = ((base_points + saves_points + cs_points) * fixture_modifier)*0.7
    expected_points *= min(1.0, minutes / (3 * 90)) 
    
    return round(expected_points, 2)

def estimate_attacking_expected_points(row):
    # Extract data
    form = float(row.get("form", 0))          # form is per-game
    threat = float(row.get("threat", 0))
    xG = float(row.get("expected_goals", 0))  
    xA = float(row.get("expected_assists", 0))
    fixture_diff = float(row.get("next_3_gw_fixtures", 3))
    minutes = float(row.get("minutes", 0))    
    
    # Per-game averages
    games_played = max(1, minutes / 90)
    xG_per_game = xG / games_played
    xA_per_game = xA / games_played
    
    # Points calculation (3 GWs)
    base_points = form * 2.4                  
    xG_points = xG_per_game * 3 * 4          
    xA_points = xA_per_game * 3 * 3           
    threat_points = threat * 0.01             
    
    # Fixture modifier
    fixture_modifier = max(0.7, 1.3 - (fixture_diff - 3) * 0.15)
    
    # Total expected points 
    expected_points = ((base_points + xG_points + xA_points + threat_points) * fixture_modifier)*0.5
    expected_points *= min(1.0, minutes / (3 * 90))  
    
    return round(expected_points, 2)
# Estimate expected points for each player
df_defensive.loc[:, "expected_points_next_3_gw"] = df_defensive.apply(estimate_defensive_expected_points, axis=1)
df_attacking.loc[:, "expected_points_next_3_gw"] = df_attacking.apply(estimate_attacking_expected_points, axis=1)

# Features & Targets for Defensive Players
defensive_features = ["now_cost", "form", "next_3_gw_fixtures", "clean_sheets", "saves"]
X_defensive = df_defensive[defensive_features]
y_defensive = df_defensive["expected_points_next_3_gw"]

# Features & Targets for Attacking Players
attacking_features = ["now_cost", "form", "next_3_gw_fixtures", "expected_goals", "expected_assists", "threat"]
X_attacking = df_attacking[attacking_features]
y_attacking = df_attacking["expected_points_next_3_gw"]

# Normalize Data
scaler_defensive = StandardScaler()
X_defensive_scaled = scaler_defensive.fit_transform(X_defensive)

scaler_attacking = StandardScaler()
X_attacking_scaled = scaler_attacking.fit_transform(X_attacking)

# Train Models
X_train_def, X_test_def, y_train_def, y_test_def = train_test_split(X_defensive_scaled, y_defensive, test_size=0.2, random_state=42)
model_defensive = RandomForestRegressor(n_estimators=250, random_state=42)
model_defensive.fit(X_train_def, y_train_def)

X_train_att, X_test_att, y_train_att, y_test_att = train_test_split(X_attacking_scaled, y_attacking, test_size=0.2, random_state=42)
model_attacking = RandomForestRegressor(n_estimators=250, random_state=42)
model_attacking.fit(X_train_att, y_train_att)

# Save Models and Scalers
joblib.dump(model_defensive, "backend/defensive_model.pkl")
joblib.dump(model_attacking, "backend/attacking_model.pkl")
joblib.dump(scaler_defensive, "backend/scaler_defensive.pkl")
joblib.dump(scaler_attacking, "backend/scaler_attacking.pkl")

print("✅ Defensive & Attacking Models Trained & Saved!")
print("✅ Scalers Saved!")
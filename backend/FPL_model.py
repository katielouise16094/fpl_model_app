import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor

# Load scraped data
df = pd.read_csv("/Users/katiepowl/fpl-improver/backend/players.csv")

# Split into Defensive & Attacking Players
df_defensive = df[df["element_type"].isin([1, 2])]  # Goalkeepers & Defenders
df_attacking = df[df["element_type"].isin([3, 4])]  # Midfielders & Forwards

# Features & Targets
defensive_features = ["now_cost", "form", "next_3_gw_fixtures", "clean_sheets", "saves"]
attacking_features = ["now_cost", "form", "next_3_gw_fixtures", "expected_goals", "expected_assists", "threat"]

X_defensive = df_defensive[defensive_features]
y_defensive = df_defensive["total_points"]

X_attacking = df_attacking[attacking_features]
y_attacking = df_attacking["total_points"]

# Normalize Data
scaler_defensive = StandardScaler()
X_defensive_scaled = scaler_defensive.fit_transform(X_defensive)

scaler_attacking = StandardScaler()
X_attacking_scaled = scaler_attacking.fit_transform(X_attacking)

# Train Models
X_train_def, X_test_def, y_train_def, y_test_def = train_test_split(X_defensive_scaled, y_defensive, test_size=0.2, random_state=42)
model_defensive = RandomForestRegressor(n_estimators=100, random_state=42)
model_defensive.fit(X_train_def, y_train_def)

X_train_att, X_test_att, y_train_att, y_test_att = train_test_split(X_attacking_scaled, y_attacking, test_size=0.2, random_state=42)
model_attacking = RandomForestRegressor(n_estimators=100, random_state=42)
model_attacking.fit(X_train_att, y_train_att)

# Save Models
joblib.dump(model_defensive, "backend/defensive_model.pkl")
joblib.dump(model_attacking, "backend/attacking_model.pkl")
joblib.dump(scaler_defensive, "backend/scaler_defensive.pkl")
joblib.dump(scaler_attacking, "backend/scaler_attacking.pkl")

print("✅ Defensive & Attacking Models Trained & Saved!")
import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

app = Flask(__name__)
CORS(app)

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

TEAM_MAP = {
    1: "Arsenal", 2: "Aston Villa", 3: "Bournemouth", 4: "Brentford",
    5: "Brighton", 6: "Chelsea", 7: "Crystal Palace", 8: "Everton",
    9: "Fulham", 10: "Leicester", 11: "Leeds", 12: "Liverpool",
    13: "Man City", 14: "Man Utd", 15: "Newcastle", 16: "Nott'm Forest",
    17: "Southampton", 18: "Spurs", 19: "West Ham", 20: "Wolves"
}

def load_models_and_data():
    try:
        required_files = [
            "backend/defensive_model.pkl",
            "backend/attacking_model.pkl",
            "backend/scaler_defensive.pkl",
            "backend/scaler_attacking.pkl",
            "backend/players.csv"
        ]
        
        for file in required_files:
            if not os.path.exists(file):
                raise FileNotFoundError(f"Missing file: {file}")

        models = {
            'defensive': joblib.load(required_files[0]),
            'attacking': joblib.load(required_files[1]),
            'scaler_defensive': joblib.load(required_files[2]),
            'scaler_attacking': joblib.load(required_files[3])
        }

        df = pd.read_csv(required_files[4])
        if df.empty:
            raise ValueError("Player data CSV is empty")
        
        # Ensure all required features exist
        for feature in DEFENSIVE_FEATURES + ATTACKING_FEATURES:
            if feature not in df.columns:
                raise ValueError(f"Missing feature: {feature}")
        
        df['team_name'] = df['team'].map(TEAM_MAP)
        return models, df

    except Exception as e:
        print(f"❌ Initialization error: {str(e)}")
        raise

try:
    models, df = load_models_and_data()
    print("✅ Models and data loaded successfully!")
except Exception as e:
    print(f"⚠️ Critical error during startup: {str(e)}")
    models = None
    df = None

@app.route("/analyse-squad", methods=["POST"])
def analyse_squad():
    try:
        data = request.get_json()
        squad_ids = [int(id) for id in data.get('squad', [])]
        
        squad_players = []
        for player_id in squad_ids:
            try:
                player = df[df['id'] == player_id].iloc[0].to_dict()
                
                # Debug: Print player data before prediction
                print(f"\nProcessing player {player_id}:")
                print("Raw features:", {k: player[k] for k in DEFENSIVE_FEATURES+ATTACKING_FEATURES if k in player})
                
                # Get correct features based on position
                if player['element_type'] in [1,2]:  # Defensive players
                    features = DEFENSIVE_FEATURES
                    scaler = models['scaler_defensive']
                    model = models['defensive']
                else:  # Attacking players
                    features = ATTACKING_FEATURES
                    scaler = models['scaler_attacking']
                    model = models['attacking']
                
                # Prepare features with fallback for missing values
                player_features = np.array([
                    player.get(feature, 0) for feature in features
                ]).reshape(1, -1)
                
                # Scale features
                scaled_features = scaler.transform(player_features)
                
                # Predict points
                predicted_points = model.predict(scaled_features)[0]
                print(f"Predicted points: {predicted_points}")
                
                squad_players.append({
                    "id": int(player['id']),
                    "web_name": str(player['web_name']),
                    "now_cost": float(player['now_cost']),
                    "predicted_points": float(predicted_points),
                    "element_type": int(player['element_type']),
                    "position": ["GK", "DEF", "MID", "FWD"][player['element_type']-1],
                    "team_name": str(player['team_name'])
                })
                
            except Exception as e:
                print(f"Error processing player {player_id}: {str(e)}")
                continue
                
        return jsonify({
            "status": "success",
            "squad_players": squad_players
        })
        
    except Exception as e:
        print(f"Analyze squad error: {str(e)}")
        return jsonify({
            "error": "Failed to analyze squad",
            "details": str(e)
        }), 500

@app.route("/predict", methods=["POST"])
def predict_transfers():
    try:
        data = request.get_json()
        print("Received prediction request:", data)  # Debug log
        
        # Validate input
        if not data or 'squad' not in data:
            return jsonify({"error": "Missing squad data"}), 400
            
        squad_ids = [int(id) for id in data.get('squad', [])]
        budget = float(data.get('budget', 0))
        free_transfers = int(data.get('free_transfers', 1))
        
        # Get current squad with predictions
        df_squad = df[df["id"].isin(squad_ids)].copy()
        if df_squad.empty:
            return jsonify({"error": "No matching squad players found"}), 400
        
        # Predict points for current squad
        for _, player in df_squad.iterrows():
            features = DEFENSIVE_FEATURES if player['element_type'] in [1,2] else ATTACKING_FEATURES
            scaler = models['scaler_defensive'] if player['element_type'] in [1,2] else models['scaler_attacking']
            model = models['defensive'] if player['element_type'] in [1,2] else models['attacking']
            
            player_features = pd.DataFrame([player])[features].fillna(0)
            scaled_features = scaler.transform(player_features)
            df_squad.loc[player.name, 'predicted_points'] = model.predict(scaled_features)[0]
        
        # Predict points for all available players
        df_available = df[~df["id"].isin(squad_ids)].copy()
        df_defensive = df_available[df_available["element_type"].isin([1,2])].copy()
        df_attacking = df_available[df_available["element_type"].isin([3,4])].copy()
        
        if not df_defensive.empty:
            X_def = models['scaler_defensive'].transform(df_defensive[DEFENSIVE_FEATURES].fillna(0))
            df_available.loc[df_defensive.index, 'predicted_points'] = models['defensive'].predict(X_def)
        
        if not df_attacking.empty:
            X_att = models['scaler_attacking'].transform(df_attacking[ATTACKING_FEATURES].fillna(0))
            df_available.loc[df_attacking.index, 'predicted_points'] = models['attacking'].predict(X_att)
        
        # Generate suggestions
        suggestions = []
        for _, squad_player in df_squad.iterrows():
            same_position = df_available[df_available["element_type"] == squad_player["element_type"]]
            affordable = same_position[same_position["now_cost"] <= (squad_player["now_cost"] + budget)]
            best_options = affordable.sort_values("predicted_points", ascending=False).head(free_transfers)
            
            for _, new_player in best_options.iterrows():
                suggestions.append({
                    "player_out": {
                        "id": int(squad_player["id"]),
                        "web_name": str(squad_player["web_name"]),
                        "now_cost": float(squad_player["now_cost"]),
                        "predicted_points": float(squad_player["predicted_points"]),
                        "element_type": int(squad_player["element_type"]),
                        "position": ["GK", "DEF", "MID", "FWD"][squad_player["element_type"]-1],
                        "team_name": str(squad_player["team_name"])
                    },
                    "player_in": {
                        "id": int(new_player["id"]),
                        "web_name": str(new_player["web_name"]),
                        "now_cost": float(new_player["now_cost"]),
                        "predicted_points": float(new_player["predicted_points"]),
                        "element_type": int(new_player["element_type"]),
                        "position": ["GK", "DEF", "MID", "FWD"][new_player["element_type"]-1],
                        "team_name": str(new_player["team_name"])
                    },
                    "points_gain": float(new_player["predicted_points"] - squad_player["predicted_points"]),
                    "cost_change": float(new_player["now_cost"] - squad_player["now_cost"])
                })
        
        return jsonify({
            "status": "success",
            "suggestions": sorted(suggestions, key=lambda x: x["points_gain"], reverse=True)[:free_transfers*3]
        })
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({
            "error": "Transfer prediction failed",
            "details": str(e),
            "request_data": data
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
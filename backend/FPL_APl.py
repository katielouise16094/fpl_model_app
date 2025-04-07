import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

# Initialize Flask app with CORS
app = Flask(__name__)
CORS(app)

def load_models_and_data():
    """Load models and data with proper error handling"""
    try:
        # Verify files exist
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

        # Load models and data
        models = {
            'defensive': joblib.load(required_files[0]),
            'attacking': joblib.load(required_files[1]),
            'scaler_defensive': joblib.load(required_files[2]),
            'scaler_attacking': joblib.load(required_files[3])
        }

        df = pd.read_csv(required_files[4])
        if df.empty:
            raise ValueError("Player data CSV is empty")

        return models, df

    except Exception as e:
        print(f"❌ Initialization error: {str(e)}")
        raise

# Load everything at startup
try:
    models, df = load_models_and_data()
    print("✅ Models and data loaded successfully!")
except Exception as e:
    print(f"⚠️ Critical error during startup: {str(e)}")
    models = None
    df = None

@app.route("/predict", methods=["POST"])
def predict_team():
    """Predict best transfers with proper DataFrame handling"""
    if df is None or models is None:
        return jsonify({"error": "Server not ready"}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Get parameters with validation
        squad = data.get('squad', [])
        budget = float(data.get('budget', 0))
        free_transfers = int(data.get('free_transfers', 0))
        
        # Create copies of the filtered DataFrames to avoid SettingWithCopyWarning
        df_defensive = df[df["element_type"].isin([1, 2])].copy()
        df_attacking = df[df["element_type"].isin([3, 4])].copy()

        # Define features
        def_features = ["now_cost", "form", "next_3_gw_fixtures", "clean_sheets", "saves"]
        att_features = ["now_cost", "form", "next_3_gw_fixtures", "expected_goals", "expected_assists", "threat"]

        # Scale features and predict - using .loc to avoid warnings
        df_defensive.loc[:, "predicted_points"] = models['defensive'].predict(
            models['scaler_defensive'].transform(df_defensive[def_features])
        )
        df_attacking.loc[:, "predicted_points"] = models['attacking'].predict(
            models['scaler_attacking'].transform(df_attacking[att_features])
        )

        # Combine predictions
        df_full = pd.concat([df_defensive, df_attacking])
        
        # Apply filters
        df_full = df_full[~df_full["id"].isin(squad)]
        df_full = df_full[df_full["now_cost"] <= budget]

        # Check if we have predictions
        if 'predicted_points' not in df_full.columns:
            raise ValueError("Prediction failed - no points calculated")

        # Get top transfers
        top_transfers = (
            df_full.sort_values("predicted_points", ascending=False)
            .head(free_transfers)
            .to_dict(orient="records")
        )

        return jsonify({
            "status": "success",
            "best_transfers": top_transfers
        })

    except Exception as e:
        app.logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            "error": "Prediction failed",
            "details": str(e)
        }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
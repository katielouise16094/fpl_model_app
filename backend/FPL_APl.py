import joblib
import pandas as pd
from flask import Flask, request, jsonify

# Load Models & Scalers
model_defensive = joblib.load("backend/defensive_model.pkl")
model_attacking = joblib.load("backend/attacking_model.pkl")
scaler_defensive = joblib.load("backend/scaler_defensive.pkl")
scaler_attacking = joblib.load("backend/scaler_attacking.pkl")

# Sample FPL Players Database (for recommendations)
df = pd.read_csv("backend/players.csv")

# Initialize Flask app
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "FPL AI API is running!"})

@app.route("/predict", methods=["POST"])
def predict_team():
    """
    Predicts best transfers based on user's current team, budget, and constraints.
    """
    # Get the data from the POST request
    data = request.get_json()

    # Extract input parameters from the request
    squad = data.get("squad", [])
    budget = data.get("budget", 0.0)
    free_transfers = data.get("free_transfers", 0)
    chips = data.get("chips", [])

    df_defensive = df[df["element_type"].isin([1, 2])]
    df_attacking = df[df["element_type"].isin([3, 4])]

    def_features = ["now_cost", "form", "next_3_gw_fixtures", "clean_sheets", "saves"]
    att_features = ["now_cost", "form", "next_3_gw_fixtures", "expected_goals", "expected_assists", "threat"]

    # Scale Features
    X_def_scaled = scaler_defensive.transform(df_defensive[def_features])
    X_att_scaled = scaler_attacking.transform(df_attacking[att_features])

    # Predict Points
    df_defensive["predicted_points"] = model_defensive.predict(X_def_scaled)
    df_attacking["predicted_points"] = model_attacking.predict(X_att_scaled)
    df["predicted_points"] = df_defensive["predicted_points"].combine_first(df_attacking["predicted_points"])

    # Filter players within budget
    df = df[df["now_cost"] <= budget]

    # Exclude players already in squad
    df = df[~df["id"].isin(squad)]

    # Sort by predicted points
    top_transfers = df.sort_values("predicted_points", ascending=False).head(free_transfers).to_dict(orient="records")

    return jsonify({"best_transfers": top_transfers})

    #    Run the Flask app locally
    if __name__ == "__main__":
        app.run(debug=True)


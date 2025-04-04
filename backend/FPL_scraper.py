import requests
import pandas as pd

# API Endpoints
FPL_API = "https://fantasy.premierleague.com/api/bootstrap-static/"
FIXTURE_API = "https://fantasy.premierleague.com/api/fixtures/"

def fetch_fpl_data():
    """Fetches FPL player data, fixtures, and assigns fixture difficulty from the FPL API."""
    
    # Fetch Player Data
    print("📥 Fetching FPL player data...")
    response = requests.get(FPL_API)
    players_data = response.json()["elements"]
    df = pd.DataFrame(players_data)

    # Fetch Fixture Data
    print("📥 Fetching fixture data...")
    fixtures = requests.get(FIXTURE_API).json()
    fixture_df = pd.DataFrame(fixtures)

    # Extract upcoming fixture difficulty
    fixture_difficulty = {}

    for fixture in fixtures:
        home_team = fixture["team_h"]
        away_team = fixture["team_a"]

        # Assign difficulty ratings for each team's fixtures
        if home_team not in fixture_difficulty:
            fixture_difficulty[home_team] = []
        if away_team not in fixture_difficulty:
            fixture_difficulty[away_team] = []

        fixture_difficulty[home_team].append(fixture["team_h_difficulty"])
        fixture_difficulty[away_team].append(fixture["team_a_difficulty"])

    # Compute average fixture difficulty for next 3 gameweeks
    avg_difficulty = {team: sum(difficulties[:3]) / len(difficulties[:3]) if difficulties else 3 
                      for team, difficulties in fixture_difficulty.items()}

    # Map difficulty to players based on team
    df['next_3_gw_fixtures'] = df['team'].map(lambda x: avg_difficulty.get(x, 3))

    # Select relevant columns
    df = df[[
        "id", "web_name", "team", "element_type", "now_cost", "total_points",
        "form", "ict_index", "influence", "creativity", "threat",
        "expected_goals", "expected_assists", "expected_goal_involvements",
        "saves", "clean_sheets", "next_3_gw_fixtures"
    ]]

    # Convert cost to millions
    df["now_cost"] = df["now_cost"] / 10

    # Save as CSV
    df.to_csv("backend/players.csv", index=False)
    print("✅ FPL player data scraped & saved to backend/players.csv!")

# Run scraper
if __name__ == "__main__":
    fetch_fpl_data()

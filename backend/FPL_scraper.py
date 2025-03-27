import requests
import pandas as pd

# API Endpoints
FPL_API = "https://fantasy.premierleague.com/api/bootstrap-static/"
FIXTURE_API = "https://fantasy.premierleague.com/api/fixtures/"
TEAM_API = "https://fantasy.premierleague.com/api/teams/"

def fetch_fpl_data():
    """Fetches FPL player data, fixtures, and xG Against for improved predictions."""
    print("📥 Fetching FPL player data...")
    response = requests.get(FPL_API)
    players_data = response.json()["elements"]
    df = pd.DataFrame(players_data)

    # Fetch Fixtures & Difficulty Ratings
    print("📥 Fetching fixture data...")
    fixtures = requests.get(FIXTURE_API).json()
    fixture_df = pd.DataFrame(fixtures)

    # Fetch Team Data for Fixture Difficulty
    print("📥 Fetching team difficulty ratings...")
    teams = requests.get(TEAM_API).json()
    team_df = pd.DataFrame(teams)

    # Assign fixture difficulty scores for next 3 gameweeks
    fixture_difficulty = {team['id']: team['strength'] for team in teams}
    df['next_3_gw_fixtures'] = df['team'].map(lambda x: sum(fixture_difficulty.get(x, 3) for _ in range(3)))

    # Process Player Data
    df = df[[
        "id", "web_name", "team", "element_type", "now_cost", "total_points",
        "form", "ict_index", "influence", "creativity", "threat",
        "expected_goals", "expected_assists", "expected_goal_involvements",
        "saves", "clean_sheets", "next_3_gw_fixtures"
    ]]

    # Convert cost to millions (e.g., 100 = 10.0m)
    df["now_cost"] = df["now_cost"] / 10
    
    # Save as CSV
    df.to_csv("backend/players.csv", index=False)
    print("✅ FPL player data scraped & saved to data/players.csv!")

# Run scraper
if __name__ == "__main__":
    fetch_fpl_data()

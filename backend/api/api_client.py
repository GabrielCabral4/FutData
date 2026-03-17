import os
import requests
import pandas as pd
from dotenv import load_dotenv


load_dotenv()

API_KEY = os.getenv("RAPIDAPI_KEY")
BASE_URL = "https://v3.football.api-sports.io"

headers = {
    "x-rapidapi-key": API_KEY,
    "x-rapidapi-host": "v3.football.api-sports.io"
}


def search_games_team(team_id, season):
    """
    Search the games of a specific team throughout a season.
    :param team_id: The ID of the team in API-Football.
    :param season: The year of the season that the games were played.
    :return: The results of the games that the teams specified played.
    """
    endpoint = f"{BASE_URL}/fixtures"
    params = {
        "team": team_id,
        "season": season
    }

    response = requests.get(endpoint, headers=headers, params=params)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error in the request: {response.status_code}")
        return None


if __name__ == "__main__":
    print("Searching for data in the API...")
    data = search_games_team(team_id=157, season=2024)

    if data:
        if 'response' in data and data['response']:
            games = data['response']
            print(f"It was found {len(games)} games. Processing the data...\n")

            clean_data = []

            for game in games:
                clean_data.append({
                    "match_id": game["fixture"]["id"],
                    "game_date": game["fixture"]["date"],
                    "championship": game["league"]["name"],
                    "home_team": game["teams"]["home"]["name"],
                    "away_team": game["teams"]["away"]["name"],
                    "home_goals": game["goals"]["home"],
                    "away_goals": game["goals"]["away"]
                })

            df_games = pd.DataFrame(clean_data)

            df_games['game_date'] = pd.to_datetime(df_games['game_date'])
            print(df_games.head())

            print(f"\nStructure of the data are ready for the database.")
            print(df_games.info())

            # if games:
            #     first_game = games[0]
            #     fixture = first_game['fixture']
            #     teams = first_game['teams']
            #
            #     print(f"\nExample of match:")
            #     print(f"Date: {fixture['date']}")
            #     print(f"Competition: {first_game['league']['name']}")
            #     print(f"Game: {teams['home']['name']} x {teams['away']['name']}")
            # else:
            #     print("\nThe API responded, but it didn't bring the list of games. See the raw return:")
            #     print(data)

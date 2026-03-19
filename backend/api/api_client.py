import os
import pandas as pd
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


class FootballDataPipeline:
    def __init__(self):
        self.api_key = os.getenv("RAPIDAPI_KEY")
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_KEY")
        )

    def search_team_by_name(self, team_name: str):
        """ Search for teams in the API for their name and returns a list of correspondences. """
        endpoint = f"{self.base_url}/teams"
        params = {"search": team_name}

        print(f"Searching IDs for the team: {team_name}")
        response = requests.get(endpoint, headers=self.headers, params=params)
        response.raise_for_status()

        data = response.json()

        if not data or 'response' not in data or len(data['response']) == 0:
            print("No team was found with this name.")
            return []

        teams_found = [{
            "team_id": item["team"]["id"],
            "name": item["team"]["name"],
            "country": item["team"]["country"]
        } for item in data['response']]

        return teams_found


    def fetch_games(self, team_id: int, season: int):
        """ Busca dados brutos da API. """
        endpoint = f"{self.base_url}/fixtures"
        params = {"team": team_id, "season": season}

        response = requests.get(endpoint, headers=self.headers, params=params)
        response.raise_for_status()  # Lança erro se a requisição falhar
        return response.json()

    @staticmethod
    def process_games(data):
        """ Limpa e transforma os dados. """
        if not data or 'response' not in data:
            return pd.DataFrame()

        clean_data = [{
            "match_id": game["fixture"]["id"],
            "game_date": game["fixture"]["date"],
            "championship": game["league"]["name"],
            "home_team": game["teams"]["home"]["name"],
            "away_team": game["teams"]["away"]["name"],
            "home_goals": game["goals"]["home"],
            "away_goals": game["goals"]["away"]
        } for game in data['response']]

        df = pd.DataFrame(clean_data)
        df['game_date'] = pd.to_datetime(df['game_date']).astype(str)
        return df

    def save_to_database(self, df: pd.DataFrame, table_name: str = 'matches'):
        """ Envia o DataFrame para o banco de dados. """
        if df.empty:
            print("Nenhum dado para salvar.")
            return None

        records = df.to_dict(orient='records')
        return self.supabase.table(table_name).upsert(records).execute()
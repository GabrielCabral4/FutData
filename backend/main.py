from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.api.api_client import FootballDataPipeline

app = FastAPI(title="FutData API", description="API for collecting and structuring football data.")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = FootballDataPipeline()

class SyncRequest(BaseModel):
    team_id: int
    season: int = 2024


@app.get("/")
def read_root():
    return {"message": "FutData API is working perfectly!"}

@app.get("/api/teams/search/{team_name}")
def search_team(team_name: str):
    """ Searches in the API-Football for the teams that correspond to the given name. """
    try:
        teams = pipeline.search_team_by_name(team_name)
        if not teams:
            raise HTTPException(status_code=404, detail="No team was found with this name.")
        return {"results": teams}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/teams/sync")
def sync_team_data(request: SyncRequest):
    """ Runs the pipeline ETL: Searches for games, cleans the data and save in the database. """
    try:
        print(f"Initiating synchronization for the Team ID: {request.team_id} | Season: {request.season}")

        raw_data = pipeline.fetch_games(team_id=request.team_id, season=request.season)
        df = pipeline.process_games(raw_data)

        if df.empty:
            return {
                "status": "Warning",
                "message": "No game was found to process.",
                "matches": []
            }

        pipeline.save_to_database(df)
        matches = df.to_dict(orient='records')

        return {
            "status": "Success",
            "message": f"Pipeline finished! {len(df)} games processed and saved in the database.",
            "count": len(matches),
            "matches": matches
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in the pipeline: {str(e)}")


@app.get("/api/matches")
def get_matches(limit: int = 50):
    """ Retrieves the latest matches from the database. """
    try:
        response = pipeline.supabase.table("matches").select("*").order("game_date", desc=True).limit(limit).execute()
        return {"matches": response.data, "count": len(response.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching matches: {str(e)}")

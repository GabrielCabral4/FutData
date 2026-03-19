from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.api.api_client import FootballDataPipeline

app = FastAPI(title="FutData API", description="API for collecting and structuring football data.")
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
                "message": "No game was found to process."
            }

        pipeline.save_to_database(df)

        return {
            "status": "Success",
            "message": f"Pipeline finished! {len(df)} games processed and saved in the database."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in the pipeline: {str(e)}")

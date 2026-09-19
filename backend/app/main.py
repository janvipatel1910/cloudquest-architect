from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.game import GameEngine


app = FastAPI(
    title="CloudQuest Architect API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8001",
        "http://127.0.0.1:8001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


games = {
    "mission_01": GameEngine("mission_01"),
    "mission_02": GameEngine("mission_02"),
}

# Keep Mission 1 as the default game so the existing frontend continues working.
game = games["mission_01"]


@app.get("/")
def root():
    return {
        "app": "CloudQuest Architect",
        "status": "online"
    }


@app.get("/api/mission")
def get_mission():
    mission = game.mission

    return {
        "mission_id": mission["mission_id"],
        "title": mission["title"],
        "level": mission["level"],
        "xp_reward": mission["xp_reward"],
        "scenario": mission["scenario"],
        "total_questions": len(mission["questions"])
    }


@app.get("/api/missions/{mission_id}")
def get_mission_by_id(mission_id: str):
    if mission_id not in games:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    selected_game = games[mission_id]
    mission = selected_game.mission

    return {
        "mission_id": mission["mission_id"],
        "title": mission["title"],
        "level": mission["level"],
        "xp_reward": mission["xp_reward"],
        "scenario": mission["scenario"],
        "total_questions": len(mission["questions"])
    }


@app.get("/api/question")
def get_question():
    question = game.get_current_question()

    if question is None:
        return {
            "status": "complete",
            "message": "All architecture decisions are complete."
        }

    return {
        "status": "active",
        "question": {
            "id": question["id"],
            "question": question["question"],
            "options": question["options"]
        },
        "progress": game.get_progress()
    }


@app.get("/api/progress")
def get_progress():
    return game.get_progress()


class AnswerSubmission(BaseModel):
    answer: str


@app.post("/api/answer")
def submit_answer(submission: AnswerSubmission):
    result = game.submit_answer(submission.answer)

    return {
        "result": result,
        "progress": game.get_progress()
    }


@app.get("/api/architecture")
def get_architecture():
    if not game.architecture_unlocked:
        return {
            "status": "locked",
            "message": "Complete all architecture decisions first."
        }

    architecture = game.mission["architecture"]

    safe_slots = [
        {
            "id": slot["id"],
            "label": slot["label"]
        }
        for slot in architecture["slots"]
    ]

    return {
        "status": "unlocked",
        "slots": safe_slots,
        "components": architecture["components"],
        "clues": game.unlocked_clues,
        "progress": game.get_progress()
    }


class ArchitectureSubmission(BaseModel):
    placements: dict[str, str]


@app.post("/api/architecture/review")
def review_architecture(submission: ArchitectureSubmission):
    result = game.review_architecture(
        submission.placements
    )

    return {
        "result": result,
        "progress": game.get_progress()
    }

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

# Existing frontend continues to use Mission 1 as its default mission.
game = games["mission_01"]


class AnswerSubmission(BaseModel):
    answer: str


class ArchitectureSubmission(BaseModel):
    placements: dict[str, str]


def get_game(mission_id: str):
    return games.get(mission_id)


def build_mission_response(selected_game):
    mission = selected_game.mission

    return {
        "mission_id": mission["mission_id"],
        "title": mission["title"],
        "level": mission["level"],
        "xp_reward": mission["xp_reward"],
        "scenario": mission["scenario"],
        "total_questions": len(mission["questions"])
    }


def build_question_response(selected_game):
    question = selected_game.get_current_question()

    if question is None:
        return {
            "status": "complete",
            "message": "All architecture decisions are complete.",
            "progress": selected_game.get_progress()
        }

    return {
        "status": "active",
        "question": {
            "id": question["id"],
            "title": question.get("title"),
            "question": question["question"],
            "options": question["options"]
        },
        "progress": selected_game.get_progress()
    }


def build_architecture_response(selected_game):
    if not selected_game.architecture_unlocked:
        return {
            "status": "locked",
            "message": "Complete all architecture decisions first."
        }

    architecture = selected_game.mission["architecture"]

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
        "clues": selected_game.unlocked_clues,
        "progress": selected_game.get_progress()
    }


@app.get("/")
def root():
    return {
        "app": "CloudQuest Architect",
        "status": "online"
    }


# -------------------------------------------------
# Existing Mission 1 routes
# -------------------------------------------------

@app.get("/api/mission")
def get_mission():
    return build_mission_response(game)


@app.get("/api/question")
def get_question():
    return build_question_response(game)


@app.get("/api/progress")
def get_progress():
    return game.get_progress()


@app.post("/api/answer")
def submit_answer(submission: AnswerSubmission):
    result = game.submit_answer(submission.answer)

    return {
        "result": result,
        "progress": game.get_progress()
    }


@app.get("/api/architecture")
def get_architecture():
    return build_architecture_response(game)


@app.post("/api/architecture/review")
def review_architecture(submission: ArchitectureSubmission):
    result = game.review_architecture(
        submission.placements
    )

    return {
        "result": result,
        "progress": game.get_progress()
    }


# -------------------------------------------------
# Multi-mission routes
# -------------------------------------------------

@app.get("/api/missions/{mission_id}")
def get_mission_by_id(mission_id: str):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    return build_mission_response(selected_game)


@app.get("/api/missions/{mission_id}/question")
def get_mission_question(mission_id: str):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    return build_question_response(selected_game)


@app.get("/api/missions/{mission_id}/progress")
def get_mission_progress(mission_id: str):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    return selected_game.get_progress()


@app.post("/api/missions/{mission_id}/answer")
def submit_mission_answer(
    mission_id: str,
    submission: AnswerSubmission
):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    result = selected_game.submit_answer(submission.answer)

    return {
        "result": result,
        "progress": selected_game.get_progress()
    }


@app.get("/api/missions/{mission_id}/architecture")
def get_mission_architecture(mission_id: str):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    return build_architecture_response(selected_game)


@app.post("/api/missions/{mission_id}/architecture/review")
def review_mission_architecture(
    mission_id: str,
    submission: ArchitectureSubmission
):
    selected_game = get_game(mission_id)

    if selected_game is None:
        return {
            "status": "not_found",
            "message": f"Mission not found: {mission_id}"
        }

    result = selected_game.review_architecture(
        submission.placements
    )

    return {
        "result": result,
        "progress": selected_game.get_progress()
    }

import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
MISSION_FILE = BASE_DIR / "data" / "missions" / "mission_01.json"


class GameEngine:
    def __init__(self):
        self.mission = self._load_mission()
        self.current_question = 1
        self.unlocked_clues = []
	self.architecture_unlocked = False
	self.architecture_approved = False
	self.deployment_unlocked = False

    def _load_mission(self):
        with open(MISSION_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    def get_current_question(self):
        questions = self.mission["questions"]

        if self.current_question > len(questions):
            return None

        return questions[self.current_question - 1]

    def submit_answer(self, answer):
        question = self.get_current_question()

        if question is None:
            return {
                "status": "questions_complete",
                "message": "All architecture clues have been collected."
            }

        answer = answer.upper().strip()

        if answer != question["correct_answer"]:
            return {
                "status": "incorrect",
                "question_id": question["id"],
                "hint": question["wrong_hint"],
                "clues_unlocked": len(self.unlocked_clues),
                "total_clues": len(self.mission["questions"])
            }

        self.unlocked_clues.append(
            {
                "question_id": question["id"],
                "clue": question["clue"]
            }
        )

        self.current_question += 1

        if self.current_question > len(self.mission["questions"]):
            self.architecture_unlocked = True

        return {
            "status": "correct",
            "clue": question["clue"],
            "clues_unlocked": len(self.unlocked_clues),
            "total_clues": len(self.mission["questions"]),
            "architecture_unlocked": self.architecture_unlocked
        }

def review_architecture(self, submitted_architecture):
    if not self.architecture_unlocked:
        return {
            "status": "locked",
            "message": "Collect all architecture clues before submitting a design."
        }

    architecture = self.mission["architecture"]
    slots = architecture["slots"]

    errors = []

    for slot in slots:
        slot_id = slot["id"]
        expected = slot["correct_component"]
        submitted = submitted_architecture.get(slot_id)

        if submitted != expected:
            errors.append({
                "slot": slot_id,
                "label": slot["label"],
                "hint": f"Reconsider the component placed in the {slot['label']}."
            })

    if errors:
        return {
            "status": "not_approved",
            "message": "ARCHITECTURE NOT APPROVED",
            "errors": errors,
            "deployment_unlocked": False
        }

    self.architecture_approved = True
    self.deployment_unlocked = True

    return {
        "status": "approved",
        "message": "ARCHITECTURE APPROVED",
        "deployment_unlocked": True
    }
    def get_progress(self):
        return {
            "current_question": self.current_question,
            "clues_unlocked": len(self.unlocked_clues),
            "total_clues": len(self.mission["questions"]),
            "architecture_unlocked": self.architecture_unlocked
	    "architecture_approved": self.architecture_approved,
            "deployment_unlocked": self.deployment_unlocked   
   }

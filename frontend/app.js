const API_BASE_URL = "http://127.0.0.1:8002";

const questionText = document.getElementById("question-text");
const questionProgress = document.getElementById("question-progress");
const answerOptions = document.getElementById("answer-options");
const submitButton = document.getElementById("submit-answer");
const cluesUnlocked = document.getElementById("clues-unlocked");
const feedback = document.getElementById("feedback");

let selectedAnswer = null;


async function loadQuestion() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/question`);

        if (!response.ok) {
            throw new Error("Unable to load mission question.");
        }

        const data = await response.json();

        if (data.status === "complete") {
            questionText.textContent =
                "All architecture decisions are complete.";

            answerOptions.innerHTML = "";
            submitButton.disabled = true;

            return;
        }

        renderQuestion(data);

    } catch (error) {
        questionText.textContent =
            "Unable to connect to the CloudQuest mission server.";

        answerOptions.innerHTML = "";

        console.error(error);
    }
}


function renderQuestion(data) {
    const question = data.question;
    const progress = data.progress;

    selectedAnswer = null;
    submitButton.disabled = true;

    feedback.classList.add("hidden");
    feedback.textContent = "";

    questionProgress.textContent =
        `Decision ${question.id} of ${progress.total_clues}`;

    questionText.textContent = question.question;

    cluesUnlocked.textContent = progress.clues_unlocked;

    answerOptions.innerHTML = "";

    question.options.forEach((option) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "answer-option";

        button.innerHTML =
            `<strong>${option.id}</strong> &nbsp; ${option.text}`;

        button.addEventListener("click", () => {
            selectAnswer(option.id, button);
        });

        answerOptions.appendChild(button);
    });
}


function selectAnswer(answerId, selectedButton) {
    selectedAnswer = answerId;

    document
        .querySelectorAll(".answer-option")
        .forEach((button) => {
            button.classList.remove("selected");
        });

    selectedButton.classList.add("selected");
    submitButton.disabled = false;
}


submitButton.addEventListener("click", async () => {
    if (submitButton.dataset.action === "continue") {
        submitButton.dataset.action = "";
        submitButton.textContent = "Submit Decision";

        await loadQuestion();
        return;
    }   

 if (!selectedAnswer) {
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking Decision...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                answer: selectedAnswer
            })
        });

        if (!response.ok) {
            throw new Error("Unable to validate decision.");
        }

        const data = await response.json();
        const result = data.result;

        feedback.classList.remove("hidden");

        if (result.status === "incorrect") {
            feedback.innerHTML =
                `<strong>❌ REQUIREMENT MISMATCH</strong><br>` +
                `${result.hint}`;

            submitButton.disabled = false;
            submitButton.textContent = "Try Decision Again";

            return;
        }

if (result.status === "correct") {
    cluesUnlocked.textContent = result.clues_unlocked;

    feedback.innerHTML =
        `<strong>✓ DECISION ACCEPTED</strong><br>` +
        `🧩 Clue ${result.clues_unlocked} unlocked:<br>` +
        `${result.clue}`;

    selectedAnswer = null;

    document
        .querySelectorAll(".answer-option")
        .forEach((button) => {
            button.disabled = true;
        });

    if (result.architecture_unlocked) {
        submitButton.textContent = "Enter Architecture Board";
    } else {
        submitButton.textContent = "Continue Mission";
    }

    submitButton.disabled = false;
    submitButton.dataset.action = "continue";
}
    } catch (error) {
        feedback.classList.remove("hidden");
        feedback.textContent =
            "Unable to reach the mission server. Try again.";

        submitButton.disabled = false;
        submitButton.textContent = "Submit Decision";

        console.error(error);
    }
});
loadQuestion();

const API_BASE_URL = "http://127.0.0.1:8002";

const questionText = document.getElementById("question-text");
const questionProgress = document.getElementById("question-progress");
const answerOptions = document.getElementById("answer-options");
const submitButton = document.getElementById("submit-answer");
const cluesUnlocked = document.getElementById("clues-unlocked");
const feedback = document.getElementById("feedback");

let selectedAnswer = null;
let selectedComponent = null;
let architecturePlacements = {};


async function loadQuestion() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/question`);

        if (!response.ok) {
            throw new Error("Unable to load mission question.");
        }

        const data = await response.json();

        if (data.status === "complete") {
            questionProgress.textContent = "Decisions Complete";
            questionText.textContent =
                "All architecture clues have been collected.";

            answerOptions.innerHTML = "";

            cluesUnlocked.textContent = "5";

            feedback.classList.remove("hidden");
            feedback.innerHTML =
                "<strong>✓ ARCHITECTURE BOARD UNLOCKED</strong><br>" +
                "Your clues are ready. Build the client architecture.";

            submitButton.textContent = "Enter Architecture Board";
            submitButton.dataset.action = "architecture";
            submitButton.disabled = false;

            const architectureStage =
                document.getElementById("architecture-stage");

            architectureStage.classList.remove("locked");

            const architectureStatus =
                architectureStage.querySelector("small");

            architectureStatus.textContent = "UNLOCKED";

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
    if (submitButton.dataset.action === "architecture") {
        await loadArchitectureBoard();
        return;
    }

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
        submitButton.dataset.action = "architecture";
    } else {
        submitButton.textContent = "Continue Mission";
        submitButton.dataset.action = "continue";
    }

    submitButton.disabled = false;
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


async function loadArchitectureBoard() {
    const decisionArea = document.querySelector(".decision-area");
    const architectureBoard = document.getElementById("architecture-board");
    const architectureStage = document.getElementById("architecture-stage");
    const clueContainer = document.getElementById("architecture-clues");
    const componentBank = document.getElementById("component-bank");
    const slotContainer = document.getElementById("architecture-slots");

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/architecture`
        );

        if (!response.ok) {
            throw new Error("Unable to load architecture board.");
        }

        const data = await response.json();

        if (data.status !== "unlocked") {
            feedback.classList.remove("hidden");
            feedback.textContent =
                "Architecture Board is still locked.";
            return;
        }

        decisionArea.classList.add("hidden");
        architectureBoard.classList.remove("hidden");

        architectureStage.classList.remove("locked");
        architectureStage.classList.add("active");

        const architectureStatus =
            architectureStage.querySelector("small");

        architectureStatus.textContent = "ACTIVE";

        clueContainer.innerHTML = "";
        componentBank.innerHTML = "";
        slotContainer.innerHTML = "";

        selectedComponent = null;
        architecturePlacements = {};

        const architectureFeedback =
            document.getElementById("architecture-feedback");

        architectureFeedback.classList.add("hidden");
        architectureFeedback.innerHTML = "";

        const submitArchitecture =
            document.getElementById("submit-architecture");

        submitArchitecture.disabled = true;
        submitArchitecture.textContent =
            "Submit for Architect Review";
        submitArchitecture.dataset.action = "";

        data.clues.forEach((clue, index) => {
            const clueCard = document.createElement("div");

            clueCard.className = "architecture-clue";
            clueCard.innerHTML =
                `<strong>Clue ${index + 1}</strong>` +
                `<p>${clue.clue}</p>`;

            clueContainer.appendChild(clueCard);
        });

        data.components.forEach((component) => {
            const componentButton =
                document.createElement("button");

            componentButton.type = "button";
            componentButton.className = "aws-component";
            componentButton.dataset.componentId = component.id;
            componentButton.textContent = component.name;

            componentButton.addEventListener("click", () => {
                selectedComponent = {
                    id: component.id,
                    name: component.name
                };

                document
                    .querySelectorAll(".aws-component")
                    .forEach((button) => {
                        button.classList.remove("selected");
                    });

                componentButton.classList.add("selected");
            });

            componentBank.appendChild(componentButton);
        });

        data.slots.forEach((slot) => {
            const slotCard = document.createElement("div");

            slotCard.className = "architecture-slot";
            slotCard.dataset.slotId = slot.id;

            slotCard.innerHTML =
                `<span class="slot-label">${slot.label}</span>` +
                `<strong class="slot-value">Empty</strong>`;

            slotCard.addEventListener("click", () => {
                if (!selectedComponent) {
                    return;
                }

                const architectureFeedback =
                    document.getElementById(
                        "architecture-feedback"
                    );

                architectureFeedback.classList.add("hidden");
                architectureFeedback.innerHTML = "";

                architecturePlacements[slot.id] =
                    selectedComponent.id;

                const slotValue =
                    slotCard.querySelector(".slot-value");

                slotValue.textContent =
                    selectedComponent.name;

                slotCard.classList.add("filled");

                selectedComponent = null;

                document
                    .querySelectorAll(".aws-component")
                    .forEach((button) => {
                        button.classList.remove("selected");
                    });

                const submitArchitecture =
                    document.getElementById(
                        "submit-architecture"
                    );

                submitArchitecture.disabled =
                    Object.keys(architecturePlacements).length
                    !== data.slots.length;
            });

            slotContainer.appendChild(slotCard);
        });

        architectureBoard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        feedback.classList.remove("hidden");
        feedback.textContent =
            "Unable to load the Architecture Board.";

        console.error(error);
    }
}


const submitArchitectureButton =
    document.getElementById("submit-architecture");

submitArchitectureButton.addEventListener("click", async () => {
    const architectureFeedback =
        document.getElementById("architecture-feedback");

    submitArchitectureButton.disabled = true;
    submitArchitectureButton.textContent =
        "Architect Reviewing...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/architecture/review`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    placements: architecturePlacements
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Unable to review architecture."
            );
        }

        const data = await response.json();
        const result = data.result;

        architectureFeedback.classList.remove("hidden");

        if (result.status === "not_approved") {
            const hints = result.errors
                .map((error) => {
                    return (
                        `<li><strong>${error.label}</strong>: ` +
                        `${error.hint}</li>`
                    );
                })
                .join("");

            architectureFeedback.innerHTML =
                "<strong>❌ ARCHITECTURE NOT APPROVED</strong>" +
                "<p>The design does not fully satisfy the " +
                "client requirements.</p>" +
                `<ul>${hints}</ul>`;

            submitArchitectureButton.disabled = false;
            submitArchitectureButton.textContent =
                "Revise & Submit Again";

            return;
        }

        if (result.status === "approved") {
            architectureFeedback.innerHTML =
                "<strong>✓ ARCHITECTURE APPROVED</strong>" +
                "<p>Your design satisfies the architecture " +
                "requirements. AWS Deployment is now unlocked.</p>";

            const deploymentStage =
                document.getElementById("deployment-stage");

            deploymentStage.classList.remove("locked");
            deploymentStage.classList.add("active");

            const deploymentStatus =
                deploymentStage.querySelector("small");

            deploymentStatus.textContent = "UNLOCKED";

            const boardStatus =
                document.querySelector(".board-status");

            boardStatus.textContent = "DESIGN APPROVED";

            submitArchitectureButton.textContent =
                "Enter AWS Deployment";

            submitArchitectureButton.dataset.action =
                "deployment";

            submitArchitectureButton.disabled = false;
        }

    } catch (error) {
        architectureFeedback.classList.remove("hidden");
        architectureFeedback.textContent =
            "Unable to reach the Architect Review service.";

        submitArchitectureButton.disabled = false;
        submitArchitectureButton.textContent =
            "Submit for Architect Review";

        console.error(error);
    }
});

const API_BASE_URL = "http://127.0.0.1:8002";
const MISSION_ID = "mission_02";
const MISSION_API = `${API_BASE_URL}/api/missions/${MISSION_ID}`;

const questionText = document.getElementById("question-text");
const questionProgress = document.getElementById("question-progress");
const answerOptions = document.getElementById("answer-options");
const submitButton = document.getElementById("submit-answer");
const cluesUnlocked = document.getElementById("clues-unlocked");
const feedback = document.getElementById("feedback");
const xpDisplay = document.getElementById("xp-display");

let selectedAnswer = null;
let selectedComponent = null;
let architecturePlacements = {};


// =========================================================
// XP
// =========================================================

function loadXP() {
    const savedXP = Number(
        localStorage.getItem("cloudquest-xp") || "0"
    );

    xpDisplay.textContent = `${savedXP} XP`;
}


// =========================================================
// MISSION PATH HELPERS
// =========================================================

function setStageState(stageId, state, label) {
    const stage = document.getElementById(stageId);

    if (!stage) {
        return;
    }

    stage.classList.remove("locked", "active");

    if (state) {
        stage.classList.add(state);
    }

    const status = stage.querySelector("small");

    if (status) {
        status.textContent = label;
    }
}


function restoreCompletedMission() {
    document.querySelector(".decision-area").classList.add("hidden");
    document.getElementById("architecture-board").classList.add("hidden");

    const deploymentMission =
        document.getElementById("deployment-mission");

    deploymentMission.classList.remove("hidden");

    document
        .querySelectorAll(".deployment-task")
        .forEach((task) => {
            task.classList.add("hidden");
        });

    const validationStage =
        document.getElementById("validation-stage");

    validationStage.classList.remove("hidden");

    document
        .querySelectorAll(".validation-check")
        .forEach((checkbox) => {
            checkbox.checked = true;
            checkbox.disabled = true;
        });

    const completeValidation =
        document.getElementById("complete-validation");

    completeValidation.disabled = true;
    completeValidation.textContent = "Mission Complete";

    const validationFeedback =
        document.getElementById("validation-feedback");

    validationFeedback.classList.remove("hidden");
    validationFeedback.innerHTML =
        "<strong>🏆 MISSION 02 COMPLETE</strong>" +
        "<p>ShopWave is ready for the traffic surge.</p>" +
        "<p>You earned 750 XP.</p>";

    setStageState(
        "questions-stage",
        "",
        "COMPLETE"
    );

    setStageState(
        "architecture-stage",
        "",
        "COMPLETE"
    );

    setStageState(
        "deployment-stage",
        "",
        "COMPLETE"
    );

    setStageState(
        "mission-complete-stage",
        "active",
        "COMPLETE"
    );

    cluesUnlocked.textContent = "5";

    document
        .querySelectorAll(".deployment-step")
        .forEach((step) => {
            step.classList.add("complete");
            step.classList.remove("active");
        });

    document
        .getElementById("deployment-progress-5")
        .classList.add("active");
}


// =========================================================
// QUESTIONS
// =========================================================

async function loadQuestion() {
    try {
        const response = await fetch(
            `${MISSION_API}/question`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load Mission 02 question."
            );
        }

        const data = await response.json();

        if (data.status === "complete") {
            const savedMissionComplete =
                localStorage.getItem("mission-02-complete");

            if (savedMissionComplete === "true") {
                restoreCompletedMission();
                return;
            }

            questionProgress.textContent =
                "Decisions Complete";

            questionText.textContent =
                "All architecture clues have been collected.";

            answerOptions.innerHTML = "";
            cluesUnlocked.textContent = "5";

            feedback.classList.remove("hidden");

            feedback.innerHTML =
                "<strong>✓ ARCHITECTURE BOARD UNLOCKED</strong><br>" +
                "Your five clues are ready. Build the ShopWave architecture.";

            submitButton.textContent =
                "Enter Architecture Board";

            submitButton.dataset.action =
                "architecture";

            submitButton.disabled = false;

            setStageState(
                "questions-stage",
                "",
                "COMPLETE"
            );

            setStageState(
                "architecture-stage",
                "active",
                "UNLOCKED"
            );

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
    submitButton.textContent = "Submit Decision";
    submitButton.dataset.action = "";

    feedback.classList.add("hidden");
    feedback.textContent = "";

    questionProgress.textContent =
        `Decision ${question.id} of ${progress.total_clues}`;

    questionText.textContent = question.question;

    cluesUnlocked.textContent =
        progress.clues_unlocked;

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
    if (
        submitButton.dataset.action ===
        "architecture"
    ) {
        await loadArchitectureBoard();
        return;
    }

    if (
        submitButton.dataset.action ===
        "continue"
    ) {
        submitButton.dataset.action = "";
        submitButton.textContent =
            "Submit Decision";

        await loadQuestion();
        return;
    }

    if (!selectedAnswer) {
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent =
        "Checking Decision...";

    try {
        const response = await fetch(
            `${MISSION_API}/answer`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    answer: selectedAnswer
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Unable to validate decision."
            );
        }

        const data = await response.json();
        const result = data.result;

        feedback.classList.remove("hidden");

        if (result.status === "incorrect") {
            feedback.innerHTML =
                "<strong>❌ REQUIREMENT MISMATCH</strong><br>" +
                `${result.hint}`;

            submitButton.disabled = false;
            submitButton.textContent =
                "Try Decision Again";

            return;
        }

        if (result.status === "correct") {
            cluesUnlocked.textContent =
                result.clues_unlocked;

            feedback.innerHTML =
                "<strong>✓ DECISION ACCEPTED</strong><br>" +
                `🧩 Clue ${result.clues_unlocked} unlocked:<br>` +
                `${result.clue}`;

            selectedAnswer = null;

            document
                .querySelectorAll(".answer-option")
                .forEach((button) => {
                    button.disabled = true;
                });

            if (result.architecture_unlocked) {
                submitButton.textContent =
                    "Enter Architecture Board";

                submitButton.dataset.action =
                    "architecture";

                setStageState(
                    "questions-stage",
                    "",
                    "COMPLETE"
                );

                setStageState(
                    "architecture-stage",
                    "active",
                    "UNLOCKED"
                );

            } else {
                submitButton.textContent =
                    "Continue Mission";

                submitButton.dataset.action =
                    "continue";
            }

            submitButton.disabled = false;
        }

    } catch (error) {
        feedback.classList.remove("hidden");

        feedback.textContent =
            "Unable to reach the mission server. Try again.";

        submitButton.disabled = false;
        submitButton.textContent =
            "Submit Decision";

        console.error(error);
    }
});


// =========================================================
// ARCHITECTURE BOARD
// =========================================================

async function loadArchitectureBoard() {
    const decisionArea =
        document.querySelector(".decision-area");

    const architectureBoard =
        document.getElementById("architecture-board");

    const clueContainer =
        document.getElementById("architecture-clues");

    const componentBank =
        document.getElementById("component-bank");

    const slotContainer =
        document.getElementById("architecture-slots");

    const architectureFeedback =
        document.getElementById(
            "architecture-feedback"
        );

    const submitArchitecture =
        document.getElementById(
            "submit-architecture"
        );

    try {
        const response = await fetch(
            `${MISSION_API}/architecture`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load architecture board."
            );
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

        setStageState(
            "architecture-stage",
            "active",
            "ACTIVE"
        );

        clueContainer.innerHTML = "";
        componentBank.innerHTML = "";
        slotContainer.innerHTML = "";

        selectedComponent = null;
        architecturePlacements = {};

        architectureFeedback.classList.add(
            "hidden"
        );

        architectureFeedback.innerHTML = "";

        submitArchitecture.disabled = true;

        submitArchitecture.textContent =
            "Submit for Architect Review";

        submitArchitecture.dataset.action = "";

        data.clues.forEach((clue, index) => {
            const clueCard =
                document.createElement("div");

            clueCard.className =
                "architecture-clue";

            clueCard.innerHTML =
                `<strong>Clue ${index + 1}</strong>` +
                `<p>${clue.clue}</p>`;

            clueContainer.appendChild(clueCard);
        });

        data.components.forEach((component) => {
            const componentButton =
                document.createElement("button");

            componentButton.type = "button";

            componentButton.className =
                "aws-component";

            componentButton.dataset.componentId =
                component.id;

            componentButton.textContent =
                component.name;

            componentButton.addEventListener(
                "click",
                () => {
                    selectedComponent = {
                        id: component.id,
                        name: component.name
                    };

                    document
                        .querySelectorAll(
                            ".aws-component"
                        )
                        .forEach((button) => {
                            button.classList.remove(
                                "selected"
                            );
                        });

                    componentButton.classList.add(
                        "selected"
                    );
                }
            );

            componentBank.appendChild(
                componentButton
            );
        });

        data.slots.forEach((slot) => {
            const slotCard =
                document.createElement("div");

            slotCard.className =
                "architecture-slot";

            slotCard.dataset.slotId = slot.id;

            slotCard.innerHTML =
                `<span class="slot-label">${slot.label}</span>` +
                '<strong class="slot-value">Empty</strong>';

            slotCard.addEventListener(
                "click",
                () => {
                    if (!selectedComponent) {
                        return;
                    }

                    architectureFeedback.classList.add(
                        "hidden"
                    );

                    architectureFeedback.innerHTML =
                        "";

                    architecturePlacements[slot.id] =
                        selectedComponent.id;

                    const slotValue =
                        slotCard.querySelector(
                            ".slot-value"
                        );

                    slotValue.textContent =
                        selectedComponent.name;

                    slotCard.classList.add("filled");

                    selectedComponent = null;

                    document
                        .querySelectorAll(
                            ".aws-component"
                        )
                        .forEach((button) => {
                            button.classList.remove(
                                "selected"
                            );
                        });

                    submitArchitecture.disabled =
                        Object.keys(
                            architecturePlacements
                        ).length !== data.slots.length;
                }
            );

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
    document.getElementById(
        "submit-architecture"
    );


submitArchitectureButton.addEventListener(
    "click",
    async () => {
        if (
            submitArchitectureButton.dataset.action ===
            "deployment"
        ) {
            const architectureBoard =
                document.getElementById(
                    "architecture-board"
                );

            const deploymentMission =
                document.getElementById(
                    "deployment-mission"
                );

            architectureBoard.classList.add(
                "hidden"
            );

            deploymentMission.classList.remove(
                "hidden"
            );

            setStageState(
                "architecture-stage",
                "",
                "COMPLETE"
            );

            setStageState(
                "deployment-stage",
                "active",
                "ACTIVE"
            );

            deploymentMission.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            return;
        }

        const architectureFeedback =
            document.getElementById(
                "architecture-feedback"
            );

        submitArchitectureButton.disabled = true;

        submitArchitectureButton.textContent =
            "Architect Reviewing...";

        try {
            const response = await fetch(
                `${MISSION_API}/architecture/review`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        placements:
                            architecturePlacements
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

            architectureFeedback.classList.remove(
                "hidden"
            );

            if (
                result.status ===
                "not_approved"
            ) {
                const errors =
                    result.errors || [];

                const hints = errors
                    .map((error) => {
                        return (
                            `<li><strong>${error.label}</strong>: ` +
                            `${error.hint}</li>`
                        );
                    })
                    .join("");

                architectureFeedback.innerHTML =
                    "<strong>❌ ARCHITECTURE NOT APPROVED</strong>" +
                    "<p>The design does not fully satisfy " +
                    "the ShopWave requirements.</p>" +
                    `<ul>${hints}</ul>`;

                submitArchitectureButton.disabled =
                    false;

                submitArchitectureButton.textContent =
                    "Revise & Submit Again";

                return;
            }

            if (result.status === "approved") {
                architectureFeedback.innerHTML =
                    "<strong>✓ ARCHITECTURE APPROVED</strong>" +
                    "<p>Your design can distribute traffic, " +
                    "scale the application, use a managed " +
                    "database, and protect the application tier.</p>";

                setStageState(
                    "architecture-stage",
                    "active",
                    "APPROVED"
                );

                setStageState(
                    "deployment-stage",
                    "active",
                    "UNLOCKED"
                );

                const boardStatus =
                    document.querySelector(
                        ".board-status"
                    );

                boardStatus.textContent =
                    "DESIGN APPROVED";

                submitArchitectureButton.textContent =
                    "Enter AWS Deployment";

                submitArchitectureButton.dataset.action =
                    "deployment";

                submitArchitectureButton.disabled =
                    false;
            }

        } catch (error) {
            architectureFeedback.classList.remove(
                "hidden"
            );

            architectureFeedback.textContent =
                "Unable to reach the Architect Review service.";

            submitArchitectureButton.disabled =
                false;

            submitArchitectureButton.textContent =
                "Submit for Architect Review";

            console.error(error);
        }
    }
);


// =========================================================
// DEPLOYMENT HELPERS
// =========================================================

function selectDeploymentAnswer(
    selector,
    selectedButton,
    verifyButton
) {
    document
        .querySelectorAll(selector)
        .forEach((button) => {
            button.classList.remove("selected");
        });

    selectedButton.classList.add("selected");

    verifyButton.dataset.answer =
        selectedButton.dataset.answer;

    verifyButton.disabled = false;
}


function showDeploymentCheck(
    stageButton,
    checkElement
) {
    stageButton.classList.add("hidden");
    checkElement.classList.remove("hidden");

    checkElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function verifyDeploymentStage({
    verifyButton,
    correctAnswer,
    feedbackElement,
    currentStage,
    nextStage,
    currentProgress,
    nextProgress,
    successMessage
}) {
    const selected =
        verifyButton.dataset.answer;

    feedbackElement.classList.remove("hidden");

    if (selected !== correctAnswer) {
        feedbackElement.innerHTML =
            "<strong>❌ DEPLOYMENT CHECK FAILED</strong>" +
            "<p>Review the architecture requirement and try again.</p>";

        return;
    }

    feedbackElement.innerHTML =
        "<strong>✓ DEPLOYMENT VERIFIED</strong>" +
        `<p>${successMessage}</p>`;

    verifyButton.disabled = true;

    document
        .querySelectorAll(
            `.${verifyButton.dataset.optionClass}`
        )
        .forEach((button) => {
            button.disabled = true;
        });

    currentProgress.classList.remove("active");
    currentProgress.classList.add("complete");

    nextProgress.classList.add("active");

    window.setTimeout(() => {
        currentStage.classList.add("hidden");
        nextStage.classList.remove("hidden");

        nextStage.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 500);
}


// =========================================================
// DEPLOYMENT STAGE 1 - LOAD BALANCER
// =========================================================

const completeLoadBalancer =
    document.getElementById(
        "complete-load-balancer-stage"
    );

const loadBalancerCheck =
    document.getElementById(
        "load-balancer-check"
    );

const verifyLoadBalancer =
    document.getElementById(
        "verify-load-balancer"
    );

const loadBalancerFeedback =
    document.getElementById(
        "load-balancer-feedback"
    );


completeLoadBalancer.addEventListener(
    "click",
    () => {
        showDeploymentCheck(
            completeLoadBalancer,
            loadBalancerCheck
        );
    }
);


document
    .querySelectorAll(".load-balancer-option")
    .forEach((button) => {
        button.addEventListener("click", () => {
            selectDeploymentAnswer(
                ".load-balancer-option",
                button,
                verifyLoadBalancer
            );
        });
    });


verifyLoadBalancer.dataset.optionClass =
    "load-balancer-option";


verifyLoadBalancer.addEventListener(
    "click",
    () => {
        verifyDeploymentStage({
            verifyButton: verifyLoadBalancer,
            correctAnswer: "B",
            feedbackElement:
                loadBalancerFeedback,
            currentStage:
                document.getElementById(
                    "load-balancer-stage"
                ),
            nextStage:
                document.getElementById(
                    "auto-scaling-stage"
                ),
            currentProgress:
                document.getElementById(
                    "deployment-progress-1"
                ),
            nextProgress:
                document.getElementById(
                    "deployment-progress-2"
                ),
            successMessage:
                "The Application Load Balancer is the public entry point for ShopWave traffic."
        });
    }
);


// =========================================================
// DEPLOYMENT STAGE 2 - AUTO SCALING
// =========================================================

const completeAutoScaling =
    document.getElementById(
        "complete-auto-scaling-stage"
    );

const autoScalingCheck =
    document.getElementById(
        "auto-scaling-check"
    );

const verifyAutoScaling =
    document.getElementById(
        "verify-auto-scaling"
    );

const autoScalingFeedback =
    document.getElementById(
        "auto-scaling-feedback"
    );


completeAutoScaling.addEventListener(
    "click",
    () => {
        showDeploymentCheck(
            completeAutoScaling,
            autoScalingCheck
        );
    }
);


document
    .querySelectorAll(".auto-scaling-option")
    .forEach((button) => {
        button.addEventListener("click", () => {
            selectDeploymentAnswer(
                ".auto-scaling-option",
                button,
                verifyAutoScaling
            );
        });
    });


verifyAutoScaling.dataset.optionClass =
    "auto-scaling-option";


verifyAutoScaling.addEventListener(
    "click",
    () => {
        verifyDeploymentStage({
            verifyButton: verifyAutoScaling,
            correctAnswer: "A",
            feedbackElement:
                autoScalingFeedback,
            currentStage:
                document.getElementById(
                    "auto-scaling-stage"
                ),
            nextStage:
                document.getElementById(
                    "database-stage"
                ),
            currentProgress:
                document.getElementById(
                    "deployment-progress-2"
                ),
            nextProgress:
                document.getElementById(
                    "deployment-progress-3"
                ),
            successMessage:
                "EC2 Auto Scaling can adjust ShopWave application capacity as demand changes."
        });
    }
);


// =========================================================
// DEPLOYMENT STAGE 3 - DATABASE
// =========================================================

const completeDatabase =
    document.getElementById(
        "complete-database-stage"
    );

const databaseCheck =
    document.getElementById(
        "database-check"
    );

const verifyDatabase =
    document.getElementById(
        "verify-database"
    );

const databaseFeedback =
    document.getElementById(
        "database-feedback"
    );


completeDatabase.addEventListener(
    "click",
    () => {
        showDeploymentCheck(
            completeDatabase,
            databaseCheck
        );
    }
);


document
    .querySelectorAll(".database-option")
    .forEach((button) => {
        button.addEventListener("click", () => {
            selectDeploymentAnswer(
                ".database-option",
                button,
                verifyDatabase
            );
        });
    });


verifyDatabase.dataset.optionClass =
    "database-option";


verifyDatabase.addEventListener(
    "click",
    () => {
        verifyDeploymentStage({
            verifyButton: verifyDatabase,
            correctAnswer: "B",
            feedbackElement:
                databaseFeedback,
            currentStage:
                document.getElementById(
                    "database-stage"
                ),
            nextStage:
                document.getElementById(
                    "security-stage"
                ),
            currentProgress:
                document.getElementById(
                    "deployment-progress-3"
                ),
            nextProgress:
                document.getElementById(
                    "deployment-progress-4"
                ),
            successMessage:
                "Amazon RDS provides the managed relational database required by ShopWave."
        });
    }
);


// =========================================================
// DEPLOYMENT STAGE 4 - SECURITY
// =========================================================

const completeSecurity =
    document.getElementById(
        "complete-security-stage"
    );

const securityCheck =
    document.getElementById(
        "security-check"
    );

const verifySecurity =
    document.getElementById(
        "verify-security"
    );

const securityFeedback =
    document.getElementById(
        "security-feedback"
    );


completeSecurity.addEventListener(
    "click",
    () => {
        showDeploymentCheck(
            completeSecurity,
            securityCheck
        );
    }
);


document
    .querySelectorAll(".security-option")
    .forEach((button) => {
        button.addEventListener("click", () => {
            selectDeploymentAnswer(
                ".security-option",
                button,
                verifySecurity
            );
        });
    });


verifySecurity.dataset.optionClass =
    "security-option";


verifySecurity.addEventListener(
    "click",
    () => {
        verifyDeploymentStage({
            verifyButton: verifySecurity,
            correctAnswer: "B",
            feedbackElement:
                securityFeedback,
            currentStage:
                document.getElementById(
                    "security-stage"
                ),
            nextStage:
                document.getElementById(
                    "validation-stage"
                ),
            currentProgress:
                document.getElementById(
                    "deployment-progress-4"
                ),
            nextProgress:
                document.getElementById(
                    "deployment-progress-5"
                ),
            successMessage:
                "The application tier now accepts application traffic from the load balancer security group."
        });
    }
);


// =========================================================
// DEPLOYMENT STAGE 5 - VALIDATION
// =========================================================

const validationChecks =
    document.querySelectorAll(
        ".validation-check"
    );

const completeValidation =
    document.getElementById(
        "complete-validation"
    );

const validationFeedback =
    document.getElementById(
        "validation-feedback"
    );


function updateValidationButton() {
    const allChecked =
        Array.from(validationChecks)
            .every((checkbox) => {
                return checkbox.checked;
            });

    completeValidation.disabled =
        !allChecked;
}


validationChecks.forEach((checkbox) => {
    checkbox.addEventListener(
        "change",
        updateValidationButton
    );
});


completeValidation.addEventListener(
    "click",
    () => {
        const alreadyComplete =
            localStorage.getItem(
                "mission-02-complete"
            ) === "true";

        if (!alreadyComplete) {
            const currentXP = Number(
                localStorage.getItem(
                    "cloudquest-xp"
                ) || "0"
            );

            const newXP = currentXP + 750;

            localStorage.setItem(
                "cloudquest-xp",
                String(newXP)
            );

            localStorage.setItem(
                "mission-02-complete",
                "true"
            );
        }

        loadXP();

        validationChecks.forEach(
            (checkbox) => {
                checkbox.disabled = true;
            }
        );

        completeValidation.disabled = true;
        completeValidation.textContent =
            "Mission Complete";

        validationFeedback.classList.remove(
            "hidden"
        );

        validationFeedback.innerHTML =
            "<strong>🏆 MISSION 02 COMPLETE</strong>" +
            "<p>ShopWave is ready for the traffic surge.</p>" +
            "<p>Application Load Balancing, Auto Scaling, " +
            "multi-AZ application capacity, Amazon RDS, and " +
            "security controls are all part of the final design.</p>" +
            "<p><strong>+750 XP</strong></p>";

        document
            .getElementById(
                "deployment-progress-5"
            )
            .classList.add("complete");

        setStageState(
            "questions-stage",
            "",
            "COMPLETE"
        );

        setStageState(
            "architecture-stage",
            "",
            "COMPLETE"
        );

        setStageState(
            "deployment-stage",
            "",
            "COMPLETE"
        );

        setStageState(
            "mission-complete-stage",
            "active",
            "COMPLETE"
        );
    }
);


// =========================================================
// START MISSION
// =========================================================

async function startMission() {
    loadXP();

    const missionComplete =
        localStorage.getItem(
            "mission-02-complete"
        );

    if (missionComplete === "true") {
        restoreCompletedMission();
        return;
    }

    await loadQuestion();
}


startMission();

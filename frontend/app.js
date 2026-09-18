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
    if (
        submitArchitectureButton.dataset.action ===
        "deployment"
    ) {
        const architectureBoard =
            document.getElementById("architecture-board");

        const deploymentMission =
            document.getElementById("deployment-mission");

        architectureBoard.classList.add("hidden");
        deploymentMission.classList.remove("hidden");

        deploymentMission.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        return;
    }
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
// =========================================================
// DEPLOYMENT MISSION - STAGE 1: PRIVATE ORIGIN
// =========================================================

const completeOriginButton =
    document.getElementById("complete-deployment-stage");

const originDeploymentCheck =
    document.getElementById("origin-deployment-check");

const originCheckOptions =
    document.querySelectorAll(".deployment-check-option");

const verifyOriginButton =
    document.getElementById("verify-origin-check");

const deploymentFeedback =
    document.getElementById("deployment-feedback");

let selectedOriginAnswer = null;


// Show the deployment check
completeOriginButton.addEventListener("click", () => {
    originDeploymentCheck.classList.remove("hidden");

    completeOriginButton.classList.add("hidden");

    originDeploymentCheck.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


// Select an answer
originCheckOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedOriginAnswer = option.dataset.answer;

        originCheckOptions.forEach((button) => {
            button.classList.remove("selected");
        });

        option.classList.add("selected");

        verifyOriginButton.disabled = false;

        deploymentFeedback.classList.add("hidden");
        deploymentFeedback.innerHTML = "";
    });
});


// Verify the deployment decision
verifyOriginButton.addEventListener("click", () => {
    if (!selectedOriginAnswer) {
        return;
    }

    deploymentFeedback.classList.remove("hidden");

    if (selectedOriginAnswer !== "B") {
        deploymentFeedback.innerHTML =
            "<strong>⚠️ DEPLOYMENT CHECK FAILED</strong>" +
            "<p>The origin must not be directly accessible " +
            "from the public internet. Reconsider which S3 " +
            "security setting prevents public access.</p>";

        return;
    }

    deploymentFeedback.innerHTML =
        "<strong>✓ ORIGIN VERIFIED</strong>" +
        "<p>The S3 origin remains private. " +
        "Global Delivery is now unlocked.</p>";

    originCheckOptions.forEach((button) => {
        button.disabled = true;
    });

    verifyOriginButton.disabled = true;
    verifyOriginButton.textContent = "Origin Verified";

    const deploymentSteps =
        document.querySelectorAll(".deployment-step");

    deploymentSteps[0].classList.remove("active");
    deploymentSteps[0].classList.add("completed");

    deploymentSteps[1].classList.add("active");

    const globalDeliveryStage =
        document.getElementById("global-delivery-stage");

    globalDeliveryStage.classList.remove("hidden");

    globalDeliveryStage.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});
// =========================================================
// DEPLOYMENT MISSION - STAGE 2: GLOBAL DELIVERY
// =========================================================

const completeGlobalDeliveryButton =
    document.getElementById("complete-global-delivery");

const globalDeliveryCheck =
    document.getElementById("global-delivery-check");

const globalDeliveryOptions =
    document.querySelectorAll(".global-delivery-option");

const verifyGlobalDeliveryButton =
    document.getElementById("verify-global-delivery");

const globalDeliveryFeedback =
    document.getElementById("global-delivery-feedback");

let selectedGlobalDeliveryAnswer = null;


// Show Stage 2 deployment check
completeGlobalDeliveryButton.addEventListener("click", () => {
    globalDeliveryCheck.classList.remove("hidden");

    completeGlobalDeliveryButton.classList.add("hidden");

    globalDeliveryCheck.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


// Select Stage 2 answer
globalDeliveryOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedGlobalDeliveryAnswer =
            option.dataset.answer;

        globalDeliveryOptions.forEach((button) => {
            button.classList.remove("selected");
        });

        option.classList.add("selected");

        verifyGlobalDeliveryButton.disabled = false;

        globalDeliveryFeedback.classList.add("hidden");
        globalDeliveryFeedback.innerHTML = "";
    });
});


// Verify Stage 2 decision
verifyGlobalDeliveryButton.addEventListener("click", () => {
    if (!selectedGlobalDeliveryAnswer) {
        return;
    }

    globalDeliveryFeedback.classList.remove("hidden");

    if (selectedGlobalDeliveryAnswer !== "B") {
        globalDeliveryFeedback.innerHTML =
            "<strong>⚠️ DEPLOYMENT CHECK FAILED</strong>" +
            "<p>The client needs a globally distributed " +
            "entry point with low operational overhead. " +
            "Reconsider which service should receive the " +
            "user request before it reaches the origin.</p>";

        return;
    }

    globalDeliveryFeedback.innerHTML =
        "<strong>✓ GLOBAL DELIVERY VERIFIED</strong>" +
        "<p>CloudFront is the public delivery layer and " +
        "the private S3 bucket remains the origin. " +
        "HTTPS is now unlocked.</p>";

    globalDeliveryOptions.forEach((button) => {
        button.disabled = true;
    });

    verifyGlobalDeliveryButton.disabled = true;
    verifyGlobalDeliveryButton.textContent =
        "Global Delivery Verified";

    const deploymentSteps =
        document.querySelectorAll(".deployment-step");

    deploymentSteps[1].classList.remove("active");
    deploymentSteps[1].classList.add("completed");

    deploymentSteps[2].classList.add("active");
        const httpsStage =
        document.getElementById("https-stage");

    httpsStage.classList.remove("hidden");

    httpsStage.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

  
});
// =========================================================
// DEPLOYMENT MISSION - STAGE 3: HTTPS
// =========================================================

const completeHttpsButton =
    document.getElementById("complete-https-stage");

const httpsDeploymentCheck =
    document.getElementById("https-deployment-check");

const httpsCheckOptions =
    document.querySelectorAll(".https-check-option");

const verifyHttpsButton =
    document.getElementById("verify-https-check");

const httpsFeedback =
    document.getElementById("https-feedback");

let selectedHttpsAnswer = null;


// Show Stage 3 verification challenge
completeHttpsButton.addEventListener("click", () => {
    httpsDeploymentCheck.classList.remove("hidden");
    completeHttpsButton.classList.add("hidden");

    httpsDeploymentCheck.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


// Select an answer
httpsCheckOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedHttpsAnswer = option.dataset.answer;

        httpsCheckOptions.forEach((button) => {
            button.classList.remove("selected");
        });

        option.classList.add("selected");

        verifyHttpsButton.disabled = false;

        httpsFeedback.classList.add("hidden");
        httpsFeedback.innerHTML = "";
    });
});


// Verify Stage 3 decision
verifyHttpsButton.addEventListener("click", () => {
    if (!selectedHttpsAnswer) {
        return;
    }

    httpsFeedback.classList.remove("hidden");

    if (selectedHttpsAnswer !== "C") {
        httpsFeedback.innerHTML =
            "<strong>⚠️ DEPLOYMENT CHECK FAILED</strong>" +
            "<p>CloudFront has a specific Region requirement " +
            "for viewer TLS certificates. Reconsider where " +
            "the ACM certificate must be available.</p>";

        return;
    }

    httpsFeedback.innerHTML =
        "<strong>✓ HTTPS VERIFIED</strong>" +
        "<p>The CloudFront certificate is correctly placed. " +
        "DNS configuration is now unlocked.</p>";

    httpsCheckOptions.forEach((button) => {
        button.disabled = true;
    });

    verifyHttpsButton.disabled = true;
    verifyHttpsButton.textContent =
        "HTTPS Verified";

    const deploymentSteps =
        document.querySelectorAll(".deployment-step");

    deploymentSteps[2].classList.remove("active");
    deploymentSteps[2].classList.add("completed");

    deploymentSteps[3].classList.add("active");
       const dnsStage =
        document.getElementById("dns-stage");

    dnsStage.classList.remove("hidden");

    dnsStage.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
   
});
// =========================================================
// DEPLOYMENT MISSION - STAGE 4: DNS
// =========================================================

const completeDnsButton =
    document.getElementById("complete-dns-stage");

const dnsDeploymentCheck =
    document.getElementById("dns-deployment-check");

const dnsCheckOptions =
    document.querySelectorAll(".dns-check-option");

const verifyDnsButton =
    document.getElementById("verify-dns-check");

const dnsFeedback =
    document.getElementById("dns-feedback");

let selectedDnsAnswer = null;


// Show Stage 4 verification challenge
completeDnsButton.addEventListener("click", () => {
    dnsDeploymentCheck.classList.remove("hidden");
    completeDnsButton.classList.add("hidden");

    dnsDeploymentCheck.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
});


// Select an answer
dnsCheckOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedDnsAnswer = option.dataset.answer;

        dnsCheckOptions.forEach((button) => {
            button.classList.remove("selected");
        });

        option.classList.add("selected");

        verifyDnsButton.disabled = false;

        dnsFeedback.classList.add("hidden");
        dnsFeedback.innerHTML = "";
    });
});


// Verify Stage 4 decision
verifyDnsButton.addEventListener("click", () => {
    if (!selectedDnsAnswer) {
        return;
    }

    dnsFeedback.classList.remove("hidden");

    if (selectedDnsAnswer !== "A") {
        dnsFeedback.innerHTML =
            "<strong>⚠️ DEPLOYMENT CHECK FAILED</strong>" +
            "<p>The domain needs to route website traffic " +
            "to the CloudFront distribution. Reconsider " +
            "which Route 53 record design supports this.</p>";

        return;
    }

    dnsFeedback.innerHTML =
        "<strong>✓ DNS VERIFIED</strong>" +
        "<p>The domain can route traffic to CloudFront. " +
        "Final validation is now unlocked.</p>";

    dnsCheckOptions.forEach((button) => {
        button.disabled = true;
    });

    verifyDnsButton.disabled = true;
    verifyDnsButton.textContent =
        "DNS Verified";

    const deploymentSteps =
        document.querySelectorAll(".deployment-step");

    deploymentSteps[3].classList.remove("active");
    deploymentSteps[3].classList.add("completed");

    deploymentSteps[4].classList.add("active");

    const validationStage =
        document.getElementById("validation-stage");

    validationStage.classList.remove("hidden");

    validationStage.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});
// =========================================================
// DEPLOYMENT MISSION - STAGE 5: FINAL VALIDATION
// =========================================================

const validationChecks =
    document.querySelectorAll(".validation-check");

const completeValidationButton =
    document.getElementById("complete-validation");

const validationFeedback =
    document.getElementById("validation-feedback");


// Enable mission completion only when every check passes
validationChecks.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
        const allChecksComplete =
            Array.from(validationChecks).every(
                (check) => check.checked
            );

        completeValidationButton.disabled =
            !allChecksComplete;

        validationFeedback.classList.add("hidden");
        validationFeedback.innerHTML = "";
    });
});


// Complete Mission 1
    document.getElementById("xp-display");
const xpDisplay =
    document.getElementById("xp-display");
const savedXp =
    localStorage.getItem("cloudquest-xp");

if (savedXp) {
    xpDisplay.textContent = savedXp + " XP";
}

completeValidationButton.addEventListener("click", () => {
    const allChecksComplete =
        Array.from(validationChecks).every(
            (check) => check.checked
        );

    if (!allChecksComplete) {
        return;
    }

    validationFeedback.classList.remove("hidden");

    validationFeedback.innerHTML =
        "<strong>🏆 MISSION COMPLETE</strong>" +
        "<p>NovaLaunch is ready to go live. " +
        "You designed, reviewed, deployed, and validated " +
        "a secure global static website architecture.</p>" +
        "<p><strong>+500 XP earned</strong></p>";

    
completeValidationButton.classList.add("hidden");
xpDisplay.textContent = "500 XP";
localStorage.setItem("cloudquest-xp", "500");

    validationChecks.forEach((checkbox) => {
        checkbox.disabled = true;
    });
const deploymentSteps =
    document.querySelectorAll(".deployment-step");

deploymentSteps[4].classList.remove("active");
deploymentSteps[4].classList.add("completed");

const missionCompleteStage =
    document.getElementById("mission-complete-stage");

missionCompleteStage.classList.remove("locked");
missionCompleteStage.classList.add("completed");

const missionCompleteStatus =
    missionCompleteStage.querySelector("small");

missionCompleteStatus.textContent = "COMPLETE";
});

const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status-text');
const introOverlay = document.getElementById('intro-overlay');
const startBtn = document.getElementById('start-btn');
const pulseRing = document.getElementById('pulse-ring');

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        statusText.textContent = "Listening...";
        pulseRing.classList.add('active');
    };

    recognition.onend = () => {
        pulseRing.classList.remove('active');
        // If we didn't get a result, reset text
        if (statusText.textContent === "Listening...") {
            statusText.textContent = "Click microphone to speak";
        }
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("User said:", transcript);
        statusText.textContent = "Thinking...";

        await handleQuery(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        statusText.textContent = "Error: " + event.error;
        pulseRing.classList.remove('active');
    };
} else {
    statusText.textContent = "Browser does not support Speech Recognition.";
    micBtn.disabled = true;
}

// Speech Synthesis Setup
function speak(text) {
    return new Promise((resolve) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        // Try to pick a decent voice - grounded male voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Male')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => {
            statusText.textContent = "Speaking...";
        };

        utterance.onend = () => {
            statusText.textContent = "Click microphone to reply";
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// API Handler
async function handleQuery(text) {
    try {
        const response = await fetch('http://localhost:5000/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text })
        });

        const data = await response.json();
        if (data.answer) {
            await speak(data.answer);
        } else {
            statusText.textContent = "No answer received.";
        }
    } catch (error) {
        console.error(error);
        statusText.textContent = "Connection error.";
    }
}

// Event Listeners
micBtn.addEventListener('click', () => {
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            // Usually happens if already started
            console.log(e);
            recognition.stop();
        }
    }
});

startBtn.addEventListener('click', () => {
    introOverlay.style.display = 'none';
    // Initialize synthesis voices (sometimes they need a trigger)
    window.speechSynthesis.getVoices();

    // Play Intro
    const introText = "Hi, I’m Shashank Shekhar. This voice bot answers interview questions the way I would. Click the microphone button to begin.";
    speak(introText);
});

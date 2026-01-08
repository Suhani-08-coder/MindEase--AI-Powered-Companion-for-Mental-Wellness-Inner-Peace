const BACKEND_URL = "http://127.0.0.1:5000/api/chat";

function handleMood(mood, cardElement) {
    document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
    cardElement.classList.add('active');

    const box = document.getElementById('moodMessage');
    const title = document.getElementById('msgTitle');
    const body = document.getElementById('msgBody');
    const btn = document.getElementById('msgBtn');

    box.classList.remove('hidden');

    if (mood === 'great') {
        box.style.borderLeftColor = "#48bb78";
        title.innerText = "That's wonderful! 🌟";
        body.innerText = "You're radiating positive energy! A Quiz is a great way to reflect on this positive state.";
        btn.innerText = "Take Wellness Quiz";
        btn.onclick = () => window.location.href = "quiz.html";
    } 
    else if (mood === 'good') {
        box.style.borderLeftColor = "#38b2ac";
        title.innerText = "Glad to hear it! 🙂";
        body.innerText = "Keep this flow going. A quick AI guided breathing session will help lock in this peace.";
        btn.innerText = "Start Breathing";
        btn.onclick = () => window.location.href = "resources.html#ai";
    } 
    else if (mood === 'neutral') {
        box.style.borderLeftColor = "#a0aec0";
        title.innerText = "Feeling Neutral? 🤖";
        body.innerText = "Sometimes we need a spark. Chatting with our AI Companion can give you a fresh perspective.";
        btn.innerText = "Chat with AI";
        btn.onclick = () => window.location.href = "resources.html#ai";
    } 
    else if (mood === 'struggling') {
        box.style.borderLeftColor = "#ed8936";
        title.innerText = "Feeling Down? 🌧️";
        body.innerText = "Visual therapy is very effective. Watch these calming nature videos to reset your mind.";
        btn.innerText = "Watch Videos";
        btn.onclick = () => window.location.href = "resources.html#videos";
    } 
    else if (mood === 'awful') {
        box.style.borderLeftColor = "#e53e3e";
        title.innerText = "Having a tough time? 🎧";
        body.innerText = "Music heals the soul. Close your eyes and listen to this curated anxiety-relief playlist.";
        btn.innerText = "Listen to Music";
        btn.onclick = () => window.location.href = "resources.html#songs";
    }
}

function openChat() {
    document.getElementById('chatOverlay').classList.add('open');
}

function closeChat() {
    document.getElementById('chatOverlay').classList.remove('open');
}

async function submitNote() {
    const note = document.getElementById('userNote').value;
    const responseBox = document.getElementById('aiResponse');
    const sendBtn = document.querySelector('.send-btn');

    if (!note.trim()) return alert("Please type something...");

    sendBtn.innerText = "Sending...";
    responseBox.classList.remove('hidden');
    responseBox.innerText = "Thinking...";

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: note })
        });
        const data = await res.json();
        
        responseBox.innerHTML = `<strong>🤖 Companion:</strong><br>${data.reply}`;
    } catch (e) {
        responseBox.innerText = "Error connecting to server.";
    } finally {
        sendBtn.innerText = "Send / Save";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "loginPage.html";
}

window.onload = function() {
    const name = localStorage.getItem('userName');
    if(name) document.getElementById('usernameDisplay').innerText = `Hello, ${name}`;
};
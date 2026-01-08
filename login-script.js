const BACKEND_URL = "http://127.0.0.1:5000/api";
let currentMode = 'signup'; 
let userEmail = '';

function showSignup() {
    currentMode = 'signup';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'none';
}

function showLogin() {
    currentMode = 'login';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('otp-form').style.display = 'none';
}

async function handleAuth(mode) {
    currentMode = mode;
    
    if (mode === 'signup') {
        userEmail = document.getElementById('s-email').value;
    } else {
        userEmail = document.getElementById('l-email').value;
    }

    if (!userEmail) return alert("Please enter your email.");

    try {
        const res = await fetch(`${BACKEND_URL}/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail })
        });
        
        const data = await res.json();
        alert(data.message);
        
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('otp-form').style.display = 'block';

    } catch (e) {
        console.error(e);
        alert("Server Error. Check console.");
    }
}

async function verifyCode() {
    const otp = document.getElementById('otp-input').value;
    
    let payload = { email: userEmail, otp: otp };

    if (currentMode === 'signup') {
        payload.userData = {
            name: document.getElementById('s-name').value,
            age: document.getElementById('s-age').value,
            gender: document.getElementById('s-gender').value
        };
    }

    try {
        const res = await fetch(`${BACKEND_URL}/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userAge', data.user.age);
            
            alert(`Welcome ${data.user.name}! Login Successful.`);
            window.location.href = "Welcome.html";
        } else {
            alert(data.error);
        }
    } catch (e) {
        alert("Verification Failed");
    }
}
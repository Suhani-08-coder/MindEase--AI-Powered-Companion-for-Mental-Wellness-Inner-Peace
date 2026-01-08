import os
import random
import smtplib
import sqlitecloud
from email.mime.text import MIMEText
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv

# Load Env cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

CLOUD_URI = os.getenv("SQLITE_CLOUD_URI")
MAIL_SENDER = os.getenv("MAIL_SENDER")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
API_KEY = os.getenv("GEMINI_API_KEY")


def get_db():
    if not CLOUD_URI:
        print("❌ Error: SQLITE_CLOUD_URI not found in .env")
        return None
    try:
        
        return sqlitecloud.connect(CLOUD_URI)
    except Exception as e:
        print(f"❌ DB Connection Failed: {e}")
        return None

def init_db():
    conn = get_db()
    if conn:
        try:
            conn.execute('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, name TEXT, age TEXT, gender TEXT)')
            conn.commit()
            print("✅ Cloud Database Connected")
        except Exception as e:
            print(f"❌ DB Init Error: {e}")
        finally:
            conn.close()
    else:
        print("⚠️ Running without Database (Offline Mode)")

# Initialize DB
init_db()

otp_store = {}

# --- AI CLIENT SETUP ---
client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1alpha'})
        print("✅ AI Connected")
    except Exception as e:
        print(f"⚠️ AI Error: {e}")
else:
    print("⚠️ GEMINI_API_KEY not found in .env")


# --- EMAIL FUNCTION ---
def send_real_email(to_email, otp_code):
    if not MAIL_SENDER or not MAIL_PASSWORD:
        print("❌ Email Config Missing in .env")
        return False
    
    msg = MIMEText(f"Your MindEase Verification Code is: {otp_code}")
    msg['Subject'] = "Your MindEase Login OTP"
    msg['From'] = MAIL_SENDER
    msg['To'] = to_email

    try:
        # Using Gmail SSL Port 465
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(MAIL_SENDER, MAIL_PASSWORD)
            server.sendmail(MAIL_SENDER, to_email, msg.as_string())
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email Failed: {e}")
        return False


# --- ROUTES ---
@app.route('/', methods=['GET'])
def home():
    return "Backend is running!"

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email')
    if not email: return jsonify({"error": "Email required"}), 400

    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    
    # Send Email
    success = send_real_email(email, otp)
    
    # Backup print for testing if email fails
    print(f"\n[DEBUG] OTP for {email}: {otp}\n") 
    
    if success:
        return jsonify({"message": f"OTP sent to {email}"})
    else:
        return jsonify({"message": "Email failed (Check Console). Using Debug OTP."})

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_user_data = data.get('userData') 

    if email in otp_store and otp_store[email] == otp:
        del otp_store[email] 
        
        conn = get_db()
        if not conn: 
            # Allow login even if DB fails (Offline Mode)
            return jsonify({"message": "Login Successful (Offline Mode)", "user": new_user_data or {"name": "User", "email": email}})
        
        try:
            cursor = conn.cursor()
            if new_user_data:
                cursor.execute('INSERT OR REPLACE INTO users (email, name, age, gender) VALUES (?, ?, ?, ?)', 
                              (email, new_user_data['name'], new_user_data['age'], new_user_data['gender']))
                conn.commit()
                return jsonify({"message": "Account Created", "user": new_user_data})
            else:
                cursor.execute('SELECT name, age, gender FROM users WHERE email = ?', (email,))
                row = cursor.fetchone()
                if row:
                    user_data = {"name": row[0], "age": row[1], "gender": row[2], "email": email}
                    return jsonify({"message": "Welcome back!", "user": user_data})
                else:
                    return jsonify({"error": "User not found."}), 404
        finally:
            conn.close()
            
    return jsonify({"error": "Invalid OTP"}), 400

@app.route('/api/chat', methods=['POST'])
def chat():
    if not client: return jsonify({"error": "AI API Key missing"}), 500

    try:
        data = request.json
        user_message = data.get('message')
        if not user_message: return jsonify({"error": "No message"}), 400

        
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=f"Act as a mental health friend. User said: {user_message}. Reply with empathy in 2 sentences."
        )
        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
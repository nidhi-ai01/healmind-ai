from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fer import FER
import cv2
import numpy as np
import os
from dotenv import load_dotenv
from groq import Groq


# Load environment variables
load_dotenv()

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
app = FastAPI()
# Enable frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = None

def get_detector():
    global detector
    if detector is None:
        detector = FER(mtcnn=True)
    return detector

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    emotion: str

@app.get("/")
def home():
    return {"message": "HealMind AI Backend Running"}

@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):

    contents = await file.read()

    np_arr = np.frombuffer(contents, np.uint8)

    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    result = get_detector().detect_emotions(img)

    if result:
        emotions = result[0]["emotions"]

        top_emotion = max(emotions, key=emotions.get)

        confidence = emotions[top_emotion]

        return {
            "emotion": top_emotion,
            "confidence": round(confidence * 100, 2)
        }

    return {
        "emotion": "No face detected",
        "confidence": 0
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        emotion_guidance = {
            "sad": "comforting and empathetic",
            "happy": "uplifting and joyful",
            "angry": "calming and de-escalating",
            "fear": "reassuring and grounding",
            "neutral": "friendly and balanced",
            "surprise": "engaging and curious"
        }
        
        # Handle formatting like 'No face detected' or capitalized emotions gracefully
        emotion_key = request.emotion.lower()
        guidance = emotion_guidance.get(emotion_key, "friendly and supportive")

        system_prompt = (
            "You are a close online friend texting casually, acting as a natural emotional companion. "
            "Your responses must be TINY. Maximum 1-2 short sentences. Absolutely no long paragraphs. "
            "Use lowercase texting style occasionally. React naturally first (e.g. 'damn 😭', 'rough day?'), advise second. "
            "Do NOT sound like a therapist. No motivational quotes. No robotic AI tone. Keep it calm, subtle, and emotionally intelligent. "
            f"The user's current detected emotion is '{request.emotion}'. "
            f"Adapt your response vibe: {guidance}. "
            "For example, if sad: 'that sounds exhausting 😔'. If happy: 'ayyy love that energy ✨'."
        )

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=256
        )

        ai_response = chat_completion.choices[0].message.content

        return {"response": ai_response}

    except Exception as e:
        print("GROQ ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
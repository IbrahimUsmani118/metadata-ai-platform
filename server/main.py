from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS so your React app (port 5173) can talk to this Python app (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SETUP AI: You need to get a free API key from https://aistudio.google.com/
# Export it in your terminal or .env file as GEMINI_API_KEY
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

class CompareRequest(BaseModel):
    old_schema: str
    new_schema: str

@app.post("/analyze")
async def analyze_schema(request: CompareRequest):
    prompt = f"""
    Act as a Senior Data Engineer. Compare these two metadata schema versions.
    
    OLD VERSION:
    {request.old_schema}
    
    NEW VERSION:
    {request.new_schema}
    
    Task:
    1. Detect breaking changes (e.g., type changes, removed fields).
    2. Summarize the intent of the change.
    3. Output strictly in valid JSON format with keys: 'is_breaking' (boolean), 'changes' (list of strings), 'summary' (string).
    """
    
    try:
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
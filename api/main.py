import os
import json
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

# 1. Load Secrets
load_dotenv()

app = FastAPI(root_path="/api")

# 2. CORS (Allow Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Validation Models
class CompareRequest(BaseModel):
    old_schema: str
    new_schema: str

# 4. Health Check (To debug config)
@app.get("/health")
def health_check():
    gemini_key = os.getenv("GEMINI_API_KEY")
    supa_url = os.getenv("SUPABASE_URL")
    return {
        "status": "ok",
        "gemini_configured": bool(gemini_key),
        "supabase_configured": bool(supa_url),
        "python_version": "3.9 (Safe)"
    }

@app.get("/analyses")
def get_analyses():
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            return []
        supabase: Client = create_client(url, key)
        # Order by newest first
        response = supabase.table('metadata_analyses').select("*").order('id', desc=True).limit(20).execute()
        return response.data
    except Exception as e:
        print(f"Fetch Error: {e}")
        return []

@app.post("/analyze")
async def analyze_schema(request: CompareRequest):
    print("--- 1. Received Request ---")
    
    # Check Keys
    gemini_key = os.getenv("GEMINI_API_KEY")
    supa_url = os.getenv("SUPABASE_URL")
    supa_key = os.getenv("SUPABASE_KEY")

    if not gemini_key:
        print("ERROR: Missing GEMINI_API_KEY")
        raise HTTPException(status_code=500, detail="Server missing Gemini API Key")

    try:
        # A. Call AI
        print("--- 2. Calling Gemini AI ---")
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.0-flash')       
        
        prompt = f"""
        Act as a Data Engineer. Compare these two JSON schemas.
        
        Old: {request.old_schema}
        New: {request.new_schema}
        
        Return a JSON object with:
        - "is_breaking": true/false
        - "summary": "Short explanation of changes"
        - "changes": ["List", "of", "specific", "changes"]
        """
        
        response = model.generate_content(prompt)
        ai_text = response.text
        print(f"--- 3. AI Responded: {ai_text[:50]}... ---")

        # Clean AI response to ensure it parses as JSON
        clean_json_str = ai_text.replace("```json", "").replace("```", "").strip()
        try:
            ai_data = json.loads(clean_json_str)
            is_breaking = ai_data.get("is_breaking", False)
        except:
            # Fallback if AI returns plain text
            is_breaking = "breaking" in ai_text.lower()
            ai_data = {"summary": ai_text, "is_breaking": is_breaking, "changes": []}

        # B. Save to Supabase
        if supa_url and supa_key:
            print("--- 4. Saving to Supabase ---")
            supabase: Client = create_client(supa_url, supa_key)
            
            db_row = {
                "old_schema": request.old_schema,
                "new_schema": request.new_schema,
                "is_breaking": is_breaking,
                # Store the FULL JSON response in the text column
                "ai_summary": json.dumps(ai_data) 
            }
            
            supabase.table('metadata_analyses').insert(db_row).execute()
            print("--- 5. Saved Successfully ---")
        else:
            print("WARNING: Supabase keys missing, skipping DB save.")

        return ai_data

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
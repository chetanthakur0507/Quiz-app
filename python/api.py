from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import json
import os
import re

load_dotenv(".env.local")

app = FastAPI()

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class QuizRequest(BaseModel):
    topic: str
    num_questions: int = Field(ge=1, le=20)


def parse_quiz_json(raw_text: str):
    content = raw_text.strip()

    code_block_match = re.search(r"```(?:json)?\s*(.*?)```", content, re.DOTALL)
    if code_block_match:
        content = code_block_match.group(1).strip()

    candidates = [content]

    object_match = re.search(r"\{.*\}", content, re.DOTALL)
    if object_match:
        candidates.append(object_match.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue

        questions = parsed.get("questions", []) if isinstance(parsed, dict) else []
        if not isinstance(questions, list):
            continue

        normalized = []
        for item in questions:
            if not isinstance(item, dict):
                continue

            question = str(item.get("question", "")).strip()
            options = item.get("options", [])
            answer = str(item.get("answer", "")).strip()
            explanation = str(item.get("explanation", "")).strip()

            if not question or not isinstance(options, list):
                continue

            options = [str(opt).strip() for opt in options if str(opt).strip()]
            if len(options) < 4:
                continue

            if answer not in options:
                continue

            normalized.append(
                {
                    "question": question,
                    "options": options[:4],
                    "answer": answer,
                    "explanation": explanation,
                }
            )

        if normalized:
            return normalized

    raise HTTPException(status_code=500, detail="Could not parse quiz JSON from model response.")


@app.post("/generate-quiz")
def generate_quiz(data: QuizRequest):
    prompt = f"""
Generate {data.num_questions} multiple-choice questions about \"{data.topic}\".

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "One exact option from options array",
      "explanation": "One short explanation"
    }}
  ]
}}

Rules:
- Exactly {data.num_questions} questions.
- Exactly 4 options per question.
- answer must exactly match one option string.
- No markdown, no code fences, no extra text.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_content = response.choices[0].message.content or ""
    questions = parse_quiz_json(raw_content)

    return {"quiz": questions}

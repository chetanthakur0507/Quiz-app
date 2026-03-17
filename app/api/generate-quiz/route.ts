import { NextResponse } from "next/server";

type QuizRequest = {
  topic?: string;
  num_questions?: number;
};

type QuizItem = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function parseQuizJson(rawText: string): QuizItem[] {
  const content = rawText.trim();
  const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/i);

  const candidates = [content];
  if (codeBlock?.[1]) {
    candidates.push(codeBlock[1].trim());
  }

  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { questions?: unknown };
      if (!parsed || !Array.isArray(parsed.questions)) {
        continue;
      }

      const normalized: QuizItem[] = [];

      for (const item of parsed.questions) {
        if (!item || typeof item !== "object") {
          continue;
        }

        const record = item as Record<string, unknown>;
        const question = String(record.question ?? "").trim();
        const optionsRaw = record.options;
        const answer = String(record.answer ?? "").trim();
        const explanation = String(record.explanation ?? "").trim();

        if (!question || !Array.isArray(optionsRaw)) {
          continue;
        }

        const options = optionsRaw
          .map((opt) => String(opt ?? "").trim())
          .filter(Boolean)
          .slice(0, 4);

        if (options.length < 4 || !answer || !options.includes(answer)) {
          continue;
        }

        normalized.push({
          question,
          options,
          answer,
          explanation,
        });
      }

      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  throw new Error("Could not parse quiz JSON from model response.");
}

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured on server." },
      { status: 500 }
    );
  }

  let body: QuizRequest;

  try {
    body = (await req.json()) as QuizRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim();
  const numQuestions = Number(body.num_questions);

  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 20) {
    return NextResponse.json(
      { error: "num_questions must be an integer between 1 and 20." },
      { status: 400 }
    );
  }

  const prompt = `
Generate ${numQuestions} multiple-choice questions about "${topic}".

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "One exact option from options array",
      "explanation": "One short explanation"
    }
  ]
}

Rules:
- Exactly ${numQuestions} questions.
- Exactly 4 options per question.
- answer must exactly match one option string.
- No markdown, no code fences, no extra text.
`;

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      return NextResponse.json(
        { error: "Groq request failed.", detail },
        { status: 502 }
      );
    }

    const payload = (await groqResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = payload.choices?.[0]?.message?.content ?? "";
    const questions = parseQuizJson(rawContent);

    return NextResponse.json({ quiz: questions });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate quiz." },
      { status: 500 }
    );
  }
}

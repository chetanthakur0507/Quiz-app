"use client";

import { useMemo, useState } from "react";

const initialQuizState = {
  questions: [],
  currentIndex: 0,
  score: 0,
  selectedOption: "",
  showFeedback: false,
  completed: false,
};

export default function QuizForm() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [quizState, setQuizState] = useState(initialQuizState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  const generateQuizUrl = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, "")}/generate-quiz`
    : "/api/generate-quiz";

  const currentQuestion = useMemo(() => {
    return quizState.questions[quizState.currentIndex] || null;
  }, [quizState.currentIndex, quizState.questions]);

  const progressPercent = useMemo(() => {
    if (!quizState.questions.length) return 0;
    return Math.round((quizState.currentIndex / quizState.questions.length) * 100);
  }, [quizState.currentIndex, quizState.questions.length]);

  const resetQuizProgress = (questions = []) => {
    setQuizState({
      questions,
      currentIndex: 0,
      score: 0,
      selectedOption: "",
      showFeedback: false,
      completed: false,
    });
  };

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic first.");
      return;
    }

    if (!numQuestions || Number(numQuestions) <= 0) {
      setError("Please select at least 1 question.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      resetQuizProgress([]);

      const res = await fetch(generateQuizUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          num_questions: Number(numQuestions),
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error("Invalid quiz payload.");
      }

      resetQuizProgress(data.quiz);
    } catch (fetchError) {
      console.error(fetchError);
      setError("Quiz generate nahi hua. API configuration check karo aur dobara try karo.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectOption = (option) => {
    if (!currentQuestion || quizState.showFeedback) return;

    const isCorrect = option === currentQuestion.answer;

    setQuizState((prev) => ({
      ...prev,
      selectedOption: option,
      showFeedback: true,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const onNextQuestion = () => {
    if (!quizState.questions.length) return;

    const isLastQuestion = quizState.currentIndex === quizState.questions.length - 1;

    if (isLastQuestion) {
      setQuizState((prev) => ({
        ...prev,
        completed: true,
      }));
      return;
    }

    setQuizState((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      selectedOption: "",
      showFeedback: false,
    }));
  };

  const restartSameQuiz = () => {
    if (!quizState.questions.length) return;
    resetQuizProgress(quizState.questions);
  };

  const getOptionClass = (option) => {
    if (!quizState.showFeedback) {
      return "bg-white/70 hover:bg-white border-neutral-300 text-neutral-900";
    }

    if (option === currentQuestion?.answer) {
      return "bg-emerald-100 border-emerald-400 text-emerald-900";
    }

    if (option === quizState.selectedOption) {
      return "bg-rose-100 border-rose-400 text-rose-900";
    }

    return "bg-white/50 border-neutral-300 text-neutral-500";
  };

  return (
    <section className="w-full max-w-3xl rounded-3xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-xl md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900">Smart Quiz Arena</h1>
        {quizState.questions.length > 0 && (
          <span className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
            Score {quizState.score}/{quizState.questions.length}
          </span>
        )}
      </div>

      {!quizState.questions.length && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-700">Topic select karo, question count choose karo, aur instant interactive quiz play karo.</p>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <input
              type="text"
              placeholder="Example: JavaScript, AI, Physics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white/80 p-3 text-neutral-900 outline-none ring-0 transition focus:border-cyan-500"
            />

            <input
              type="number"
              min="1"
              max="20"
              placeholder="Questions"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white/80 p-3 text-neutral-900 outline-none ring-0 transition focus:border-cyan-500"
            />
          </div>

          <button
            onClick={generateQuiz}
            disabled={isLoading}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Generating Quiz..." : "Generate Quiz"}
          </button>
        </div>
      )}

      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {!!quizState.questions.length && !quizState.completed && currentQuestion && (
        <div className="space-y-5">
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/70 p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              Question {quizState.currentIndex + 1} / {quizState.questions.length}
            </p>
            <h2 className="text-xl font-bold text-neutral-900">{currentQuestion.question}</h2>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => onSelectOption(option)}
                disabled={quizState.showFeedback}
                className={`rounded-xl border p-3 text-left font-medium transition ${getOptionClass(option)}`}
              >
                {option}
              </button>
            ))}
          </div>

          {quizState.showFeedback && (
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white/80 p-4">
              {quizState.selectedOption === currentQuestion.answer ? (
                <p className="text-sm font-semibold text-emerald-700">Correct answer! +1 mark</p>
              ) : (
                <p className="text-sm font-semibold text-rose-700">
                  Wrong answer. Correct answer: <span className="font-black">{currentQuestion.answer}</span>
                </p>
              )}

              {currentQuestion.explanation && (
                <p className="text-sm text-neutral-700">{currentQuestion.explanation}</p>
              )}

              <button
                onClick={onNextQuestion}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                {quizState.currentIndex === quizState.questions.length - 1 ? "Finish Quiz" : "Next Question"}
              </button>
            </div>
          )}
        </div>
      )}

      {quizState.completed && (
        <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-2xl font-black text-emerald-900">Quiz Completed</h2>
          <p className="text-lg font-semibold text-emerald-800">
            You scored {quizState.score} out of {quizState.questions.length}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={restartSameQuiz}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Retry Same Quiz
            </button>
            <button
              onClick={() => resetQuizProgress([])}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Create New Quiz
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

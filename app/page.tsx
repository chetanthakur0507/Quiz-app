import Image from "next/image";
import QuizForm from "../components/quizform";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-100 via-amber-50 to-emerald-100 px-4 py-10">
      <Image
        src="/bg photo.png"
        alt=""
        fill
        priority
        className="animated-bg-image pointer-events-none absolute inset-0 z-0 object-cover object-center opacity-95"
      />
      <Image
        src="/bg photo.png"
        alt=""
        fill
        priority
        className="animated-bg-parallax pointer-events-none absolute inset-0 z-0 object-cover object-center opacity-50 mix-blend-soft-light"
      />
      <div className="animated-bg-sheen pointer-events-none absolute inset-0 z-0" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/20 via-transparent to-emerald-50/20" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_32%,rgba(15,23,42,0.15)_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-10 z-0 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 z-0 h-80 w-80 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="relative z-10 w-full max-w-3xl">
        <QuizForm />
      </div>
    </main>
  );
}

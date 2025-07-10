import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <section className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 py-16">
        {/* Hero Illustration Placeholder */}
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--accent-teal)] flex items-center justify-center shadow-2xl">
            {/* Replace this div with an SVG or image for a real illustration */}
            <span className="text-[8rem] md:text-[10rem] text-[var(--accent-teal)] opacity-80 select-none">🤖</span>
          </div>
        </div>
        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-start gap-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--primary-blue)] leading-tight">
            Build your own <span className="text-[var(--accent-teal)]">AI Voice Agent</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-md">
            Create, customize, and launch AI-powered voice agents for your business. Configure powerful tools and integrations—no coding required.
          </p>
          <div className="flex gap-6 mt-2">
            <Link href="/auth" className="px-6 py-3 rounded-lg bg-[var(--primary-blue)] text-white font-bold shadow-md hover:bg-[var(--accent-teal)] hover:text-white transition">Get Started Free</Link>
            <Link href="/auth" className="px-6 py-3 rounded-lg border-2 border-[var(--primary-blue)] text-[var(--primary-blue)] font-bold hover:bg-[var(--primary-blue)] hover:text-white transition">Login</Link>
          </div>
        </div>
      </section>
      {/* How it works section */}
      <section className="w-full max-w-4xl mx-auto py-8 px-4 grid md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">🛠️</span>
          <h3 className="font-bold text-lg text-[var(--primary-blue)] mb-2">Configure Tools</h3>
          <p className="text-gray-600 text-sm">Connect your favorite APIs and tools to empower your AI agent with real-world actions.</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">🎤</span>
          <h3 className="font-bold text-lg text-[var(--primary-blue)] mb-2">Design Voice Agents</h3>
          <p className="text-gray-600 text-sm">Customize your agent’s voice, behavior, and skills to match your brand and use case.</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <span className="text-4xl mb-3">🚀</span>
          <h3 className="font-bold text-lg text-[var(--primary-blue)] mb-2">Launch & Scale</h3>
          <p className="text-gray-600 text-sm">Deploy your AI voice agent and scale effortlessly as your needs grow.</p>
        </div>
      </section>
    </>
  );
} 
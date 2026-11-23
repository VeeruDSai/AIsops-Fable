export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl p-8 rounded-2xl bg-white shadow-sm border border-stone-200">
        <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 rounded-full">
          Phase 1 Foundation Active
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
          StoryForge AI
        </h1>
        <p className="text-stone-600 mb-6">
          Serverless Google Gemini streaming backend initialized. Ready for real-time storytelling.
        </p>
        <div className="text-xs text-stone-500 font-mono bg-stone-50 p-3 rounded-lg border border-stone-200 text-left">
          <code>POST /api/generate</code> — Streaming Route Active
        </div>
      </div>
    </main>
  );
}

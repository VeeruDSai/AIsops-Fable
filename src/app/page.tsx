import { StoryForm } from '@/components/StoryForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fdfbf7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="text-center">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800">
            Instant fables, zero friction
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
            StoryForge AI
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600 sm:text-base">
            Shape a cast, pick a genre, and watch a complete story unfold in real time.
          </p>
        </header>
        <StoryForm />
      </div>
    </main>
  );
}

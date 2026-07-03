import { strings } from "./i18n/strings";

// App shell. Screens (setup / game / results) are wired in later tasks.
export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center">
      <h1 className="text-5xl font-black text-text-primary mb-3">
        {strings.appTitle}
      </h1>
      <p className="text-text-secondary max-w-sm">{strings.tagline}</p>
      <span className="mt-8 text-xs uppercase tracking-widest text-text-tertiary">
        {strings.comingSoon}
      </span>
    </div>
  );
}

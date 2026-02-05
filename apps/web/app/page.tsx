import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">notaprompt</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">Internal workspace for thinking & execution</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium shadow-soft hover:shadow-elevated transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}

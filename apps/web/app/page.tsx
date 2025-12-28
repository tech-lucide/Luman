import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">
          notaprompt
        </h1>

        <p className="text-muted-foreground">
          Internal workspace for thinking & execution
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );
}

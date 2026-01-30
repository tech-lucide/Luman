"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"founder" | "intern">("founder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically log in or redirect to login
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign up for a new workspace</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="ownerName" className="block text-sm font-medium mb-2">
              Owner Name (Username)
            </label>
            <input
              id="ownerName"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Choose a unique username"
              required
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
              minLength={6}
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("founder")}
                className={`p-3 text-sm font-medium rounded-lg border transition ${
                  role === "founder"
                    ? "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-950 dark:border-amber-500 dark:text-amber-300"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Founder
              </button>
              <button
                type="button"
                onClick={() => setRole("intern")}
                className={`p-3 text-sm font-medium rounded-lg border transition ${
                  role === "intern"
                    ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300"
                    : "bg-background hover:bg-muted"
                }`}
              >
                Intern
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

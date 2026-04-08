"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");

    if (verified === "1") {
      setVerificationMessage("Email verified. You can login now.");
      return;
    }

    if (verified === "expired") {
      setVerificationMessage("Verification link expired. Please sign up again.");
      return;
    }

    if (verified === "invalid") {
      setVerificationMessage("Invalid verification link.");
      return;
    }

    if (verified === "error") {
      setVerificationMessage("Verification failed. Try again.");
      return;
    }

    setVerificationMessage("");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back. Enter your credentials.</p>

        {verificationMessage ? (
          <p className="auth-note success mb-3">{verificationMessage}</p>
        ) : null}

        {message ? (
          <p className={`auth-note mb-3 ${isError ? "error" : "success"}`}>{message}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-3 text-sm text-slate-600">
          <Link href="/forgot-password" className="auth-link">Forgot password?</Link>
        </p>

        <p className="mt-4 text-sm text-slate-600">
          New here? <Link href="/signup" className="auth-link">Create account</Link>
        </p>
      </div>
    </div>
  );
}

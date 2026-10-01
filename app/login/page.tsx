"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-logo-mark">A</div>
        <h1 className="auth-brand-title">
          Asset<span className="accent-dot">Tracker</span>
        </h1>
        <p className="auth-brand-tagline">
          A secure, role-based system for tracking company equipment — from
          intake to assignment to retirement.
        </p>
        <div className="auth-brand-features">
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Real-time custody records for every device
          </div>
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Role-based access for admins and employees
          </div>
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Full audit trail of assignments and status
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <div className="auth-logo-mark">A</div>
            <span>AssetTracker</span>
          </div>

          <div className="card">
            <div className="auth-card-header">
              <h1>Sign in</h1>
              <p>Enter your company credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
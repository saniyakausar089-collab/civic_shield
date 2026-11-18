import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  KeyRound,
  Mail,
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Cpu,
  Lock,
  Server,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const { user, profile, isAuthenticated, signInWithEmail, signUpWithEmail, signOut, isLoading } =
    useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<
    "incident_commander" | "lead_engineer" | "analyst" | "observer"
  >("analyst");
  const [organization, setOrganization] = useState(
    "Hyderabad Civic Resilience Command"
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Authentication successful. Granting terminal access...");
        setTimeout(() => {
          window.location.replace("/simulator");
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setErrorMessage("Please provide an email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUpWithEmail(email, password, {
        fullName,
        role,
        organization,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Account created & authorized. Entering Command Console...");
        setTimeout(() => {
          window.location.replace("/simulator");
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col justify-between font-sans selection:bg-[var(--accent-muted)] relative overflow-hidden">
      {/* Top Header Navigation */}
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 sm:px-10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 rounded-[8px] bg-[var(--surface-3)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] font-bold text-xs">
              CS
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[var(--text-primary)]">
              CIVICSHIELD
            </span>
          </Link>
          <span className="hidden sm:inline-block text-[12px] text-[var(--text-tertiary)] font-normal pl-2.5 border-l border-[var(--border-subtle)]">
            Operator Access Gateway
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
          >
            ← Return to Overview
          </Link>

          {isAuthenticated ? (
            <Link
              to="/simulator"
              className="ops-btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2"
            >
              <span>Enter Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>Login Required</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 z-10 relative">
        <div className="w-full max-w-md">
          {/* Authenticated State Card */}
          {isAuthenticated && user ? (
            <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.35)] space-y-5 relative overflow-hidden">
              <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div className="w-11 h-11 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] font-bold">
                  <Shield className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                      {profile?.full_name || user.email?.split("@")[0] || "Operator"}
                    </span>
                    <span className="ops-chip text-[10.5px] font-medium text-[var(--status-good)] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-good)]" />
                      Authorized
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--text-tertiary)] truncate max-w-[240px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-[var(--surface-2)] p-3.5 rounded-[8px] border border-[var(--border-subtle)] text-[12.5px]">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Clearance Level:</span>
                  <span className="text-[var(--text-primary)] font-medium capitalize">
                    {profile?.role?.replace("_", " ") || "Analyst"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Agency Unit:</span>
                  <span className="text-[var(--text-primary)] font-medium truncate max-w-[180px]">
                    {profile?.organization || "Hyderabad Municipal Command"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-tertiary)]">Operator ID:</span>
                  <span className="text-[var(--text-secondary)] font-mono text-[11px] truncate max-w-[150px]">
                    {user.id.slice(0, 13)}...
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--text-tertiary)]">Security Context:</span>
                  <span className="text-[var(--accent)] font-medium">Supabase PostgreSQL RLS</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => window.location.replace("/simulator")}
                  className="ops-btn-primary w-full py-2.5 px-4 rounded-[8px] text-[13.5px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Enter Command Console</span>
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    setSuccessMessage("Session terminated.");
                  }}
                  className="ops-btn-secondary w-full py-2 px-4 rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login / Signup Form Card */
            <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.35)] space-y-5 relative overflow-hidden">
              {/* Header Title & Mode Toggle */}
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[11px] font-medium">
                  <Lock className="w-3 h-3 text-[var(--accent)]" />
                  <span>Operator Authentication Gateway</span>
                </div>

                <h2 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-[var(--text-primary)] leading-[1.2]">
                  {mode === "signin" ? "Sign in to CivicShield" : "Register Operator Profile"}
                </h2>

                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  Enter your credentials to access the 3D digital twin, cascade simulator, and emergency plans.
                </p>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-1 bg-[var(--surface-2)] rounded-[8px] border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-1.5 text-[13px] rounded-[6px] transition-colors cursor-pointer ${
                      mode === "signin"
                        ? "bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold shadow-xs"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-1.5 text-[13px] rounded-[6px] transition-colors cursor-pointer ${
                      mode === "signup"
                        ? "bg-[var(--surface-1)] text-[var(--text-primary)] font-semibold shadow-xs"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-medium"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--status-failed)]/40 text-[var(--status-failed)] text-[12.5px] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--status-failed)]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--status-good)]/40 text-[var(--status-good)] text-[12.5px] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[var(--status-good)]" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
                className="space-y-3.5 text-[13.5px]"
              >
                {/* Additional fields for signup */}
                {mode === "signup" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Rajesh Varma"
                        className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[8px] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        <span>Role Classification</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[8px] px-3 py-2 text-[var(--text-primary)] focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="analyst">Infrastructure Analyst (Standard)</option>
                        <option value="lead_engineer">Lead Systems Engineer</option>
                        <option value="incident_commander">Incident Commander</option>
                        <option value="observer">Civic Observer</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-[var(--text-secondary)]">Organization / Agency</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Hyderabad Municipal Command"
                        className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[8px] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@civicshield.gov.in"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[8px] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] focus:border-[var(--accent)] rounded-[8px] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="ops-btn-primary w-full py-2.5 px-4 rounded-[8px] text-[13.5px] font-semibold flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : mode === "signin" ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Bottom Security Note */}
          <div className="mt-4 text-center text-[12px] text-[var(--text-tertiary)] space-y-0.5">
            <div className="flex items-center justify-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Protected by Supabase Authentication &amp; PostgreSQL RLS</span>
            </div>
            <div>TLS 1.3 Encrypted Enterprise Session</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 sm:px-10 flex items-center justify-between text-[12px] text-[var(--text-tertiary)] z-10">
        <div>CivicShield Urban Resilience Digital Twin</div>
        <div>Operational Station: HYD-METRO-01</div>
      </footer>
    </div>
  );
}

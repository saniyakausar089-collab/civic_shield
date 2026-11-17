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
  Sparkles,
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
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#09090B] text-[#111827] dark:text-[#FAFAFA] flex flex-col justify-between font-sans selection:bg-[#2563EB]/15 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#2563EB]/10 dark:from-[#3B82F6]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-ambient-grid opacity-50 pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="h-16 border-b border-[#E5E7EB] dark:border-[#27272A] bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl px-6 sm:px-10 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-semibold text-[17px] tracking-tight text-[#111827] dark:text-[#FAFAFA]">
              Civic<span className="text-[#2563EB] dark:text-[#3B82F6]">Shield</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block text-[13px] text-[#94A3B8] dark:text-[#71717A] font-normal pl-2.5 border-l border-[#E5E7EB] dark:border-[#27272A]">
            Operator Access Gateway
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-[13.5px] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] transition-colors font-medium"
          >
            ← Return to Overview
          </Link>

          {isAuthenticated ? (
            <Link
              to="/simulator"
              className="px-4 py-2 rounded-lg text-[13.5px] font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-2 transition-all duration-180 shadow-xs active:scale-[0.98]"
            >
              <span>Enter Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-white dark:bg-[#111318] text-[#475569] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#27272A]">
              <Lock className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
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
            <div className="bg-white dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-7 sm:p-9 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
              <div className="flex items-center gap-4 border-b border-[#E5E7EB] dark:border-[#27272A] pb-5">
                <div className="w-12 h-12 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-[#111827] dark:text-[#FAFAFA]">
                      {profile?.full_name || user.email?.split("@")[0] || "Operator"}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                      Authorized
                    </span>
                  </div>
                  <div className="text-[13px] text-[#94A3B8] dark:text-[#71717A] truncate max-w-[240px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 bg-[#F7F8FA] dark:bg-[#181B22] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#27272A] text-[13px]">
                <div className="flex justify-between py-1 border-b border-[#E5E7EB] dark:border-[#27272A]/70">
                  <span className="text-[#94A3B8] dark:text-[#71717A]">Clearance Level:</span>
                  <span className="text-[#111827] dark:text-[#FAFAFA] font-medium capitalize">
                    {profile?.role?.replace("_", " ") || "Analyst"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB] dark:border-[#27272A]/70">
                  <span className="text-[#94A3B8] dark:text-[#71717A]">Agency Unit:</span>
                  <span className="text-[#111827] dark:text-[#FAFAFA] font-medium truncate max-w-[180px]">
                    {profile?.organization || "Hyderabad Municipal Command"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB] dark:border-[#27272A]/70">
                  <span className="text-[#94A3B8] dark:text-[#71717A]">Operator ID:</span>
                  <span className="text-[#475569] dark:text-[#A1A1AA] font-mono text-[12px] truncate max-w-[150px]">
                    {user.id.slice(0, 13)}...
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#94A3B8] dark:text-[#71717A]">Security Context:</span>
                  <span className="text-[#2563EB] dark:text-[#3B82F6] font-medium">Supabase PostgreSQL RLS</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => window.location.replace("/simulator")}
                  className="w-full py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 transition-all duration-180 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Enter Command Console</span>
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    setSuccessMessage("Session terminated.");
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-[#181B22] hover:bg-[#F7F8FA] dark:hover:bg-[#20242D] text-[#475569] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#FAFAFA] text-[13.5px] font-medium flex items-center justify-center gap-2 transition-colors border border-[#E5E7EB] dark:border-[#27272A] cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login / Signup Form Card */
            <div className="bg-white dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-7 sm:p-9 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
              {/* Header Title & Mode Toggle */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] text-[#475569] dark:text-[#A1A1AA] text-[12px] font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span>Operator Authentication Gateway</span>
                </div>

                <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#111827] dark:text-[#FAFAFA] leading-[1.2]">
                  {mode === "signin" ? "Sign in to CivicShield" : "Register Operator Profile"}
                </h2>

                <p className="text-[14px] text-[#94A3B8] dark:text-[#71717A] leading-relaxed">
                  Enter your credentials to access the 3D digital twin, cascade simulator, and emergency plans.
                </p>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-1 bg-[#F7F8FA] dark:bg-[#181B22] rounded-xl border border-[#E5E7EB] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 text-[13.5px] rounded-lg transition-all duration-150 cursor-pointer ${
                      mode === "signin"
                        ? "bg-white dark:bg-[#111318] text-[#111827] dark:text-[#FAFAFA] shadow-xs font-semibold"
                        : "text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] font-medium"
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
                    className={`py-2 text-[13.5px] rounded-lg transition-all duration-150 cursor-pointer ${
                      mode === "signup"
                        ? "bg-white dark:bg-[#111318] text-[#111827] dark:text-[#FAFAFA] shadow-xs font-semibold"
                        : "text-[#94A3B8] dark:text-[#71717A] hover:text-[#111827] dark:hover:text-[#FAFAFA] font-medium"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[13px] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[13px] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
                className="space-y-4 text-[14px]"
              >
                {/* Additional fields for signup */}
                {mode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569] dark:text-[#A1A1AA] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Rajesh Varma"
                        className="w-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 rounded-lg px-3.5 py-2.5 text-[#111827] dark:text-[#FAFAFA] placeholder-[#94A3B8] dark:placeholder-[#71717A] focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569] dark:text-[#A1A1AA] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
                        <span>Role Classification</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 rounded-lg px-3.5 py-2.5 text-[#111827] dark:text-[#FAFAFA] focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="analyst">Infrastructure Analyst (Standard)</option>
                        <option value="lead_engineer">Lead Systems Engineer</option>
                        <option value="incident_commander">Incident Commander</option>
                        <option value="observer">Civic Observer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#475569] dark:text-[#A1A1AA]">Organization / Agency</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Hyderabad Municipal Command"
                        className="w-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 rounded-lg px-3.5 py-2.5 text-[#111827] dark:text-[#FAFAFA] placeholder-[#94A3B8] dark:placeholder-[#71717A] focus:outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569] dark:text-[#A1A1AA] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@civicshield.gov.in"
                    className="w-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 rounded-lg px-3.5 py-2.5 text-[#111827] dark:text-[#FAFAFA] placeholder-[#94A3B8] dark:placeholder-[#71717A] focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#475569] dark:text-[#A1A1AA] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#71717A]" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-2 focus:ring-[#2563EB]/20 rounded-lg px-3.5 py-2.5 text-[#111827] dark:text-[#FAFAFA] placeholder-[#94A3B8] dark:placeholder-[#71717A] focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:bg-[#2563EB]/50 text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 transition-all duration-180 shadow-xs mt-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-5 text-center text-[13px] text-[#94A3B8] dark:text-[#71717A] space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Protected by Supabase Authentication &amp; PostgreSQL RLS</span>
            </div>
            <div className="text-[12px] text-[#94A3B8]/80 dark:text-[#71717A]/80">
              TLS 1.3 Encrypted Enterprise Session
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-[#E5E7EB] dark:border-[#27272A] bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-xl px-6 sm:px-10 flex items-center justify-between text-[13px] text-[#94A3B8] dark:text-[#71717A] z-10">
        <div>CivicShield Urban Resilience Digital Twin</div>
        <div>Operational Station: HYD-METRO-01</div>
      </footer>
    </div>
  );
}

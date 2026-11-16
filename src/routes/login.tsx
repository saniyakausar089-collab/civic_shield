import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  Radio,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const { user, profile, isAuthenticated, signInWithEmail, signUpWithEmail, signOut, isLoading } =
    useAuth();
  const navigate = useNavigate();

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
      const { error, user: newUser } = await signUpWithEmail(email, password, {
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
    <div className="min-h-screen bg-[#0e1216] text-[#e5e9ec] flex flex-col justify-between selection:bg-[#9BAA76] selection:text-[#101418] relative overflow-hidden font-sans">
      {/* Background Cyber-Grid Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#9BAA76 1px, transparent 1px), linear-gradient(90deg, #9BAA76 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top Header Navigation */}
      <header className="h-14 border-b border-[#26313a] bg-[#14191d]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#9BAA76] flex items-center justify-center text-[#101418] font-bold text-xs">
            C
          </div>
          <span className="font-bold tracking-wider text-sm sm:text-base text-[#f1f4f6]">
            CIVICSHIELD
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e262d] text-[#8a96a1] border border-[#2b3741]">
            AUTHENTICATION GATEWAY
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#8a96a1]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>CLUSTER: trrggaiakntmikkbazbd</span>
          </div>

          {isAuthenticated ? (
            <Link
              to="/simulator"
              className="px-3 py-1.5 rounded text-xs font-mono bg-[#1c242b] hover:bg-[#252f38] text-[#9BAA76] border border-[#303f4d] flex items-center gap-1.5 transition-colors"
            >
              <span>Enter Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#1c242b] text-[#8a96a1] border border-[#26313a]">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Login Required</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md">
          {/* Authenticated State Card */}
          {isAuthenticated && user ? (
            <div className="bg-[#14191d] border border-[#303941] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-[#26313a] pb-4">
                <div className="w-12 h-12 rounded-lg bg-[#242c33] border border-[#374552] flex items-center justify-center text-[#9BAA76]">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f1f4f6]">
                      {profile?.full_name || user.email?.split("@")[0] || "Operator"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b2b22] text-emerald-400 border border-emerald-500/40 uppercase">
                      Authorized
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#8a96a1] truncate max-w-[240px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-[#0f1418] p-4 rounded-lg border border-[#222b33] text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#1b242b]">
                  <span className="text-[#8a96a1]">Security Clearance:</span>
                  <span className="text-[#9BAA76] capitalize">
                    {profile?.role?.replace("_", " ") || "Analyst"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b242b]">
                  <span className="text-[#8a96a1]">Agency Unit:</span>
                  <span className="text-[#e5e9ec] truncate max-w-[180px]">
                    {profile?.organization || "Civic Infrastructure Command"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1b242b]">
                  <span className="text-[#8a96a1]">Operator UUID:</span>
                  <span className="text-[#717e89] truncate max-w-[150px]">
                    {user.id.slice(0, 13)}...
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8a96a1]">Auth Protocol:</span>
                  <span className="text-[#38bdf8]">Supabase PostgreSQL</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => window.location.replace("/simulator")}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#9BAA76] hover:bg-[#a9b984] text-[#101418] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#9BAA76]/10"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Enter Command Console</span>
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    setSuccessMessage("Session terminated.");
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-[#1f262d] hover:bg-[#2b353e] text-[#8a96a1] hover:text-[#d2d8de] text-xs font-mono flex items-center justify-center gap-2 transition-colors border border-[#2a353f]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mandatory Login / Signup Form Card */
            <div className="bg-[#14191d] border border-[#303941] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Header Title & Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#9BAA76]" />
                    <span className="text-xs font-mono uppercase tracking-widest text-[#8a96a1]">
                      MANDATORY OPERATOR AUTH
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c242b] text-[#38bdf8] border border-[#273542]">
                    v5.2
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1f4f6]">
                  {mode === "signin" ? "Operator Authentication" : "Register Command Profile"}
                </h2>

                <p className="text-xs text-[#8a96a1] font-mono leading-relaxed">
                  Authentication is strictly required before accessing the CivicShield digital twin and simulation tools.
                </p>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 bg-[#0f1418] p-1 rounded-lg border border-[#222b33]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-1.5 text-xs font-medium rounded transition-colors ${
                      mode === "signin"
                        ? "bg-[#252f38] text-[#9BAA76] shadow font-semibold"
                        : "text-[#8a96a1] hover:text-[#d2d8de]"
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
                    className={`py-1.5 text-xs font-medium rounded transition-colors ${
                      mode === "signup"
                        ? "bg-[#252f38] text-[#9BAA76] shadow font-semibold"
                        : "text-[#8a96a1] hover:text-[#d2d8de]"
                    }`}
                  >
                    New Account
                  </button>
                </div>
              </div>

              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#331c1c] border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-mono">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-[#192b20] border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span className="font-mono">{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
                className="space-y-4 text-xs font-mono"
              >
                {/* Additional fields for signup */}
                {mode === "signup" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[#8a96a1] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#9BAA76]" />
                        <span>OPERATOR FULL NAME</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Rajesh Varma"
                        className="w-full bg-[#0f1418] border border-[#2b3741] focus:border-[#9BAA76] rounded px-3 py-2 text-[#f1f4f6] placeholder-[#53616c] focus:outline-none transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[#8a96a1] flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#9BAA76]" />
                        <span>ROLE CLASSIFICATION</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full bg-[#0f1418] border border-[#2b3741] focus:border-[#9BAA76] rounded px-3 py-2 text-[#f1f4f6] focus:outline-none transition-colors"
                      >
                        <option value="analyst">Infrastructure Analyst (Standard)</option>
                        <option value="lead_engineer">Lead Systems Engineer</option>
                        <option value="incident_commander">Incident Commander</option>
                        <option value="observer">Civic Observer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[#8a96a1]">ORGANIZATION / AGENCY</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Hyderabad Municipal Command"
                        className="w-full bg-[#0f1418] border border-[#2b3741] focus:border-[#9BAA76] rounded px-3 py-2 text-[#f1f4f6] placeholder-[#53616c] focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[#8a96a1] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9BAA76]" />
                    <span>TERMINAL EMAIL</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@civicshield.gov.in"
                    className="w-full bg-[#0f1418] border border-[#2b3741] focus:border-[#9BAA76] rounded px-3 py-2 text-[#f1f4f6] placeholder-[#53616c] focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-[#8a96a1] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#9BAA76]" />
                    <span>SECURITY KEY / PASSWORD</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0f1418] border border-[#2b3741] focus:border-[#9BAA76] rounded px-3 py-2 text-[#f1f4f6] placeholder-[#53616c] focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#9BAA76] hover:bg-[#a9b984] disabled:bg-[#505a40] text-[#101418] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg shadow-[#9BAA76]/10"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#101418] border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : mode === "signin" ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize Session</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Create Command Account</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Bottom Security Note */}
          <div className="mt-4 text-center text-[11px] font-mono text-[#62707b] space-y-1">
            <div>Protected by Supabase Authentication & PostgreSQL RLS</div>
            <div className="text-[10px] text-[#4f5b64]">
              Instance: trrggaiakntmikkbazbd.supabase.co • TLS 1.3 Encrypted
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#222c34] bg-[#101418] px-4 flex items-center justify-between text-[11px] font-mono text-[#65737e] z-10">
        <div>CIVICSHIELD RESILIENCE DIGITAL TWIN</div>
        <div>STATION: HYD-METRO-01</div>
      </footer>
    </div>
  );
}

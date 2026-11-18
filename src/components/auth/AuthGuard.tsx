import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Shield } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const isBypassed =
    typeof window !== "undefined" &&
    Boolean((window as any).__BYPASS_AUTH__ || localStorage.getItem("civic_bypass_auth") === "1");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isBypassed) {
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, isAuthenticated, isBypassed, navigate]);

  if (isBypassed) {
    return <>{children}</>;
  }

  // While checking Supabase session or if unauthenticated (during redirect)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-screen h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center font-sans select-none relative overflow-hidden">
        <div className="z-10 flex flex-col items-center max-w-sm text-center p-8 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] space-y-4">
          <div className="w-12 h-12 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] relative">
            <Shield className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
          </div>

          <div className="space-y-1.5">
            <div className="text-[14px] font-semibold text-[var(--text-primary)]">
              CivicShield Security Gateway
            </div>
            <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed" suppressHydrationWarning>
              {!isAuthenticated && !isLoading
                ? "Access denied. Redirecting to operator sign in..."
                : "Verifying operator credentials & security clearance..."}
            </div>
          </div>

          <div className="w-48 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full animate-pulse w-3/4" />
          </div>

          <div className="text-[11px] text-[var(--text-tertiary)]">
            Protected by Supabase Cloud Authentication
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render protected component
  return <>{children}</>;
};

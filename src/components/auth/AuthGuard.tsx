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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // While checking Supabase session or if unauthenticated (during redirect)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-screen h-screen bg-[#F7F8FA] dark:bg-[#09090B] text-[#111827] dark:text-[#FAFAFA] flex flex-col items-center justify-center font-sans select-none relative overflow-hidden">
        <div className="z-10 flex flex-col items-center max-w-sm text-center p-8 bg-white dark:bg-[#111318] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#F7F8FA] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6] shadow-xs relative">
            <Shield className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#2563EB] animate-ping" />
          </div>

          <div className="space-y-1.5">
            <div className="text-[14px] font-semibold text-[#111827] dark:text-[#FAFAFA]">
              CivicShield Security Gateway
            </div>
            <div className="text-[13px] text-[#475569] dark:text-[#A1A1AA] leading-relaxed" suppressHydrationWarning>
              {!isAuthenticated && !isLoading
                ? "Access denied. Redirecting to operator sign in..."
                : "Verifying operator credentials & security clearance..."}
            </div>
          </div>

          <div className="w-48 h-1.5 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden">
            <div className="h-full bg-[#2563EB] dark:bg-[#3B82F6] rounded-full animate-pulse w-3/4" />
          </div>

          <div className="text-[12px] text-[#94A3B8] dark:text-[#71717A]">
            Protected by Supabase Cloud Authentication
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render protected component
  return <>{children}</>;
};

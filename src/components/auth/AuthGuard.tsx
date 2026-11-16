import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Shield, Radio } from "lucide-react";

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
      <div className="w-screen h-screen bg-[#0e1216] text-[#e5e9ec] flex flex-col items-center justify-center font-mono select-none relative overflow-hidden">
        {/* Subtle cyber background grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#9BAA76 1px, transparent 1px), linear-gradient(90deg, #9BAA76 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="z-10 flex flex-col items-center max-w-sm text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#14191d] border border-[#303941] flex items-center justify-center text-[#9BAA76] shadow-xl relative">
            <Shield className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-bold tracking-widest text-[#f1f4f6] uppercase">
              CIVICSHIELD // SECURITY GATEWAY
            </div>
            <div className="text-[11px] text-[#8a96a1]">
              {!isAuthenticated && !isLoading
                ? "Access denied. Redirecting to authentication terminal..."
                : "Verifying terminal authorization & cryptographic session..."}
            </div>
          </div>

          <div className="w-48 h-1 bg-[#1e272f] rounded-full overflow-hidden">
            <div className="h-full bg-[#9BAA76] rounded-full animate-pulse w-3/4" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#63727d]">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Supabase Cloud [trrggaiakntmikkbazbd]</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render protected component
  return <>{children}</>;
};

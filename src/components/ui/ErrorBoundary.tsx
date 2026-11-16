import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CIVICSHIELD] ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[320px] bg-[#0c1015] border border-red-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 text-slate-200">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white tracking-wide">
              {this.props.fallbackTitle || "Simulation Viewport Error"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {this.props.fallbackMessage ||
                "A graphics or initialization error occurred while rendering the 3D scene. This may be due to WebGL hardware support or network connectivity."}
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-red-300/80 bg-red-950/40 p-2 rounded border border-red-900/40 truncate max-w-sm mx-auto">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Viewport</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

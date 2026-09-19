import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as unknown as {
  new (props: Props): {
    props: Props;
    state: State;
    setState(state: Partial<State> | ((prevState: State) => Partial<State>)): void;
    render(): React.ReactNode;
  };
}) {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-6 bg-slate-900/90 rounded-2xl border border-rose-500/40 shadow-2xl text-slate-100 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {this.props.fallbackTitle || 'Component Render Interrupted'}
              </h3>
              <p className="text-xs text-slate-400">
                A localized runtime error occurred in this view.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
            {this.state.error?.message || 'Unknown error'}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset & Reload View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-stone-50 px-6 py-16 text-stone-900">
          <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="mb-4 text-2xl font-bold text-red-700">La aplicacion ha fallado al renderizar</h1>
            <p className="mb-4 text-stone-700">
              Ya no deberias ver una pantalla en blanco. El error real esta abajo.
            </p>
            <pre className="overflow-x-auto rounded bg-stone-100 p-4 text-sm text-stone-800 whitespace-pre-wrap">
              {this.state.error.stack || this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

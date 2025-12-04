import { Component, type ErrorInfo, type ReactNode } from "react";
import { DefaultFallback } from "./ErrorBoundaryFallback";

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render(): ReactNode {
    const { fallback, children, className } = this.props;
    const content = this.state.hasError
      ? fallback ?? <DefaultFallback />
      : children;

    if (!className) {
      return content;
    }

    return <div className={className}>{content}</div>;
  }
}

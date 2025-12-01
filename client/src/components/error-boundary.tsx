import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Что-то пошло не так
              </h2>
              <p className="text-muted-foreground">
                Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться назад.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left bg-muted/50 p-4 rounded-lg text-sm">
                <summary className="cursor-pointer font-medium text-destructive mb-2">
                  Подробности ошибки
                </summary>
                <pre className="overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="border-primary/20"
              >
                Попробовать снова
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-primary hover:bg-primary/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить страницу
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

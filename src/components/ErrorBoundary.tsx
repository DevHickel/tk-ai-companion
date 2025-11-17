import { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * Error Boundary para capturar erros não tratados em componentes React
 * Previne white screen of death e fornece UI amigável de erro
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: error.message 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Em produção, aqui você enviaria para um serviço de logging (Sentry, LogRocket, etc.)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Ops! Algo deu errado
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-3">
                <p>
                  Ocorreu um erro inesperado. Não se preocupe, seus dados estão seguros.
                </p>
                
                {import.meta.env.DEV && this.state.errorInfo && (
                  <details className="text-xs bg-destructive/10 p-2 rounded">
                    <summary className="cursor-pointer font-medium">
                      Detalhes técnicos (dev)
                    </summary>
                    <pre className="mt-2 overflow-auto">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recarregar
                  </Button>
                  <Button 
                    onClick={this.handleGoHome}
                    size="sm"
                    className="flex-1"
                  >
                    Ir para Início
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught runtime error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-red-100">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle className="w-8 h-8 flex-shrink-0" />
                            <h1 className="text-xl font-bold">Ops! Algo deu errado.</h1>
                        </div>
                        <p className="text-slate-600 mb-4 text-sm">
                            Infelizmente, ocorreu um erro inesperado ao carregar esta tela.
                            Por favor, tente atualizar a p\u00e1gina.
                        </p>
                        {this.state.error && (
                            <div className="bg-red-50 p-3 rounded-md mb-6 overflow-auto max-h-32 text-xs font-mono text-red-800 border border-red-100">
                                {this.state.error.message}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <Button onClick={() => window.location.reload()} className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Atualizar Página
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

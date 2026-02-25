import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    fontFamily: 'system-ui, sans-serif',
                    background: '#f8fafc'
                }}>
                    <div style={{
                        maxWidth: '480px',
                        textAlign: 'center',
                        padding: '2rem',
                        borderRadius: '1rem',
                        background: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                            Iets het verkeerd gegaan
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Daar was 'n onverwagte fout. Herlaai asseblief die bladsy om voort te gaan.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '0.5rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            Herlaai Bladsy
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

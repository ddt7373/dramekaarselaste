import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          fontFamily: 'system-ui, sans-serif',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb'
        }}>
          <h1 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: '#111827' }}>
            Iets het verkeerd geloop
          </h1>
          <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Laai die bladsy weer (F5 of ververs). As die fout aanhou, probeer uitlog en weer inlog of kontak ondersteuning.
          </p>
          <details style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer' }}>Tegniese besonderhede</summary>
            <pre style={{ marginTop: '0.5rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {this.state.error.message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/home';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <p className="text-2xl font-bold text-white">Algo salió mal</p>
        <p className="text-[#64748b] mt-2 max-w-sm">
          Ocurrió un error inesperado. Por favor recarga la página.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="mt-4 text-left text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3 max-w-lg overflow-auto">
            {this.state.error.toString()}
          </pre>
        )}
        <button
          onClick={this.handleReset}
          className="mt-8 px-6 py-3 bg-[#00e676] text-[#0a0a0f] font-bold rounded-xl hover:bg-[#00c853] transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }
}

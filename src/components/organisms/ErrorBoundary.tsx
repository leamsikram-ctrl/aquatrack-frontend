import { Component, type ErrorInfo, type ReactNode } from 'react';
import { EmptyState } from '../molecules/EmptyState';
import { ErrorOfflineIllustration } from '../illustrations';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
          <EmptyState
            illustration={<ErrorOfflineIllustration />}
            title="Something went wrong"
            description="An unexpected error occurred while loading this view."
            actionLabel="Try again"
            onAction={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}


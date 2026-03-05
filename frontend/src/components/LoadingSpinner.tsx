interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="spinner" />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
}

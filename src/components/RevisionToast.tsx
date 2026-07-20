import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, RefreshCw, BookOpen, X } from 'lucide-react';

type ToastVariant = 'easy' | 'medium' | 'hard' | 'memorisation';

interface RevisionToastProps {
  title: string;
  subtitle: string;
  variant: ToastVariant;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const config: Record<ToastVariant, { icon: React.ReactNode; color: string }> = {
  easy: {
    icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    color: 'text-emerald-700',
  },
  medium: {
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    color: 'text-amber-700',
  },
  hard: {
    icon: <RefreshCw className="w-4 h-4 text-red-500" />,
    color: 'text-red-700',
  },
  memorisation: {
    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
    color: 'text-emerald-700',
  },
};

const RevisionToast = ({ title, subtitle, variant, onDismiss, actionLabel, onAction }: RevisionToastProps) => {
  const [visible, setVisible] = useState(false);
  const { icon, color } = config[variant];

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss (leave longer when there is an action to consider)
    const hideTimer = setTimeout(handleDismiss, actionLabel ? 5000 : 3000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [handleDismiss, actionLabel]);

  return (
    <div
      className="flex items-center gap-3 bg-white rounded-xl shadow-lg px-4 py-3 min-w-0 max-w-[340px] border border-gray-100"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-16px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      }}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate block">{title}</span>
        <span className={`text-xs font-medium ${color}`}>{subtitle}</span>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={() => { onAction(); handleDismiss(); }}
          className="flex-shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors ml-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RevisionToast;

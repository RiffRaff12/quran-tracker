import { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, BookOpen } from 'lucide-react';

interface SpeedDialProps {
  onLogRevision: () => void;
  onAddMemorisation: () => void;
}

const SpeedDial = ({ onLogRevision, onAddMemorisation }: SpeedDialProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const actions = [
    {
      label: 'Add Memorisation',
      icon: BookOpen,
      onClick: () => { setOpen(false); onAddMemorisation(); },
    },
    {
      label: 'Log Revision',
      icon: CheckSquare,
      onClick: () => { setOpen(false); onLogRevision(); },
    },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[100] right-4 flex flex-col items-end gap-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
    >
      {/* Speed dial options */}
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <div
            key={action.label}
            className="flex items-center gap-3 transition-all duration-200"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
              transitionDelay: open ? `${i * 60}ms` : '0ms',
              pointerEvents: open ? 'auto' : 'none',
            }}
          >
            <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
              {action.label}
            </span>
            <button
              onClick={action.onClick}
              className="h-11 w-11 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Icon className="w-5 h-5" />
            </button>
          </div>
        );
      })}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-colors focus:outline-none"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <Plus
          className="w-6 h-6 transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        />
      </button>
    </div>
  );
};

export default SpeedDial;

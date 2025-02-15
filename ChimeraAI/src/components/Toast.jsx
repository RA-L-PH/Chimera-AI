import { useEffect } from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const VARIANTS = {
  success: {
    icon: FaCheckCircle,
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600'
  },
  error: {
    icon: FaExclamationCircle,
    bgColor: 'bg-red-500',
    borderColor: 'border-red-600'
  },
  info: {
    icon: FaInfoCircle,
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-600'
  }
};

const Toast = ({
  message,
  variant = 'info',
  duration = 4000,
  onDismiss
}) => {
  const Icon = VARIANTS[variant].icon;

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className={`
      fixed bottom-4 right-4 max-w-sm
      flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
      border-l-4 ${VARIANTS[variant].borderColor}
      ${VARIANTS[variant].bgColor} text-white
      transform transition-all duration-300 ease-in-out
      animate-slide-up
    `}>
      <Icon className="flex-shrink-0" />
      <p className="flex-grow text-sm">{message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 ml-2 hover:opacity-75 transition-opacity"
        aria-label="Dismiss notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
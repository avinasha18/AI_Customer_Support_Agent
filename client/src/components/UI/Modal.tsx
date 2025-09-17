import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCloseButton?: boolean;
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'info',
  showCloseButton = true 
}: ModalProps) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-error',
          borderColor: 'border-red-200 dark:border-red-700'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-warning',
          borderColor: 'border-yellow-200 dark:border-yellow-700'
        };
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-success',
          borderColor: 'border-green-200 dark:border-green-700'
        };
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-accent-primary',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`
              w-full max-w-md modal-professional rounded-xl shadow-xl
              border ${typeStyles.borderColor}
              max-h-[90vh] overflow-hidden
            `}>
              {/* Header */}
              <div className="flex items-center gap-3 p-6 pb-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${typeStyles.iconBg}
                `}>
                  <span className="text-lg">{typeStyles.icon}</span>
                </div>
                <div className="flex-1">
                  <h2 className="professional-heading text-lg text-primary">
                    {title}
                  </h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-hover rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-tertiary" />
                  </button>
                )}
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;

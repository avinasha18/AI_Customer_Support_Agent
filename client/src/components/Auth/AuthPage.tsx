import { useState } from 'react';
import { motion } from 'framer-motion';
import Login from './Login';
import Signup from './Signup';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../Toast';

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  const handleSuccess = () => {
    addToast(
      isLoginMode ? 'Welcome back! Redirecting...' : 'Account created successfully!', 
      'success'
    );
  };

  const handleError = (message: string) => {
    addToast(message, 'error');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Support Chat</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Intelligent customer support powered by AI
          </motion.p>
        </div>

        {isLoginMode ? (
          <Login 
            onToggleMode={handleToggleMode} 
            onSuccess={handleSuccess}
            onError={handleError}
          />
        ) : (
          <Signup 
            onToggleMode={handleToggleMode}
            onSuccess={handleSuccess} 
            onError={handleError}
          />
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Development Environment
          </div>
        </motion.div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AuthPage;
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Info, Shield } from 'lucide-react';
import { ApiPasswordManager } from '@/lib/utils/password-manager';
import { cn } from '@/lib/utils';

interface PasswordPromptPageProps {
  onSuccess: () => void;
}

export function PasswordPromptPage({ onSuccess }: PasswordPromptPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const pwd = password.trim();
    if (!pwd) {
      setError('Please enter the API password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Add password validation against backend
      ApiPasswordManager.setPassword(pwd);
      onSuccess();
    } catch (error) {
      setError('Failed to save password. Please try again.');
      console.error('Password save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Lock className="w-3 h-3 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title and Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Secure Access Required
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Please enter your Roommate API password to continue and start chatting.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="API Password"
                className={cn(
                  'w-full pl-10 pr-4 py-4 border-2 rounded-xl bg-white/80 backdrop-blur-sm transition-colors duration-200',
                  'placeholder:text-gray-400 text-gray-900',
                  'focus:outline-none focus:border-blue-500 focus:bg-white',
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                disabled={isLoading}
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 text-sm text-red-600 font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !password.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200',
              'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
              'shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-3'
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Chat</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              Your password is stored securely in your browser&apos;s local storage and never transmitted to external servers.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
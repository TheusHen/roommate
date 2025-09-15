'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ThumbsUp, ThumbsDown, User, Mic, Loader2, Brain, TestTube, ExternalLink } from 'lucide-react';
import { ChatMessage, FeedbackData } from '@/lib/types';
import { ChatApi } from '@/lib/api/chat';
import { Grabber } from '@/lib/api/grabber';
import { cn, formatTimestamp } from '@/lib/utils';
import { MessageRenderer } from '@/components/message-renderer';
import { ApiPasswordManager } from '@/lib/utils/password-manager';

interface EnhancedChatPageProps {
  onVoiceChatOpen: () => void;
}

export function EnhancedChatPage({ onVoiceChatOpen }: EnhancedChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, 'positive' | 'negative'>>({});
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  const [testMode, setTestMode] = useState<{ active: boolean; remaining_requests: number; message: string } | null>(null);
  const [showTestLimitModal, setShowTestLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is in test mode
  useEffect(() => {
    const password = ApiPasswordManager.getPassword();
    if (password === 'TEST_MODE') {
      setTestMode({ active: true, remaining_requests: 3, message: 'You have 3 test messages remaining.' });
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: ChatMessage = {
      text: trimmedInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsProcessingContext(true);

    try {
      // Use Grabber to enrich the prompt with user context
      const defaultUserId = 'default-user'; // In a real app, this would come from authentication
      const enrichedPrompt = await Grabber.enrichPrompt(defaultUserId, trimmedInput);
      
      setIsProcessingContext(false);
      
      // Format input for the Roommate assistant
      const formattedPrompt = `Said: ${enrichedPrompt}`;
      const apiResponse = await ChatApi.sendMessage(formattedPrompt);
      
      // Update test mode status if present
      if (apiResponse.testMode) {
        setTestMode(apiResponse.testMode);
      }
      
      const roommateMessage: ChatMessage = {
        text: apiResponse.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, roommateMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsProcessingContext(false);
      
      // Check if it's a test mode limit error
      if (error instanceof Error && error.message.includes('Test mode limit reached')) {
        try {
          const errorData = JSON.parse(error.message);
          setShowTestLimitModal(true);
          const errorMessage: ChatMessage = {
            text: errorData.message + '\n\n' + errorData.setup_instructions,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        } catch {
          // Fallback error handling
          const errorMessage: ChatMessage = {
            text: 'Test mode limit reached. Please set up your own server to continue.',
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const errorMessage: ChatMessage = {
          text: 'Sorry, something went wrong. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'positive' | 'negative') => {
    if (feedbacks[messageIndex]) return; // Already provided feedback

    const message = messages[messageIndex];
    const prevUserMessage = messageIndex > 0 ? messages[messageIndex - 1] : null;

    setFeedbacks(prev => ({ ...prev, [messageIndex]: feedbackType }));

    if (prevUserMessage?.isUser) {
      try {
        const feedbackData: FeedbackData = {
          prompt: prevUserMessage.text,
          response: message.text,
          feedback: feedbackType,
          ideal: null,
        };
        await ChatApi.sendFeedback(feedbackData);
      } catch (error) {
        console.error('Error sending feedback:', error);
      }
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const feedback = feedbacks[index];
    const isRoommate = !message.isUser;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="group"
      >
        <div className={cn(
          'flex gap-3 mb-4',
          message.isUser ? 'justify-end' : 'justify-start'
        )}>
          {isRoommate && (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div className={cn(
            'max-w-sm lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-sm',
            message.isUser 
              ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md' 
              : 'bg-white border border-purple-200 text-gray-900 rounded-bl-md'
          )}>
            <MessageRenderer 
              content={message.text} 
              className={message.isUser ? 'text-white prose-invert' : 'text-gray-900'}
            />
            {message.timestamp && (
              <p className={cn(
                'text-xs mt-2 opacity-70',
                message.isUser ? 'text-purple-100' : 'text-gray-500'
              )}>
                {formatTimestamp(message.timestamp)}
              </p>
            )}
          </div>

          {message.isUser && (
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Feedback buttons for roommate messages */}
        {isRoommate && (
          <div className="flex gap-2 ml-11 mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleFeedback(index, 'positive')}
              disabled={!!feedback}
              className={cn(
                'p-2 rounded-lg transition-colors text-xs flex items-center gap-1',
                feedback === 'positive' 
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
              )}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Helpful</span>
            </button>
            <button
              onClick={() => handleFeedback(index, 'negative')}
              disabled={!!feedback}
              className={cn(
                'p-2 rounded-lg transition-colors text-xs flex items-center gap-1',
                feedback === 'negative' 
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
              )}
            >
              <ThumbsDown className="w-3 h-3" />
              <span>Needs work</span>
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Roommate Memory</h1>
              <p className="text-sm text-purple-600">with context awareness</p>
            </div>
          </div>
          <button
            onClick={onVoiceChatOpen}
            className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => renderMessage(message, index))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-purple-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {isProcessingContext ? 'Processing with enhanced context...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-purple-200 p-4">
        {/* Test Mode Status */}
        {testMode?.active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-4"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Test Mode Active</span>
                <span className="text-sm text-green-600">
                  {testMode.remaining_requests} {testMode.remaining_requests === 1 ? 'message' : 'messages'} remaining
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything (I'll remember our conversation)"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Test Limit Modal */}
      <AnimatePresence>
        {showTestLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTestLimitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md mx-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TestTube className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Test Limit Reached</h3>
                <p className="text-gray-600 mb-6">
                  You've used all 3 free test messages. To continue using Roommate, set up your own server.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTestLimitModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href="https://github.com/TheusHen/roommate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Setup Guide
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
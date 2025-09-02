'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ThumbsUp, ThumbsDown, User, Mic, Loader2, Brain } from 'lucide-react';
import { ChatMessage, FeedbackData } from '@/lib/types';
import { ChatApi } from '@/lib/api/chat';
import { Grabber } from '@/lib/api/grabber';
import { cn, formatTimestamp } from '@/lib/utils';

interface EnhancedChatPageProps {
  onVoiceChatOpen: () => void;
}

export function EnhancedChatPage({ onVoiceChatOpen }: EnhancedChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, 'positive' | 'negative'>>({});
  const [isProcessingContext, setIsProcessingContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      const response = await ChatApi.sendMessage(enrichedPrompt);
      const roommateMessage: ChatMessage = {
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, roommateMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsProcessingContext(false);
      const errorMessage: ChatMessage = {
        text: 'Sorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
            <p className="text-sm leading-relaxed">{message.text}</p>
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
              <h1 className="text-lg font-semibold text-gray-900">Enhanced Chat</h1>
              <p className="text-sm text-purple-600">with memory & context</p>
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
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message... (I'll remember our conversation)"
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
    </div>
  );
}
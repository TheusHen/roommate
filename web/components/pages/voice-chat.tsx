'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, ThumbsUp, ThumbsDown, User, Languages, ArrowLeft } from 'lucide-react';
import { VoiceMessage, Locale, LocaleOption, FeedbackData } from '@/lib/types';
import { ChatApi } from '@/lib/api/chat';
import { cn, formatTimestamp } from '@/lib/utils';
import { MessageRenderer } from '@/components/message-renderer';

interface VoiceChatPageProps {
  onBack: () => void;
}

const localeOptions: LocaleOption[] = [
  { label: 'English', value: 'en-US' },
  { label: 'Português', value: 'pt-BR' },
];

export function VoiceChatPage({ onBack }: VoiceChatPageProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en-US');
  const [feedbacks, setFeedbacks] = useState<Record<number, 'positive' | 'negative'>>({});
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Remove LaTeX blocks for speech
    const textWithoutLatex = text.replace(/<latex>[\s\S]*?<\/latex>/g, '');

    const utterance = new SpeechSynthesisUtterance(textWithoutLatex);
    utterance.lang = selectedLocale;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    synthRef.current.speak(utterance);
  }, [selectedLocale]);

  const handleVoiceInput = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsListening(false);
    setIsLoading(true);
    setCurrentText('');

    try {
      // Format input for the Roommate assistant
      const formattedPrompt = `Said: ${transcript}`;
      const response = await ChatApi.sendMessage(formattedPrompt);
      const voiceMessage: VoiceMessage = {
        userPrompt: transcript,
        roommateResponse: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, voiceMessage]);
      
      // Speak the response
      speak(response);
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage: VoiceMessage = {
        userPrompt: transcript,
        roommateResponse: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [speak]);

  useEffect(() => {
    // Check if speech recognition is supported
    const windowAny = window as unknown as { 
      SpeechRecognition?: SpeechRecognitionConstructor; 
      webkitSpeechRecognition?: SpeechRecognitionConstructor 
    };
    const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLocale;

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentText('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentText(finalTranscript || interimTranscript);

        if (finalTranscript) {
          handleVoiceInput(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setCurrentText('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [selectedLocale, handleVoiceInput]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = selectedLocale;
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleFeedback = async (messageIndex: number, feedbackType: 'positive' | 'negative') => {
    if (feedbacks[messageIndex]) return;

    const message = messages[messageIndex];
    setFeedbacks(prev => ({ ...prev, [messageIndex]: feedbackType }));

    try {
      const feedbackData: FeedbackData = {
        prompt: message.userPrompt,
        response: message.roommateResponse,
        feedback: feedbackType,
        ideal: null,
      };
      await ChatApi.sendFeedback(feedbackData);
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const renderMessage = (message: VoiceMessage, index: number) => {
    const feedback = feedbacks[index];

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="mb-6 space-y-3"
      >
        {/* User Message */}
        <div className="flex justify-end gap-3">
          <div className="max-w-sm lg:max-w-md bg-gradient-to-br from-purple-600 to-purple-700 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm">
            <MessageRenderer 
              content={message.userPrompt} 
              className="text-white prose-invert"
            />
            <p className="text-xs mt-2 text-purple-100 opacity-70">
              {formatTimestamp(message.timestamp)}
            </p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Roommate Response */}
        <div className="flex gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="max-w-sm lg:max-w-md bg-white border border-purple-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <MessageRenderer 
                content={message.roommateResponse} 
                className="text-gray-900"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 opacity-70">
                  {formatTimestamp(message.timestamp)}
                </p>
                <button
                  onClick={() => speak(message.roommateResponse)}
                  className="p-1 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Feedback buttons */}
            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </div>
        </div>
      </motion.div>
    );
  };

  if (!speechSupported) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MicOff className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Speech Recognition Not Supported</h2>
          <p className="text-gray-600 mb-4">
            Your browser doesn&apos;t support speech recognition. Please try using a modern browser like Chrome or Edge.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Roommate Voice</h1>
              <p className="text-sm text-purple-600">Just speak naturally</p>
            </div>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-lg">
            <Languages className="w-4 h-4 text-purple-600" />
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value as Locale)}
              className="bg-transparent text-purple-700 text-sm font-medium focus:outline-none"
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => renderMessage(message, index))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Controls */}
      <div className="bg-white border-t border-purple-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-4">
            {/* Current text display */}
            {(isListening || currentText) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 min-h-[3rem] flex items-center justify-center w-full"
              >
                <p className="text-purple-700 text-center">
                  {currentText || (isListening ? 'Listening...' : '')}
                </p>
              </motion.div>
            )}

            {/* Microphone button */}
            <motion.button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </motion.button>

            <p className="text-sm text-gray-600 text-center">
              {isListening ? 'Tap to stop recording' : 'Tap to start talking'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
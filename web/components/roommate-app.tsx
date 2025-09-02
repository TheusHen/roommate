'use client';

import { useState, useEffect } from 'react';
import { ApiPasswordManager } from '@/lib/utils/password-manager';
import { PasswordPromptPage } from '@/components/pages/password-prompt';
import { ChatPage } from '@/components/pages/chat';
import { EnhancedChatPage } from '@/components/pages/enhanced-chat';
import { VoiceChatPage } from '@/components/pages/voice-chat';

type Page = 'password' | 'chat' | 'enhanced-chat' | 'voice-chat';

export function RoommateApp() {
  const [currentPage, setCurrentPage] = useState<Page>('password');
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);

  useEffect(() => {
    // Check if password exists on mount
    const checkPassword = () => {
      if (ApiPasswordManager.hasPassword()) {
        setCurrentPage('enhanced-chat'); // Start with enhanced chat by default
      } else {
        setCurrentPage('password');
      }
      setIsCheckingPassword(false);
    };

    checkPassword();
  }, []);

  const handlePasswordSuccess = () => {
    setCurrentPage('enhanced-chat');
  };

  const handleVoiceChatOpen = () => {
    setCurrentPage('voice-chat');
  };

  const handleBackToChat = () => {
    setCurrentPage('enhanced-chat');
  };

  // Show loading while checking password
  if (isCheckingPassword) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render current page
  switch (currentPage) {
    case 'password':
      return <PasswordPromptPage onSuccess={handlePasswordSuccess} />;
    
    case 'chat':
      return <ChatPage onVoiceChatOpen={handleVoiceChatOpen} />;
    
    case 'enhanced-chat':
      return <EnhancedChatPage onVoiceChatOpen={handleVoiceChatOpen} />;
    
    case 'voice-chat':
      return <VoiceChatPage onBack={handleBackToChat} />;
    
    default:
      return <PasswordPromptPage onSuccess={handlePasswordSuccess} />;
  }
}
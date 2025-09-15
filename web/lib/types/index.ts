export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp?: Date;
}

export interface VoiceMessage {
  userPrompt: string;
  roommateResponse: string;
  timestamp: Date;
}

export interface UserMemory {
  type: string;
  key: string;
  value: string;
  timestamp: string;
  userId: string;
}

export interface ApiResponse {
  result?: {
    message?: {
      content?: string;
    };
    response?: string;
  };
  error?: string;
  test_mode?: {
    active: boolean;
    remaining_requests: number;
    message: string;
  };
}

export interface FeedbackData {
  prompt: string;
  response: string;
  feedback: 'positive' | 'negative';
  ideal?: string | null;
}

export type Locale = 'en-US' | 'pt-BR';

export interface LocaleOption {
  label: string;
  value: Locale;
}
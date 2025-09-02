import { ApiResponse, FeedbackData } from '../types';
import { ApiPasswordManager } from '../utils/password-manager';

const API_BASE_URL = 'http://localhost:3000';
const CHAT_URL = `${API_BASE_URL}/chat`;
const FEEDBACK_URL = `${API_BASE_URL}/feedback`;

export class ChatApi {
  static async sendMessage(prompt: string): Promise<string> {
    const apiPassword = ApiPasswordManager.getPassword();
    
    if (!apiPassword) {
      throw new Error('API password not found');
    }

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiPassword}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    // Extract response text from the API response structure
    let roommateResponse = '';
    if (data.result?.message?.content) {
      roommateResponse = data.result.message.content;
    } else if (data.result?.response) {
      roommateResponse = data.result.response;
    } else if (data.result) {
      roommateResponse = data.result.toString();
    } else {
      roommateResponse = 'Sorry, I couldn\'t process your request.';
    }

    return roommateResponse;
  }

  static async sendFeedback(feedbackData: FeedbackData): Promise<void> {
    const apiPassword = ApiPasswordManager.getPassword();
    
    if (!apiPassword) {
      throw new Error('API password not found');
    }

    const response = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiPassword}`,
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error(`Failed to send feedback: ${response.status}`);
    }
  }
}
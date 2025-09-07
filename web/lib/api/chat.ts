import { ApiResponse, FeedbackData } from '../types';
import { ApiPasswordManager } from '../utils/password-manager';

const API_BASE_URL = 'https://roommate.theushen.me';
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
      body: JSON.stringify({ 
        prompt,
        systemPrompt: `You are Roommate, a personal assistant and study companion who acts like a helpful roommate.
Your role is to maintain natural, warm conversations while providing academic support and helping with various tasks, including calculations, explanations, and study assistance.

Main behavior rules:
1. Always reply in a clear, friendly, and engaging way, like a close friend who's also academically knowledgeable.
2. Automatically adapt to the user's language (if they write in Portuguese, answer in Portuguese; if they switch to English, continue in English).
3. Perform mathematical calculations when requested, showing your work and explaining the steps.
4. Provide comprehensive academic explanations for any subject with examples when helpful.
5. Format responses using Markdown for readability and structure when appropriate.
6. When using LaTeX formulas, first provide the complete explanation in plain text, then include the LaTeX formulas separately below, wrapped in <latex> tags.
7. If the user writes something like "Said: <message>", interpret that as the main input and respond directly.
8. Maintain continuity by remembering the previous context whenever possible.
9. Don't limit yourself - act as a true study partner who can help with any academic or practical question.`
      }),
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
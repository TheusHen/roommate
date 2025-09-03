import { UserMemory } from '../types';
import { ApiPasswordManager } from '../utils/password-manager';

const API_BASE_URL = 'https://roommate.theushen.me';

export class Grabber {
  /**
   * Enriches a prompt with relevant user information from the database
   */
  static async enrichPrompt(userId: string, prompt: string): Promise<string> {
    try {
      // First, save any new information from the prompt
      await this.saveMemoryFromPrompt(userId, prompt);
      
      // Then, get relevant memories to enrich the prompt
      const memories = await this.getRelevantMemories(userId, prompt);
      
      if (memories.length === 0) {
        return prompt;
      }
      
      // Build context from memories
      const context = this.buildContextFromMemories(memories);
      
      // Enrich the prompt with context
      return this.enrichPromptWithContext(prompt, context);
      
    } catch (error) {
      console.error('Error enriching prompt:', error);
      return prompt; // Return original prompt if enrichment fails
    }
  }

  private static async saveMemoryFromPrompt(userId: string, prompt: string): Promise<void> {
    try {
      const apiPassword = ApiPasswordManager.getPassword();
      if (!apiPassword) return;

      const response = await fetch(`${API_BASE_URL}/memory/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiPassword}`,
        },
        body: JSON.stringify({
          userId,
          sentence: prompt,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save memory:', response.status);
      }
    } catch (error) {
      console.error('Error saving memory:', error);
      // Don't throw - saving memory is optional
    }
  }

  private static async getRelevantMemories(userId: string, prompt: string): Promise<UserMemory[]> {
    try {
      const apiPassword = ApiPasswordManager.getPassword();
      if (!apiPassword) return [];

      const response = await fetch(`${API_BASE_URL}/memory/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiPassword}`,
        },
        body: JSON.stringify({
          userId,
          prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const memoriesJson: unknown[] = data.memories || [];
        return memoriesJson.map((json: unknown) => {
          const obj = json as Record<string, unknown>;
          return {
            type: (obj.type as string) || '',
            key: (obj.key as string) || '',
            value: (obj.value as string) || '',
            timestamp: (obj.timestamp as string) || '',
            userId: (obj.userId as string) || '',
          };
        });
      } else {
        console.error('Failed to get memories:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error getting memories:', error);
      return [];
    }
  }

  private static buildContextFromMemories(memories: UserMemory[]): string {
    const contextParts: string[] = [];
    
    for (const memory of memories) {
      switch (memory.type) {
        case 'pet':
          if (memory.key.endsWith('_name')) {
            const petType = memory.key.replace('_name', '');
            contextParts.push(`Your ${petType}'s name is ${memory.value}`);
          }
          break;
        case 'personal':
          if (memory.key === 'name') {
            contextParts.push(`Your name is ${memory.value}`);
          }
          break;
        case 'location':
          if (memory.key === 'home_location') {
            contextParts.push(`You live in ${memory.value}`);
          }
          break;
        case 'work':
          if (memory.key === 'company') {
            contextParts.push(`You work at ${memory.value}`);
          }
          break;
        case 'preference':
          if (memory.key === 'likes') {
            contextParts.push(`You like ${memory.value}`);
          }
          break;
      }
    }
    
    return contextParts.join('. ');
  }

  private static enrichPromptWithContext(prompt: string, context: string): string {
    if (!context) {
      return prompt;
    }
    
    // Check if the prompt is asking about stored information
    const lowerPrompt = prompt.toLowerCase();
    
    // Direct answer for specific questions
    if (this.isDirectQuestion(lowerPrompt)) {
      return this.getDirectAnswer(lowerPrompt, context);
    }
    
    // Otherwise, add context to help the AI respond better
    return `Context about the user: ${context}.\n\nUser says: ${prompt}`;
  }

  private static isDirectQuestion(lowerPrompt: string): boolean {
    const questionPatterns = [
      'what is my',
      'what\'s my',
      'who is my',
      'where do i live',
      'where do i work',
      'what do i like',
    ];
    
    return questionPatterns.some((pattern) => lowerPrompt.includes(pattern));
  }

  private static getDirectAnswer(lowerPrompt: string, context: string): string {
    if (lowerPrompt.includes('dog') && lowerPrompt.includes('name')) {
      const dogNameMatch = context.match(/your dog's name is (\w+)/i);
      if (dogNameMatch) {
        return `Your dog's name is ${dogNameMatch[1]}.`;
      }
    }
    
    if (lowerPrompt.includes('cat') && lowerPrompt.includes('name')) {
      const catNameMatch = context.match(/your cat's name is (\w+)/i);
      if (catNameMatch) {
        return `Your cat's name is ${catNameMatch[1]}.`;
      }
    }
    
    if (lowerPrompt.includes('name') && !lowerPrompt.includes('dog') && !lowerPrompt.includes('cat')) {
      const nameMatch = context.match(/your name is (\w+)/i);
      if (nameMatch) {
        return `Your name is ${nameMatch[1]}.`;
      }
    }
    
    if (lowerPrompt.includes('live') || lowerPrompt.includes('from')) {
      const locationMatch = context.match(/you live in ([^.]+)/i);
      if (locationMatch) {
        return `You live in ${locationMatch[1]}.`;
      }
    }
    
    if (lowerPrompt.includes('work')) {
      const workMatch = context.match(/you work at ([^.]+)/i);
      if (workMatch) {
        return `You work at ${workMatch[1]}.`;
      }
    }
    
    if (lowerPrompt.includes('like') || lowerPrompt.includes('prefer')) {
      const likeMatch = context.match(/you like ([^.]+)/i);
      if (likeMatch) {
        return `You like ${likeMatch[1]}.`;
      }
    }
    
    // If no specific pattern matches, add context to prompt
    return `Context: ${context}.\n\nUser asks: ${lowerPrompt}`;
  }
}

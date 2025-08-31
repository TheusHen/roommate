import { MongoClient, Db, Collection } from 'mongodb';

/**
 * Interface representing a user memory entry
 */
export interface UserMemory {
  type: string;
  key: string;
  value: string;
  timestamp: string;
  userId: string;
}

/**
 * MongoDB Handler for managing user memories
 */
export class MongoDBHandler {
  private client: MongoClient;
  private db: Db | null = null;
  private memoriesCollection: Collection<UserMemory> | null = null;

  constructor(mongoUri: string = process.env.MONGO_URI || "mongodb://localhost:27017") {
    this.client = new MongoClient(mongoUri);
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db("roommate");
      this.memoriesCollection = this.db.collection<UserMemory>("memories");
      console.log("[MongoDB] Connected successfully");
    } catch (error) {
      console.error("[MongoDB] Connection failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log("[MongoDB] Disconnected successfully");
    } catch (error) {
      console.error("[MongoDB] Disconnect failed:", error);
      throw error;
    }
  }

  /**
   * Save memory from a sentence by extracting information
   */
  async saveMemory(userId: string, sentence: string): Promise<void> {
    if (!this.memoriesCollection) {
      throw new Error("MongoDB not connected. Call connect() first.");
    }

    try {
      const extractedMemories = this.extractMemoriesFromSentence(sentence);
      
      for (const memory of extractedMemories) {
        const userMemory: UserMemory = {
          ...memory,
          userId,
          timestamp: new Date().toISOString()
        };

        // Update existing or insert new memory
        await this.memoriesCollection.replaceOne(
          { userId, type: memory.type, key: memory.key },
          userMemory,
          { upsert: true }
        );
      }

      console.log(`[MongoDB] Saved ${extractedMemories.length} memories for user ${userId}`);
    } catch (error) {
      console.error("[MongoDB] Save memory failed:", error);
      throw error;
    }
  }

  /**
   * Get relevant memories for a user based on a prompt
   */
  async getRelevantMemory(userId: string, prompt: string): Promise<UserMemory[]> {
    if (!this.memoriesCollection) {
      throw new Error("MongoDB not connected. Call connect() first.");
    }

    try {
      const keywords = this.extractKeywordsFromPrompt(prompt);
      
      // Search for memories that match keywords or types
      const query = {
        userId,
        $or: [
          { key: { $in: keywords } },
          { value: { $regex: keywords.join('|'), $options: 'i' } },
          { type: { $in: this.guessTypesFromPrompt(prompt) } }
        ]
      };

      const memories = await this.memoriesCollection.find(query).toArray();
      console.log(`[MongoDB] Found ${memories.length} relevant memories for user ${userId}`);
      
      return memories;
    } catch (error) {
      console.error("[MongoDB] Get relevant memory failed:", error);
      throw error;
    }
  }

  /**
   * Extract memories from a sentence using simple pattern matching
   */
  private extractMemoriesFromSentence(sentence: string): Omit<UserMemory, 'userId' | 'timestamp'>[] {
    const memories: Omit<UserMemory, 'userId' | 'timestamp'>[] = [];
    const lowerSentence = sentence.toLowerCase();

    // Pattern: "my [pet type]'s name is [name]"
    const petNameRegex = /my\s+(\w+)(?:'s|\s+is|\s+named)\s+(?:name\s+is\s+|named\s+|called\s+)?(\w+)/gi;
    let match;
    while ((match = petNameRegex.exec(sentence)) !== null) {
      if (match[1] && match[2]) {
        memories.push({
          type: "pet",
          key: `${match[1].toLowerCase()}_name`,
          value: match[2]
        });
      }
    }

    // Pattern: "I live in [location]" or "I'm from [location]"
    const locationRegex = /(?:i\s+live\s+in|i'm\s+from|i\s+am\s+from)\s+([a-zA-Z\s,]+)/gi;
    while ((match = locationRegex.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "location",
          key: "home_location",
          value: match[1].trim()
        });
      }
    }

    // Pattern: "I work at [company]" or "I work for [company]"
    const workRegex = /(?:i\s+work\s+(?:at|for)|i'm\s+employed\s+(?:at|by))\s+([a-zA-Z\s,&]+)/gi;
    while ((match = workRegex.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "work",
          key: "company",
          value: match[1].trim()
        });
      }
    }

    // Pattern: "My name is [name]" or "I'm [name]"
    const nameRegex = /(?:my\s+name\s+is|i'm|i\s+am)\s+([a-zA-Z]+)/gi;
    while ((match = nameRegex.exec(sentence)) !== null) {
      if (match[1]) {
        // Avoid common words
        const name = match[1].trim();
        if (!['from', 'at', 'in', 'working', 'living'].includes(name.toLowerCase())) {
          memories.push({
            type: "personal",
            key: "name",
            value: name
          });
        }
      }
    }

    // Pattern: "I like [thing]" or "I love [thing]"
    const preferenceRegex = /(?:i\s+(?:like|love|enjoy|prefer))\s+([a-zA-Z\s,]+)/gi;
    while ((match = preferenceRegex.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "preference",
          key: "likes",
          value: match[1].trim()
        });
      }
    }

    return memories;
  }

  /**
   * Extract keywords from a prompt for memory search
   */
  private extractKeywordsFromPrompt(prompt: string): string[] {
    const keywords: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // Look for question patterns
    if (lowerPrompt.includes("dog") || lowerPrompt.includes("pet")) {
      keywords.push("dog_name", "cat_name", "pet_name");
    }
    
    if (lowerPrompt.includes("name")) {
      keywords.push("name");
    }
    
    if (lowerPrompt.includes("live") || lowerPrompt.includes("from") || lowerPrompt.includes("location")) {
      keywords.push("home_location");
    }
    
    if (lowerPrompt.includes("work") || lowerPrompt.includes("job") || lowerPrompt.includes("company")) {
      keywords.push("company");
    }
    
    if (lowerPrompt.includes("like") || lowerPrompt.includes("prefer") || lowerPrompt.includes("enjoy")) {
      keywords.push("likes");
    }

    return keywords;
  }

  /**
   * Guess memory types from prompt content
   */
  private guessTypesFromPrompt(prompt: string): string[] {
    const types: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("dog") || lowerPrompt.includes("cat") || lowerPrompt.includes("pet")) {
      types.push("pet");
    }
    
    if (lowerPrompt.includes("name")) {
      types.push("personal");
    }
    
    if (lowerPrompt.includes("live") || lowerPrompt.includes("from") || lowerPrompt.includes("location")) {
      types.push("location");
    }
    
    if (lowerPrompt.includes("work") || lowerPrompt.includes("job") || lowerPrompt.includes("company")) {
      types.push("work");
    }
    
    if (lowerPrompt.includes("like") || lowerPrompt.includes("prefer") || lowerPrompt.includes("enjoy")) {
      types.push("preference");
    }

    return types;
  }
}

export default MongoDBHandler;
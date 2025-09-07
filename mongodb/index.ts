import { MongoClient } from "mongodb";
import type { Db, Collection } from "mongodb";

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
 * MongoDB Handler for managing user memories (en-US and pt-BR support)
 */
export class MongoDBHandler {
  private client: MongoClient;
  private db: Db | null = null;
  private memoriesCollection: Collection<UserMemory> | null = null;

  constructor(mongoUri: string = process.env.MONGO_URI || "mongodb://localhost:27017") {
    this.client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000, // 5 second timeout
    });
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
   * Save memory from a sentence by extracting information (en-US & pt-BR)
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
   * Get relevant memories for a user based on a prompt (en-US & pt-BR)
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
   * Extract memories from a sentence using pattern matching (en-US & pt-BR)
   */
  private extractMemoriesFromSentence(sentence: string): Omit<UserMemory, 'userId' | 'timestamp'>[] {
    const memories: Omit<UserMemory, 'userId' | 'timestamp'>[] = [];
    const lowerSentence = sentence.toLowerCase();

    // ENGLISH: "my [pet type]'s name is [name]", "my [pet type] is named [name]", "my [pet type] se chama [name]"
    const petNameRegexEN = /my\s+(\w+)(?:'s|\s+is|\s+named)\s+(?:name\s+is\s+|named\s+|called\s+)?(\w+)/gi;
    // PORTUGUESE: "meu/minha [tipo de animal] se chama [nome]", "o nome do meu/minha [tipo de animal] é [nome]"
    const petNameRegexPT = /(meu|minha)\s+(\w+)\s+(?:se chama|chama-se|é chamado|é chamada|é)\s+([a-zA-ZÀ-ú]+)/gi;
    let match;
    while ((match = petNameRegexEN.exec(sentence)) !== null) {
      if (match[1] && match[2]) {
        memories.push({
          type: "pet",
          key: `${match[1].toLowerCase()}_name`,
          value: match[2]
        });
      }
    }
    while ((match = petNameRegexPT.exec(lowerSentence)) !== null) {
      if (match[2] && match[3]) {
        memories.push({
          type: "pet",
          key: `${match[2].toLowerCase()}_name`,
          value: match[3]
        });
      }
    }

    // ENGLISH: "I live in [location]", "I'm from [location]"
    const locationRegexEN = /(?:i\s+live\s+in|i'm\s+from|i\s+am\s+from)\s+([a-zA-Z\s,]+)/gi;
    // PORTUGUESE: "eu moro em [local]", "sou de [local]", "eu sou de [local]"
    const locationRegexPT = /(?:eu\s+moro\s+em|sou\s+de|eu\s+sou\s+de)\s+([a-zA-ZÀ-ú\s,]+)/gi;
    while ((match = locationRegexEN.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "location",
          key: "home_location",
          value: match[1].trim()
        });
      }
    }
    while ((match = locationRegexPT.exec(lowerSentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "location",
          key: "home_location",
          value: match[1].trim()
        });
      }
    }

    // ENGLISH: "I work at [company]", "I work for [company]"
    const workRegexEN = /(?:i\s+work\s+(?:at|for)|i'm\s+employed\s+(?:at|by))\s+([a-zA-Z\s,&]+)/gi;
    // PORTUGUESE: "eu trabalho na/no [empresa]", "trabalho na/no [empresa]", "sou empregado na/no [empresa]"
    const workRegexPT = /(?:eu\s+trabalho\s+na|eu\s+trabalho\s+no|trabalho\s+na|trabalho\s+no|sou\s+empregado\s+na|sou\s+empregado\s+no)\s+([a-zA-ZÀ-ú\s,&]+)/gi;
    while ((match = workRegexEN.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "work",
          key: "company",
          value: match[1].trim()
        });
      }
    }
    while ((match = workRegexPT.exec(lowerSentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "work",
          key: "company",
          value: match[1].trim()
        });
      }
    }

    // ENGLISH: "My name is [name]", "I'm [name]", "I am [name]"
    const nameRegexEN = /(?:my\s+name\s+is|i'm|i\s+am)\s+([a-zA-Z]+)/gi;
    // PORTUGUESE: "meu nome é [nome]", "eu sou [nome]", "me chamo [nome]"
    const nameRegexPT = /(?:meu\s+nome\s+é|eu\s+sou|me\s+chamo)\s+([a-zA-ZÀ-ú]+)/gi;
    while ((match = nameRegexEN.exec(sentence)) !== null) {
      if (match[1]) {
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
    while ((match = nameRegexPT.exec(lowerSentence)) !== null) {
      if (match[1]) {
        const name = match[1].trim();
        if (!['de', 'em', 'na', 'no', 'trabalhando', 'morando'].includes(name.toLowerCase())) {
          memories.push({
            type: "personal",
            key: "name",
            value: name
          });
        }
      }
    }

    // ENGLISH: "I like [thing]", "I love [thing]", "I enjoy [thing]", "I prefer [thing]"
    const preferenceRegexEN = /(?:i\s+(?:like|love|enjoy|prefer))\s+([a-zA-Z\s,]+)/gi;
    // PORTUGUESE: "eu gosto de [coisa]", "adoro [coisa]", "eu prefiro [coisa]", "curto [coisa]"
    const preferenceRegexPT = /(?:eu\s+gosto\s+de|adoro|eu\s+prefiro|curto)\s+([a-zA-ZÀ-ú\s,]+)/gi;
    while ((match = preferenceRegexEN.exec(sentence)) !== null) {
      if (match[1]) {
        memories.push({
          type: "preference",
          key: "likes",
          value: match[1].trim()
        });
      }
    }
    while ((match = preferenceRegexPT.exec(lowerSentence)) !== null) {
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
   * Extract keywords from a prompt for memory search (en-US & pt-BR)
   */
  private extractKeywordsFromPrompt(prompt: string): string[] {
    const keywords: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // EN-PT keywords
    if (/(dog|cat|pet|animal|cachorro|gato|animal)/.test(lowerPrompt)) {
      keywords.push("dog_name", "cat_name", "pet_name", "cachorro_name", "gato_name", "animal_name");
    }

    if (/(name|nome)/.test(lowerPrompt)) {
      keywords.push("name");
    }

    if (/(live|from|location|moro|sou de|local)/.test(lowerPrompt)) {
      keywords.push("home_location");
    }

    if (/(work|job|company|trabalho|emprego|empresa)/.test(lowerPrompt)) {
      keywords.push("company");
    }

    if (/(like|prefer|enjoy|gosto|adoro|curto|prefiro)/.test(lowerPrompt)) {
      keywords.push("likes");
    }

    return keywords;
  }

  /**
   * Guess memory types from prompt content (en-US & pt-BR)
   */
  private guessTypesFromPrompt(prompt: string): string[] {
    const types: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    if (/(dog|cat|pet|animal|cachorro|gato|animal)/.test(lowerPrompt)) {
      types.push("pet");
    }

    if (/(name|nome)/.test(lowerPrompt)) {
      types.push("personal");
    }

    if (/(live|from|location|moro|sou de|local)/.test(lowerPrompt)) {
      types.push("location");
    }

    if (/(work|job|company|trabalho|emprego|empresa)/.test(lowerPrompt)) {
      types.push("work");
    }

    if (/(like|prefer|enjoy|gosto|adoro|curto|prefiro)/.test(lowerPrompt)) {
      types.push("preference");
    }

    return types;
  }
}

export default MongoDBHandler;

/**
 * Base Category Module Interface
 * 
 * Each medical category implements this interface to provide
 * specialized handling of conversations within that domain.
 */

import { MedicalIntent } from '../../classification/intentClassifier';

export interface CategoryMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface CategoryResponse {
  message: string;
  isComplete?: boolean;
  options?: string[];
  metadata?: Record<string, any>;
  nextAction?: 'continue' | 'escalate' | 'complete' | 'redirect';
  redirectTo?: MedicalIntent;
  specialFeatures?: {
    quickActions?: Array<{
      label: string;
      action: string;
      type: 'emergency' | 'info' | 'action';
    }>;
    visualElements?: {
      type: 'warning' | 'info' | 'success' | 'medical';
      content: string;
    };
    followUpSuggestions?: string[];
  };
}

export interface CategorySession {
  sessionId: string;
  intent: MedicalIntent;
  conversation: CategoryMessage[];
  metadata: Record<string, any>;
  isComplete: boolean;
  startTime: Date;
  lastActivity: Date;
}

/**
 * Abstract base class for all category modules
 */
export abstract class CategoryModule {
  protected intent: MedicalIntent;
  protected systemPrompt: string;
  
  constructor(intent: MedicalIntent, systemPrompt: string) {
    this.intent = intent;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Initialize a new session for this category
   */
  abstract initializeSession(sessionId: string, initialMessage?: string): Promise<CategorySession>;

  /**
   * Process a user message within this category
   */
  abstract processMessage(
    session: CategorySession, 
    message: string, 
    apiKey: string
  ): Promise<CategoryResponse>;

  /**
   * Get the system prompt for this category
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Get category-specific metadata
   */
  abstract getCategoryInfo(): {
    name: string;
    description: string;
    features: string[];
    specializations: string[];
  };

  /**
   * Handle category-specific actions (like quick actions)
   */
  handleSpecialAction?(
    session: CategorySession,
    action: string,
    data?: any
  ): Promise<CategoryResponse>;

  /**
   * Validate if a message belongs to this category
   */
  abstract validateMessage(message: string): {
    isValid: boolean;
    confidence: number;
    suggestions?: string[];
  };

  /**
   * Get emergency detection for this category
   */
  detectEmergency?(message: string, conversation: CategoryMessage[]): {
    isEmergency: boolean;
    level: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  };
}

/**
 * Category module factory
 */
export type CategoryModuleConstructor = new () => CategoryModule;

/**
 * Registry of all available category modules
 */
export class CategoryRegistry {
  private static modules = new Map<MedicalIntent, CategoryModule>();

  static register(intent: MedicalIntent, module: CategoryModule) {
    this.modules.set(intent, module);
  }

  static get(intent: MedicalIntent): CategoryModule | undefined {
    return this.modules.get(intent);
  }

  static getAll(): Map<MedicalIntent, CategoryModule> {
    return new Map(this.modules);
  }

  static isRegistered(intent: MedicalIntent): boolean {
    return this.modules.has(intent);
  }
}

/**
 * Common utilities for all categories
 */
export class CategoryUtils {
  /**
   * Add standard medical disclaimer to response
   */
  static addMedicalDisclaimer(response: string): string {
    const disclaimer = '\n\n⚕️ این راهنمایی جنبه آموزشی دارد و جایگزین مشاوره پزشک نیست. در مواقع ضروری با پزشک مشورت کنید.';
    return response + disclaimer;
  }

  /**
   * Detect emergency keywords in Persian
   */
  static detectEmergencyKeywords(message: string): boolean {
    const emergencyKeywords = [
      'فوری', 'اورژانس', 'خطرناک', 'شدید', 'وخیم',
      'نفس نمی‌آید', 'قلبم می‌ایستد', 'بی هوش', 'تشنج',
      'خونریزی شدید', 'درد شدید', 'حمله قلبی', 'سکته'
    ];
    
    const normalizedMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => normalizedMessage.includes(keyword));
  }

  /**
   * Format response with Persian medical formatting
   */
  static formatMedicalResponse(content: string): string {
    return content
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .replace(/([.!?])\s*([آ-ی])/g, '$1\n\n$2'); // Add spacing after sentences
  }

  /**
   * Generate session metadata template
   */
  static createSessionMetadata(intent: MedicalIntent, additionalData?: Record<string, any>): Record<string, any> {
    return {
      intent,
      startTime: new Date().toISOString(),
      messageCount: 0,
      lastClassification: intent,
      emergencyDetected: false,
      redirections: [],
      specialActionsUsed: [],
      ...additionalData
    };
  }
}
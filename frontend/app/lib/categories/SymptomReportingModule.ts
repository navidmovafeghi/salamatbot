/**
 * Symptom Reporting Category Module
 * 
 * Handles symptom checking, medical triage, and emergency detection.
 * This module migrates and extends the existing triage system.
 */

import { CategoryModule, CategoryResponse, CategorySession, CategoryMessage, CategoryUtils } from './base/CategoryModule';
import { MedicalIntent } from '../classification/intentClassifier';
import { generateTriageResponse, generateFinalTriageResponse } from '../openai';
import { getTriageTemplate } from '../triageTemplates';
import { TRIAGE_SYSTEM_PROMPT } from '../triagePrompts';

export class SymptomReportingModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.SYMPTOM_REPORTING,
      TRIAGE_SYSTEM_PROMPT
    );
  }

  async initializeSession(sessionId: string, initialMessage?: string): Promise<CategorySession> {
    const session: CategorySession = {
      sessionId,
      intent: this.intent,
      conversation: [
        {
          role: 'system',
          content: this.systemPrompt
        }
      ],
      metadata: CategoryUtils.createSessionMetadata(this.intent, {
        triageStage: 'assessment',
        symptomsReported: [],
        emergencyChecked: false,
        questionsAsked: 0,
        maxQuestions: 4
      }),
      isComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };

    if (initialMessage) {
      session.conversation.push({
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      });
    }

    return session;
  }

  async processMessage(
    session: CategorySession, 
    message: string, 
    apiKey: string
  ): Promise<CategoryResponse> {
    // Check for emergency first
    const emergencyCheck = this.detectEmergency(message, session.conversation);
    if (emergencyCheck.isEmergency && emergencyCheck.level === 'critical') {
      return this.createEmergencyResponse(emergencyCheck);
    }

    // Add user message to conversation
    session.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Update metadata
    session.metadata.questionsAsked = (session.metadata.questionsAsked || 0) + 1;
    session.lastActivity = new Date();

    try {
      // Generate AI response using existing triage logic
      const aiResponse = await generateTriageResponse(session.conversation);
      const assistantContent = aiResponse.content;

      // Try to parse as classification
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(assistantContent);
      } catch {
        parsedResponse = null;
      }

      if (parsedResponse && parsedResponse.type === 'classification') {
        // Final classification reached
        session.isComplete = true;
        session.metadata.triageStage = 'completed';
        session.metadata.finalClassification = parsedResponse.category;

        return await this.generateFinalResponse(session, parsedResponse, apiKey);
      } else {
        // Continue assessment with question
        session.conversation.push({
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        });

        const response = this.parseQuestionResponse(assistantContent);
        response.metadata = {
          stage: 'assessment',
          questionsAsked: session.metadata.questionsAsked,
          maxQuestions: session.metadata.maxQuestions
        };

        return response;
      }

    } catch (error) {
      console.error('Symptom reporting error:', error);
      return {
        message: 'متأسفانه خطایی رخ داده است. لطفاً علائم خود را دوباره شرح دهید.',
        nextAction: 'continue'
      };
    }
  }

  private async generateFinalResponse(
    session: CategorySession, 
    classification: any, 
    apiKey: string
  ): Promise<CategoryResponse> {
    const template = getTriageTemplate(classification.category);
    
    try {
      // Generate detailed final response
      const endPrompt = this.getFinalResponsePrompt(classification.category);
      const finalConversation = [
        { role: 'system' as const, content: endPrompt },
        ...session.conversation.slice(1) // Skip original system prompt
      ];

      const finalResponse = await generateFinalTriageResponse(
        finalConversation, 
        classification.category
      );

      let finalContent;
      try {
        finalContent = JSON.parse(finalResponse.content);
      } catch {
        finalContent = { comprehensive_assessment: finalResponse.content };
      }

      return {
        message: this.formatFinalResponse(finalContent, template),
        isComplete: true,
        nextAction: 'complete',
        metadata: {
          classification: classification.category,
          template: template,
          finalResponse: finalContent
        },
        specialFeatures: this.getSpecialFeatures(classification.category, template)
      };

    } catch (error) {
      console.error('Final response generation error:', error);
      
      // Fallback to template-only response
      return {
        message: this.formatTemplateResponse(template),
        isComplete: true,
        nextAction: 'complete',
        metadata: { classification: classification.category, template }
      };
    }
  }

  private parseQuestionResponse(content: string): CategoryResponse {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'question') {
        return {
          message: parsed.message || content,
          options: parsed.options,
          nextAction: 'continue'
        };
      }
    } catch {
      // Not JSON, treat as regular question
    }

    return {
      message: content,
      nextAction: 'continue'
    };
  }

  private createEmergencyResponse(emergencyCheck: any): CategoryResponse {
    return {
      message: `🚨 **وضعیت اورژانسی تشخیص داده شد**\n\n${emergencyCheck.recommendation}\n\n**فوراً اقدام کنید:**`,
      isComplete: true,
      nextAction: 'escalate',
      specialFeatures: {
        quickActions: [
          {
            label: '📞 تماس با اورژانس (115)',
            action: 'call_emergency',
            type: 'emergency'
          },
          {
            label: '🏥 یافتن نزدیک‌ترین بیمارستان',
            action: 'find_hospital',
            type: 'emergency'
          }
        ],
        visualElements: {
          type: 'warning',
          content: 'این وضعیت نیاز به مراجعه فوری به پزشک دارد'
        }
      }
    };
  }

  private getSpecialFeatures(classification: string, template: any): any {
    const features: any = {
      followUpSuggestions: [
        'شروع گفتگوی جدید',
        'سوال دارویی',
        'اطلاعات پزشکی'
      ]
    };

    // Add emergency-specific quick actions
    if (classification === 'emergency') {
      features.quickActions = [
        {
          label: '📞 تماس با اورژانس',
          action: 'call_emergency',
          type: 'emergency'
        },
        {
          label: '🏥 یافتن بیمارستان',
          action: 'find_hospital',
          type: 'emergency'
        }
      ];
    } else if (classification === 'urgent') {
      features.quickActions = [
        {
          label: '🏥 یافتن پزشک',
          action: 'find_doctor',
          type: 'action'
        },
        {
          label: '📋 نکات مراقبتی',
          action: 'care_tips',
          type: 'info'
        }
      ];
    }

    return features;
  }

  private formatFinalResponse(finalContent: any, template: any): string {
    let response = '';
    
    if (template?.title) {
      response += `**${template.title}**\n\n`;
    }

    if (finalContent.comprehensive_assessment) {
      response += finalContent.comprehensive_assessment + '\n\n';
    }

    if (template?.recommendations?.length > 0) {
      response += '**توصیه‌ها:**\n';
      template.recommendations.forEach((rec: string, index: number) => {
        response += `${index + 1}. ${rec}\n`;
      });
      response += '\n';
    }

    return CategoryUtils.addMedicalDisclaimer(response.trim());
  }

  private formatTemplateResponse(template: any): string {
    let response = `**${template.title || 'نتیجه بررسی علائم'}**\n\n`;
    
    if (template.description) {
      response += template.description + '\n\n';
    }

    if (template.recommendations?.length > 0) {
      response += '**توصیه‌ها:**\n';
      template.recommendations.forEach((rec: string, index: number) => {
        response += `${index + 1}. ${rec}\n`;
      });
    }

    return CategoryUtils.addMedicalDisclaimer(response);
  }

  private getFinalResponsePrompt(category: string): string {
    const prompts = {
      emergency: 'شما پزشک اورژانس هستید. بر اساس علائم گزارش شده، راهنمایی دقیق و فوری ارائه دهید.',
      urgent: 'شما پزشک عمومی هستید. علائم نشان‌دهنده وضعیت نیازمند مراقبت پزشکی است.',
      moderate: 'شما پزشک عمومی هستید. علائم قابل توجه هستند و نیاز به پیگیری دارند.',
      mild: 'شما پزشک عمومی هستید. علائم خفیف هستند اما راهنمایی مناسب ارائه دهید.',
      self_care: 'شما پزشک عمومی هستید. علائم قابل مدیریت با مراقبت‌های خانگی هستند.'
    };

    return prompts[category as keyof typeof prompts] || prompts.moderate;
  }

  getCategoryInfo() {
    return {
      name: 'بررسی علائم',
      description: 'سیستم تریاژ پزشکی برای بررسی و طبقه‌بندی علائم',
      features: [
        'تشخیص اورژانس',
        'سوالات هدفمند',
        'طبقه‌بندی 5 سطحی',
        'راهنمایی تخصصی',
        'دکمه‌های عمل سریع'
      ],
      specializations: [
        'علائم عمومی',
        'درد و ناراحتی',
        'علائم اورژانسی',
        'مشکلات حاد'
      ]
    };
  }

  validateMessage(message: string) {
    const symptomKeywords = [
      'درد', 'ناراحتی', 'علامت', 'احساس', 'مشکل',
      'تب', 'سردرد', 'سرفه', 'خستگی', 'تهوع'
    ];

    const normalizedMessage = message.toLowerCase();
    const matchCount = symptomKeywords.filter(keyword => 
      normalizedMessage.includes(keyword)
    ).length;

    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.3, 0.9),
      suggestions: matchCount === 0 ? [
        'علائم خود را شرح دهید',
        'نوع درد یا ناراحتی را توضیح دهید',
        'زمان شروع مشکل را بیان کنید'
      ] : undefined
    };
  }

  detectEmergency(message: string, conversation: CategoryMessage[]) {
    const emergencyKeywords = {
      critical: [
        'نفس نمی‌آید', 'نفسم بند می‌آید', 'خفگی',
        'درد شدید قلب', 'حمله قلبی', 'سکته',
        'بی هوش', 'تشنج', 'درد شدید سینه'
      ],
      high: [
        'درد شدید', 'خونریزی', 'تب بالا',
        'درد شکم شدید', 'سردرد شدید', 'تهوع شدید'
      ],
      medium: [
        'درد مداوم', 'تب', 'سرفه مداوم',
        'اسهال', 'استفراغ', 'گیجی خفیف'
      ]
    };

    const normalizedMessage = message.toLowerCase();
    
    for (const [level, keywords] of Object.entries(emergencyKeywords)) {
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword)) {
          return {
            isEmergency: level !== 'medium',
            level: level as 'low' | 'medium' | 'high' | 'critical',
            recommendation: this.getEmergencyRecommendation(level)
          };
        }
      }
    }

    return {
      isEmergency: false,
      level: 'low' as const,
      recommendation: 'علائم خود را با جزئیات بیشتر شرح دهید.'
    };
  }

  private getEmergencyRecommendation(level: string): string {
    const recommendations = {
      critical: 'فوراً با شماره ۱۱۵ تماس بگیرید یا به نزدیک‌ترین بیمارستان مراجعه کنید.',
      high: 'در اسرع وقت با پزشک تماس بگیرید یا به مرکز درمانی مراجعه کنید.',
      medium: 'توصیه می‌شود با پزشک مشورت کنید و علائم را پیگیری نمایید.'
    };

    return recommendations[level as keyof typeof recommendations] || recommendations.medium;
  }
}
/**
 * Symptom Reporting Category Module
 * 
 * Handles symptom checking, medical triage, and emergency detection.
 * This module migrates and extends the existing triage system.
 */

import { CategoryModule, CategoryResponse, CategorySession, CategoryMessage, CategoryUtils } from './base/CategoryModule';
import { MedicalIntent } from '../classification/intentClassifier';
import { generateTriageResponse, generateFinalTriageResponse } from '../openai';
import { getTriageTemplate, formatTemplateResponse, getTemplateQuickActions } from '../triageTemplates';
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
      // Convert conversation to ChatMessage format for OpenAI
      const chatMessages = session.conversation.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
      
      // Generate AI response using existing triage logic
      const aiResponse = await generateTriageResponse(chatMessages);
      const assistantContent = aiResponse.content;

      console.log('Raw AI response:', assistantContent);

      // Try to parse as classification
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(assistantContent);
        console.log('Parsed response:', parsedResponse);
      } catch {
        console.log('Failed to parse JSON, treating as plain text');
        parsedResponse = null;
      }

      if (parsedResponse && parsedResponse.type === 'classification') {
        // Final classification reached
        session.isComplete = true;
        session.metadata.triageStage = 'completed';
        session.metadata.finalClassification = parsedResponse.category;

        return await this.generateFinalResponse(session, parsedResponse, apiKey);
      } else if (parsedResponse && parsedResponse.type === 'question') {
        // Continue assessment with parsed question
        session.conversation.push({
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date()
        });

        return {
          message: parsedResponse.message,
          options: parsedResponse.options || [],
          nextAction: 'continue',
          metadata: {
            stage: 'assessment',
            questionsAsked: session.metadata.questionsAsked,
            maxQuestions: session.metadata.maxQuestions
          }
        };
      } else {
        // Continue assessment with fallback parsing
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
    
    if (!template) {
      // Fallback response when template is not found
      return {
        message: 'متأسفانه خطایی در سیستم رخ داده است. لطفاً دوباره تلاش کنید.',
        isComplete: true,
        nextAction: 'complete',
        metadata: { classification: classification.category }
      };
    }
    
    try {
      // Generate detailed final response using specialized prompts
      const finalResponse = await generateFinalTriageResponse(
        session.conversation, 
        classification.category
      );

      let finalContent;
      try {
        finalContent = JSON.parse(finalResponse.content);
      } catch {
        finalContent = { comprehensive_assessment: finalResponse.content };
      }

      return {
        message: formatTemplateResponse(template, finalContent),
        isComplete: true,
        nextAction: classification.category === 'EMERGENCY' ? 'escalate' : 'complete',
        metadata: {
          classification: classification.category,
          template: template,
          finalResponse: finalContent
        },
        specialFeatures: {
          quickActions: getTemplateQuickActions(template),
          followUpSuggestions: [
            'شروع گفتگوی جدید',
            'سوال دارویی',
            'اطلاعات پزشکی'
          ]
        }
      };

    } catch (error) {
      console.error('Final response generation error:', error);
      
      // Fallback to template-only response
      const fallbackContent = { comprehensive_assessment: 'لطفاً با پزشک مشورت کنید تا راهنمایی دقیق‌تری دریافت نمایید.' };
      
      return {
        message: formatTemplateResponse(template, fallbackContent),
        isComplete: true,
        nextAction: classification.category === 'EMERGENCY' ? 'escalate' : 'complete',
        metadata: { classification: classification.category, template },
        specialFeatures: {
          quickActions: getTemplateQuickActions(template),
          followUpSuggestions: [
            'شروع گفتگوی جدید',
            'سوال دارویی',
            'اطلاعات پزشکی'
          ]
        }
      };
    }
  }

  private parseQuestionResponse(content: string): CategoryResponse {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'question') {
        return {
          message: parsed.message || content,
          options: parsed.options || [],
          nextAction: 'continue'
        };
      }
    } catch (error) {
      console.error('JSON parsing error in SymptomReportingModule:', error);
      // Not JSON, treat as regular question
    }

    return {
      message: content,
      nextAction: 'continue'
    };
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

}
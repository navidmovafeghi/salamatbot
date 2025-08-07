/**
 * Medication Queries Category Module
 * 
 * Handles medication-related questions, drug interactions, dosage queries,
 * side effects, and pharmaceutical guidance.
 */

import { CategoryModule, CategoryResponse, CategorySession, CategoryMessage, CategoryUtils } from './base/CategoryModule';
import { MedicalIntent } from '../classification/intentClassifier';

export class MedicationQueriesModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.MEDICATION_QUERIES,
      `شما یک داروساز متخصص هستید که به زبان فارسی مشاوره دارویی ارائه می‌دهید.

تخصص‌های شما:
- راهنمایی در مورد مصرف دارو و دوز مناسب
- توضیح عوارض جانبی و راه‌های کنترل آن‌ها  
- بررسی تداخلات دارویی
- زمان‌بندی مصرف داروها
- نگهداری و انبارداری دارو
- جایگزین‌های دارویی

قوانین مهم:
- هرگز دارو تجویز نکنید، فقط راهنمایی دهید
- همیشه به مشورت با پزشک تأکید کنید
- در مورد تداخلات خطرناک هشدار جدی دهید
- اطلاعات دقیق و قابل اعتماد ارائه دهید
- در مواقع ضروری، مراجعه فوری به پزشک را توصیه کنید

پاسخ شما باید شامل:
1. توضیح مستقیم سوال
2. نکات ایمنی مهم
3. توصیه به مشورت پزشک
4. راهنمایی‌های عملی`
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
        queryType: 'general',
        medicationsDiscussed: [],
        interactionsChecked: false,
        safetyWarningsGiven: [],
        requiresPharmacistConsult: false
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
    // Analyze medication query type
    const queryAnalysis = this.analyzeMedicationQuery(message);
    session.metadata.queryType = queryAnalysis.type;
    
    // Check for dangerous interactions or high-risk scenarios
    const safetyCheck = this.checkMedicationSafety(message, session.conversation);
    if (safetyCheck.requiresUrgentAttention) {
      return this.createSafetyWarningResponse(safetyCheck);
    }

    // Add user message to conversation
    session.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    session.lastActivity = new Date();

    try {
      // Generate AI response using medication-specific logic
      const response = await this.generateMedicationResponse(session, apiKey);
      
      // Add assistant response to conversation
      session.conversation.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });

      // Update metadata based on response
      this.updateSessionMetadata(session, message, response);

      return response;

    } catch (error) {
      console.error('Medication query error:', error);
      return {
        message: 'متأسفانه خطایی رخ داده است. لطفاً سوال دارویی خود را دوباره مطرح کنید یا با داروساز مشورت نمایید.',
        nextAction: 'continue',
        specialFeatures: {
          quickActions: [
            {
              label: '💊 مشاوره با داروساز',
              action: 'consult_pharmacist',
              type: 'action'
            }
          ]
        }
      };
    }
  }

  private analyzeMedicationQuery(message: string): { type: string; complexity: string; medications: string[] } {
    const normalizedMessage = message.toLowerCase();
    const medications: string[] = [];
    
    // Common medication patterns in Persian
    const medicationPatterns = [
      /آسپرین|اسپیرین/g, /آمپیسیلین/g, /پنی‌سیلین/g,
      /پاراستامول|استامینوفن/g, /ایبوپروفن/g, /دیکلوفناک/g,
      /متفورمین/g, /انسولین/g, /لووتیروکسین/g,
      /آتورواستاتین/g, /امپرازول/g, /سرترالین/g
    ];

    medicationPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        medications.push(...matches);
      }
    });

    let queryType = 'general';
    if (normalizedMessage.includes('عوارض') || normalizedMessage.includes('ضرر')) {
      queryType = 'side_effects';
    } else if (normalizedMessage.includes('تداخل') || normalizedMessage.includes('با هم')) {
      queryType = 'interactions';
    } else if (normalizedMessage.includes('دوز') || normalizedMessage.includes('مقدار')) {
      queryType = 'dosage';
    } else if (normalizedMessage.includes('زمان') || normalizedMessage.includes('کی')) {
      queryType = 'timing';
    }

    const complexity = medications.length > 1 || normalizedMessage.split(' ').length > 10 ? 'complex' : 'simple';

    return { type: queryType, complexity, medications };
  }

  private checkMedicationSafety(message: string, conversation: CategoryMessage[]): any {
    const dangerousPatterns = [
      'چند برابر', 'دوز اضافی', 'بیشتر بخورم',
      'با الکل', 'حاملگی', 'شیردهی',
      'آلرژی شدید', 'واکنش بد', 'مسمومیت'
    ];

    const normalizedMessage = message.toLowerCase();
    const hasDangerousPattern = dangerousPatterns.some(pattern => 
      normalizedMessage.includes(pattern)
    );

    return {
      requiresUrgentAttention: hasDangerousPattern,
      warningType: hasDangerousPattern ? 'high_risk' : 'normal',
      recommendation: hasDangerousPattern ? 
        'این موضوع نیاز به مشورت فوری با پزشک یا داروساز دارد.' :
        'مصرف دارو طبق دستور پزشک انجام دهید.'
    };
  }

  private createSafetyWarningResponse(safetyCheck: any): CategoryResponse {
    return {
      message: `⚠️ **هشدار مهم دارویی**\n\n${safetyCheck.recommendation}\n\n**توصیه‌های فوری:**\n• فوراً با پزشک یا داروساز تماس بگیرید\n• از تغییر دوز یا قطع ناگهانی دارو خودداری کنید\n• در صورت بروز عوارض جانبی، مصرف را متوقف کنید`,
      nextAction: 'escalate',
      specialFeatures: {
        visualElements: {
          type: 'warning',
          content: 'این موضوع نیاز به توجه فوری دارد'
        },
        quickActions: [
          {
            label: '📞 تماس با مرکز سموم',
            action: 'poison_center',
            type: 'emergency'
          },
          {
            label: '💊 مشاوره فوری داروساز',
            action: 'urgent_pharmacist',
            type: 'emergency'
          }
        ]
      }
    };
  }

  private async generateMedicationResponse(
    session: CategorySession,
    apiKey: string
  ): Promise<CategoryResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://salamatbot.ir',
          'X-Title': 'SalamatBot Medication Queries'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: session.conversation,
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in API response');
      }

      const formattedResponse = CategoryUtils.formatMedicalResponse(content);
      const responseWithDisclaimer = CategoryUtils.addMedicalDisclaimer(formattedResponse);

      return {
        message: responseWithDisclaimer,
        nextAction: 'continue',
        specialFeatures: this.getMedicationSpecialFeatures(session.metadata.queryType)
      };

    } catch (error) {
      throw error;
    }
  }

  private getMedicationSpecialFeatures(queryType: string): any {
    const baseFeatures = {
      followUpSuggestions: [
        'سوال دارویی دیگر',
        'بررسی تداخل دارویی',
        'عوارض جانبی دارو'
      ]
    };

    switch (queryType) {
      case 'interactions':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '🔍 بررسی تداخل دارویی',
              action: 'check_interactions',
              type: 'action'
            },
            {
              label: '📋 لیست داروهای من',
              action: 'medication_list',
              type: 'info'
            }
          ]
        };

      case 'side_effects':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '⚕️ مدیریت عوارض',
              action: 'manage_side_effects',
              type: 'info'
            },
            {
              label: '📞 تماس با پزشک',
              action: 'contact_doctor',
              type: 'action'
            }
          ]
        };

      case 'dosage':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '⏰ یادآوری دارو',
              action: 'medication_reminder',
              type: 'action'
            },
            {
              label: '📊 محاسبه دوز',
              action: 'dose_calculator',
              type: 'action'
            }
          ]
        };

      default:
        return baseFeatures;
    }
  }

  private updateSessionMetadata(
    session: CategorySession,
    message: string,
    response: CategoryResponse
  ): void {
    // Extract mentioned medications
    const medications = this.extractMedications(message);
    const existingMeds = session.metadata.medicationsDiscussed || [];
    const allMeds = [...existingMeds, ...medications];
    session.metadata.medicationsDiscussed = Array.from(new Set(allMeds));

    // Check if interactions were discussed
    if (message.toLowerCase().includes('تداخل')) {
      session.metadata.interactionsChecked = true;
    }

    // Update activity timestamp
    session.metadata.lastActivity = new Date().toISOString();
  }

  private extractMedications(message: string): string[] {
    // Simple medication extraction - could be enhanced with NLP
    const commonMedications = [
      'آسپرین', 'پاراستامول', 'ایبوپروفن', 'آنتی‌بیوتیک',
      'انسولین', 'متفورمین', 'ویتامین', 'مکمل'
    ];

    const foundMedications: string[] = [];
    for (const med of commonMedications) {
      if (message.toLowerCase().includes(med.toLowerCase())) {
        foundMedications.push(med);
      }
    }
    return foundMedications;
  }

  getCategoryInfo() {
    return {
      name: 'سوالات دارویی',
      description: 'مشاوره تخصصی دارویی و راهنمایی مصرف دارو',
      features: [
        'راهنمایی دوز و مصرف',
        'بررسی تداخلات دارویی',
        'توضیح عوارض جانبی',
        'نکات ایمنی دارویی',
        'زمان‌بندی مصرف'
      ],
      specializations: [
        'داروهای بدون نسخه',
        'مکمل‌های غذایی',
        'تداخلات دارویی',
        'مدیریت عوارض جانبی'
      ]
    };
  }

  validateMessage(message: string) {
    const medicationKeywords = [
      'دارو', 'قرص', 'کپسول', 'شربت',
      'مسکن', 'آنتی‌بیوتیک', 'ویتامین', 'مکمل',
      'دوز', 'مصرف', 'عوارض', 'تداخل'
    ];

    const normalizedMessage = message.toLowerCase();
    const matchCount = medicationKeywords.filter(keyword => 
      normalizedMessage.includes(keyword)
    ).length;

    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.25, 0.9),
      suggestions: matchCount === 0 ? [
        'سوال خود را در مورد دارو مطرح کنید',
        'نام دارو و سوال مورد نظر را بیان کنید',
        'در مورد عوارض یا نحوه مصرف بپرسید'
      ] : undefined
    };
  }
}
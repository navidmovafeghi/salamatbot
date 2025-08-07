/**
 * Information Seeking Category Module
 * 
 * Handles general medical information requests, educational content,
 * condition explanations, and medical knowledge queries.
 */

import { CategoryModule, CategoryResponse, CategorySession, CategoryMessage, CategoryUtils } from './base/CategoryModule';
import { MedicalIntent } from '../classification/intentClassifier';

export class InformationSeekingModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.INFORMATION_SEEKING,
      `شما یک پزشک آموزش‌دهنده هستید که اطلاعات پزشکی آموزشی به زبان فارسی ارائه می‌دهید.

وظایف شما:
- توضیح مفاهیم پزشکی به زبان ساده و قابل فهم
- ارائه اطلاعات علمی دقیق و به‌روز
- پاسخ به سوالات عمومی سلامت
- توضیح بیماری‌ها، علل و راه‌های درمان
- آموزش نکات بهداشتی و پیشگیری

اصول مهم:
- اطلاعات آموزشی ارائه دهید، نه تشخیص
- منابع معتبر و علمی استفاده کنید
- به زبان ساده و روان توضیح دهید
- مطالب را برای عموم مردم قابل فهم کنید
- همیشه به مشورت با پزشک تأکید کنید

ساختار پاسخ شما:
1. تعریف و توضیح مفهوم
2. علل و عوامل مؤثر
3. علائم و نشانه‌ها (در صورت نیاز)
4. راه‌های پیشگیری
5. زمان مراجعه به پزشک`
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
        topicType: 'general',
        topicsDiscussed: [],
        educationalLevel: 'basic',
        requiresVisualization: false
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
    // Analyze the type of information request
    const topicAnalysis = this.analyzeInformationRequest(message);
    session.metadata.topicType = topicAnalysis.type;
    session.metadata.topicsDiscussed.push(topicAnalysis.mainTopic);

    // Add user message to conversation
    session.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    session.lastActivity = new Date();

    try {
      // Generate educational response
      const response = await this.generateEducationalResponse(session, apiKey);
      
      // Add assistant response to conversation
      session.conversation.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });

      return response;

    } catch (error) {
      console.error('Information seeking error:', error);
      return {
        message: 'متأسفانه خطایی رخ داده است. لطفاً سوال خود را دوباره مطرح کنید یا از منابع معتبر پزشکی استفاده نمایید.',
        nextAction: 'continue',
        specialFeatures: {
          followUpSuggestions: [
            'سوال جدید بپرسید',
            'اطلاعات تکمیلی',
            'منابع بیشتر'
          ]
        }
      };
    }
  }

  private analyzeInformationRequest(message: string): { type: string; mainTopic: string; complexity: string } {
    const normalizedMessage = message.toLowerCase();
    
    let type = 'general';
    let mainTopic = 'عمومی';
    
    // Medical topics classification
    if (this.containsWords(normalizedMessage, ['بیماری', 'اختلال', 'سندرم'])) {
      type = 'disease_information';
      mainTopic = this.extractMainTopic(message, ['دیابت', 'فشار خون', 'آسم', 'آرتریت']);
    } else if (this.containsWords(normalizedMessage, ['درمان', 'علاج', 'طریقه'])) {
      type = 'treatment_information';
      mainTopic = 'روش‌های درمان';
    } else if (this.containsWords(normalizedMessage, ['پیشگیری', 'جلوگیری', 'مراقبت'])) {
      type = 'prevention_information';
      mainTopic = 'پیشگیری';
    } else if (this.containsWords(normalizedMessage, ['آناتومی', 'بدن', 'عضو'])) {
      type = 'anatomy_physiology';
      mainTopic = 'آناتومی و فیزیولوژی';
    }

    const complexity = normalizedMessage.split(' ').length > 15 ? 'complex' : 'simple';

    return { type, mainTopic, complexity };
  }

  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word));
  }

  private extractMainTopic(message: string, topics: string[]): string {
    const found = topics.find(topic => message.toLowerCase().includes(topic));
    return found || 'عمومی';
  }

  private async generateEducationalResponse(
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
          'X-Title': 'SalamatBot Information Seeking'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: session.conversation,
          temperature: 0.2,
          max_tokens: 1000
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
      const responseWithDisclaimer = this.addEducationalDisclaimer(formattedResponse);

      return {
        message: responseWithDisclaimer,
        nextAction: 'continue',
        specialFeatures: this.getInformationSpecialFeatures(session.metadata.topicType)
      };

    } catch (error) {
      throw error;
    }
  }

  private addEducationalDisclaimer(response: string): string {
    const disclaimer = '\n\n📚 این اطلاعات جنبه آموزشی دارد و جایگزین مشاوره پزشک نیست. برای تشخیص و درمان، حتماً با پزشک متخصص مشورت کنید.';
    return response + disclaimer;
  }

  private getInformationSpecialFeatures(topicType: string): any {
    const baseFeatures = {
      followUpSuggestions: [
        'سوال تکمیلی',
        'جزئیات بیشتر',
        'موضوع مرتبط'
      ]
    };

    switch (topicType) {
      case 'disease_information':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '🔍 علائم این بیماری',
              action: 'symptoms_info',
              type: 'info'
            },
            {
              label: '💊 روش‌های درمان',
              action: 'treatment_info',
              type: 'info'
            },
            {
              label: '🛡️ راه‌های پیشگیری',
              action: 'prevention_info',
              type: 'info'
            }
          ]
        };

      case 'treatment_information':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '⚕️ انواع درمان',
              action: 'treatment_types',
              type: 'info'
            },
            {
              label: '📊 موثرترین روش',
              action: 'best_treatment',
              type: 'info'
            }
          ]
        };

      case 'prevention_information':
        return {
          ...baseFeatures,
          quickActions: [
            {
              label: '🍎 تغذیه سالم',
              action: 'nutrition_info',
              type: 'info'
            },
            {
              label: '🏃 ورزش مناسب',
              action: 'exercise_info',
              type: 'info'
            },
            {
              label: '🧠 سلامت روان',
              action: 'mental_health_info',
              type: 'info'
            }
          ]
        };

      default:
        return baseFeatures;
    }
  }

  getCategoryInfo() {
    return {
      name: 'کسب اطلاعات پزشکی',
      description: 'ارائه اطلاعات آموزشی و علمی در زمینه پزشکی',
      features: [
        'توضیح بیماری‌ها',
        'روش‌های درمان',
        'نکات پیشگیری',
        'آموزش آناتومی',
        'اطلاعات سلامت عمومی'
      ],
      specializations: [
        'بیماری‌های شایع',
        'سلامت عمومی',
        'پیشگیری از بیماری',
        'آموزش پزشکی'
      ]
    };
  }

  validateMessage(message: string) {
    const informationKeywords = [
      'چیست', 'چی هست', 'چگونه', 'چطور', 'چرا',
      'اطلاعات', 'معلومات', 'راجع به', 'در مورد',
      'بگو', 'توضیح', 'تعریف', 'یعنی چه'
    ];

    const normalizedMessage = message.toLowerCase();
    const matchCount = informationKeywords.filter(keyword => 
      normalizedMessage.includes(keyword)
    ).length;

    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.3, 0.9),
      suggestions: matchCount === 0 ? [
        'سوال خود را با کلمات "چیست" یا "چگونه" مطرح کنید',
        'از عبارات "در مورد" یا "راجع به" استفاده کنید',
        'بپرسید که چه چیزی می‌خواهید بدانید'
      ] : undefined
    };
  }
}
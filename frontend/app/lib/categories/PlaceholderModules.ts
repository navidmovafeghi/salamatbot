/**
 * Placeholder modules for categories not yet fully implemented
 * These provide basic functionality until full implementations are ready
 */

import { CategoryModule, CategoryResponse, CategorySession, CategoryMessage, CategoryUtils } from './base/CategoryModule';
import { MedicalIntent } from '../classification/intentClassifier';

/**
 * Chronic Disease Management Module (Placeholder)
 */
export class ChronicDiseaseManagementModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.CHRONIC_DISEASE_MANAGEMENT,
      `شما یک پزشک متخصص در مدیریت بیماری‌های مزمن هستید که به زبان فارسی مشاوره می‌دهید.

تخصص‌های شما:
- مدیریت دیابت و کنترل قند خون
- پیگیری فشار خون و بیماری‌های قلبی عروقی
- مراقبت از بیماری‌های کلیوی و کبدی مزمن
- درمان آسم و بیماری‌های ریوی مزمن
- مدیریت آرتریت و بیماری‌های التهابی

رویکرد شما:
- ارائه راهنمایی‌های عملی برای زندگی با بیماری مزمن
- توصیه‌های تغذیه‌ای و سبک زندگی
- نظارت بر روند درمان و پیگیری منظم
- آموزش خودمراقبتی و خودنظارتی

هدف: کمک به بیماران برای بهبود کیفیت زندگی و کنترل موثر بیماری مزمن`
    );
  }

  async initializeSession(sessionId: string, initialMessage?: string): Promise<CategorySession> {
    return {
      sessionId,
      intent: this.intent,
      conversation: [{ role: 'system', content: this.systemPrompt }],
      metadata: CategoryUtils.createSessionMetadata(this.intent, {
        diseaseType: 'unknown',
        managementStage: 'initial',
        monitoringNeeds: []
      }),
      isComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  async processMessage(session: CategorySession, message: string, apiKey: string): Promise<CategoryResponse> {
    return {
      message: 'این بخش در حال توسعه است. لطفاً با پزشک متخصص خود مشورت کنید.',
      nextAction: 'continue',
      specialFeatures: {
        followUpSuggestions: ['بررسی علائم', 'سوال دارویی', 'اطلاعات پزشکی']
      }
    };
  }

  getCategoryInfo() {
    return {
      name: 'مدیریت بیماری‌های مزمن',
      description: 'راهنمایی تخصصی برای مدیریت بیماری‌های طولانی مدت',
      features: ['مدیریت دیابت', 'کنترل فشار خون', 'پیگیری درمان', 'سبک زندگی سالم'],
      specializations: ['دیابت', 'فشار خون', 'بیماری‌های قلبی', 'آسم']
    };
  }

  validateMessage(message: string) {
    const keywords = ['دیابت', 'فشار خون', 'مزمن', 'کنترل', 'پیگیری'];
    const normalizedMessage = message.toLowerCase();
    const matchCount = keywords.filter(keyword => normalizedMessage.includes(keyword)).length;
    
    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.3, 0.9),
      suggestions: matchCount === 0 ? ['بیماری مزمن خود را نام ببرید'] : undefined
    };
  }
}

/**
 * Diagnostic Result Interpretation Module (Placeholder)
 */
export class DiagnosticResultInterpretationModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.DIAGNOSTIC_RESULT_INTERPRETATION,
      `شما یک پزشک مختص آزمایشگاه هستید که نتایج آزمایش‌ها را به زبان فارسی تفسیر می‌کنید.

تخصص‌های شما:
- تفسیر آزمایش‌های خون و ادرار
- توضیح گزارش‌های رادیولوژی و تصویربرداری
- تحلیل نتایج بیوپسی و پاتولوژی
- ارزیابی تست‌های قلبی و ریوی

اصول مهم:
- هرگز تشخیص قطعی ندهید، فقط توضیح دهید
- اهمیت مشورت با پزشک را تأکید کنید
- نتایج را در زمینه بالینی قرار دهید
- از اصطلاحات ساده و قابل فهم استفاده کنید

هدف: کمک به درک بهتر نتایج آزمایش‌ها و اهمیت مراجعه به پزشک`
    );
  }

  async initializeSession(sessionId: string, initialMessage?: string): Promise<CategorySession> {
    return {
      sessionId,
      intent: this.intent,
      conversation: [{ role: 'system', content: this.systemPrompt }],
      metadata: CategoryUtils.createSessionMetadata(this.intent, {
        testType: 'unknown',
        resultValues: [],
        requiresUrgentAttention: false
      }),
      isComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  async processMessage(session: CategorySession, message: string, apiKey: string): Promise<CategoryResponse> {
    return {
      message: 'این بخش در حال توسعه است. برای تفسیر نتایج آزمایش، لطفاً با پزشک متخصص مشورت کنید.',
      nextAction: 'continue',
      specialFeatures: {
        visualElements: {
          type: 'warning',
          content: 'تفسیر نتایج آزمایش نیاز به بررسی پزشک دارد'
        },
        followUpSuggestions: ['بررسی علائم', 'اطلاعات پزشکی', 'سوال دارویی']
      }
    };
  }

  getCategoryInfo() {
    return {
      name: 'تفسیر نتایج آزمایش',
      description: 'کمک به درک نتایج آزمایش‌های پزشکی',
      features: ['تفسیر آزمایش خون', 'گزارش رادیولوژی', 'نتایج بیوپسی', 'تست‌های تخصصی'],
      specializations: ['آزمایش‌های خون', 'تصویربرداری', 'پاتولوژی', 'تست‌های عملکردی']
    };
  }

  validateMessage(message: string) {
    const keywords = ['آزمایش', 'نتیجه', 'گزارش', 'جواب', 'تست', 'نرمال', 'غیرطبیعی'];
    const normalizedMessage = message.toLowerCase();
    const matchCount = keywords.filter(keyword => normalizedMessage.includes(keyword)).length;
    
    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.3, 0.9),
      suggestions: matchCount === 0 ? ['نتایج آزمایش خود را شرح دهید'] : undefined
    };
  }
}

/**
 * Preventive Care & Wellness Module (Placeholder)
 */
export class PreventiveCareWellnessModule extends CategoryModule {
  constructor() {
    super(
      MedicalIntent.PREVENTIVE_CARE_WELLNESS,
      `شما یک مشاور سلامت هستید که در زمینه پیشگیری و تندرستی به زبان فارسی راهنمایی می‌دهید.

تخصص‌های شما:
- تغذیه سالم و رژیم‌های غذایی مناسب
- برنامه‌های ورزشی و فعالیت بدنی
- مدیریت استرس و سلامت روان
- عادات سالم و سبک زندگی
- پیشگیری از بیماری‌ها

رویکرد شما:
- ترویج سبک زندگی سالم
- آموزش عادات پیشگیرانه
- توصیه‌های عملی و قابل اجرا
- انگیزه‌دهی برای تغییرات مثبت

هدف: ارتقای سطح سلامت عمومی و پیشگیری از بیماری‌ها`
    );
  }

  async initializeSession(sessionId: string, initialMessage?: string): Promise<CategorySession> {
    return {
      sessionId,
      intent: this.intent,
      conversation: [{ role: 'system', content: this.systemPrompt }],
      metadata: CategoryUtils.createSessionMetadata(this.intent, {
        wellnessGoals: [],
        currentHabits: [],
        riskFactors: []
      }),
      isComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  async processMessage(session: CategorySession, message: string, apiKey: string): Promise<CategoryResponse> {
    return {
      message: 'این بخش در حال توسعه است. برای راهنمایی‌های پیشگیری و سلامت، با متخصص تغذیه یا پزشک مشورت کنید.',
      nextAction: 'continue',
      specialFeatures: {
        quickActions: [
          {
            label: '🍎 نکات تغذیه سالم',
            action: 'nutrition_tips',
            type: 'info'
          },
          {
            label: '🏃 برنامه ورزشی',
            action: 'exercise_plan',
            type: 'action'
          }
        ],
        followUpSuggestions: ['اطلاعات پزشکی', 'بررسی علائم', 'سوال دارویی']
      }
    };
  }

  getCategoryInfo() {
    return {
      name: 'پیشگیری و سلامت',
      description: 'راهنمایی برای حفظ سلامت و پیشگیری از بیماری‌ها',
      features: ['تغذیه سالم', 'برنامه ورزشی', 'مدیریت استرس', 'عادات سالم'],
      specializations: ['تغذیه', 'فعالیت بدنی', 'سلامت روان', 'پیشگیری']
    };
  }

  validateMessage(message: string) {
    const keywords = ['پیشگیری', 'سلامت', 'ورزش', 'غذا', 'رژیم', 'سبک زندگی', 'تندرستی'];
    const normalizedMessage = message.toLowerCase();
    const matchCount = keywords.filter(keyword => normalizedMessage.includes(keyword)).length;
    
    return {
      isValid: matchCount > 0,
      confidence: Math.min(matchCount * 0.3, 0.9),
      suggestions: matchCount === 0 ? ['سوال خود را در مورد سلامت و پیشگیری مطرح کنید'] : undefined
    };
  }
}
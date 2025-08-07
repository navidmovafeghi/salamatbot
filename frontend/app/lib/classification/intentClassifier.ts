/**
 * Intent Classification System for Unified Medical Chat
 * 
 * Hybrid approach:
 * 1. Rule-based fast classification (keywords, patterns)
 * 2. AI-based contextual classification
 * 3. Confidence scoring and fallback mechanisms
 */

export enum MedicalIntent {
  SYMPTOM_REPORTING = 'symptom_reporting',
  MEDICATION_QUERIES = 'medication_queries', 
  INFORMATION_SEEKING = 'information_seeking',
  CHRONIC_DISEASE_MANAGEMENT = 'chronic_disease_management',
  DIAGNOSTIC_RESULT_INTERPRETATION = 'diagnostic_result_interpretation',
  PREVENTIVE_CARE_WELLNESS = 'preventive_care_wellness'
}

export interface ClassificationResult {
  intent: MedicalIntent;
  confidence: number;
  method: 'rule_based' | 'ai_based' | 'fallback';
  secondaryIntents?: MedicalIntent[];
  reasoning?: string;
}

// Rule-based classification patterns for Persian medical queries
const INTENT_PATTERNS = {
  [MedicalIntent.SYMPTOM_REPORTING]: {
    keywords: [
      // Symptoms
      'درد', 'ناراحتی', 'علامت', 'علائم', 'مشکل', 'احساس', 
      'تب', 'سردرد', 'دل درد', 'معده درد', 'شکم درد',
      'سرفه', 'تنگی نفس', 'خستگی', 'ضعف', 'گیجی',
      'تهوع', 'استفراغ', 'اسهال', 'یبوست', 'ورم',
      'خارش', 'جوش', 'بثورات', 'خونریزی', 'کبودی',
      // Feeling expressions
      'احساس می‌کنم', 'حس می‌کنم', 'به نظرم', 'مثل اینکه',
      // Problem descriptions
      'مشکل دارم', 'ناراحتم', 'درد می‌کشم', 'اذیتم می‌کنه'
    ],
    patterns: [
      /درد.*دارم/,
      /احساس.*می‌کنم/,
      /.*ناراحتم/,
      /علامت.*دارم/,
      /مشکل.*دارم/,
      /.*می‌سوزه/,
      /.*درد می‌کنه/
    ]
  },

  [MedicalIntent.MEDICATION_QUERIES]: {
    keywords: [
      // Medications
      'دارو', 'داروی', 'قرص', 'کپسول', 'شربت', 'آمپول', 'تزریق',
      'آنتی بیوتیک', 'مسکن', 'ضد درد', 'ویتامین', 'مکمل',
      'انسولین', 'فشار خون', 'قلبی', 'آرام بخش',
      // Medication actions
      'بخورم', 'استفاده کنم', 'مصرف کنم', 'تجویز', 'نسخه',
      'عوارض', 'تداخل', 'خطرناک', 'مضر', 'مفید',
      // Dosage
      'دوز', 'مقدار', 'چقدر', 'کی', 'زمان', 'ساعت'
    ],
    patterns: [
      /دارو.*بخورم/,
      /قرص.*مصرف/,
      /.*تجویز.*/,
      /عوارض.*دارو/,
      /تداخل.*دارو/,
      /دوز.*چقدر/,
      /.*با.*دارو/
    ]
  },

  [MedicalIntent.INFORMATION_SEEKING]: {
    keywords: [
      // Question words
      'چیست', 'چی هست', 'یعنی چی', 'یعنی چه', 'چطور', 'چگونه',
      'چرا', 'علت', 'دلیل', 'معنی', 'تعریف', 'توضیح',
      // Learning expressions
      'می‌خوام بدونم', 'می‌خواهم بدانم', 'اطلاع', 'معلومات',
      'یاد بگیرم', 'متوجه بشم', 'بفهمم', 'راجع به', 'در مورد',
      // Medical topics
      'بیماری', 'سندرم', 'اختلال', 'عارضه', 'پیشگیری',
      'تشخیص', 'درمان', 'جراحی', 'عمل', 'روش'
    ],
    patterns: [
      /.*چیست\?*/,
      /.*چی هست\?*/,
      /چطور.*/,
      /چرا.*/,
      /می‌خوام بدونم.*/,
      /راجع به.*/,
      /در مورد.*/,
      /اطلاع.*می‌خوام/
    ]
  },

  [MedicalIntent.CHRONIC_DISEASE_MANAGEMENT]: {
    keywords: [
      // Chronic conditions
      'دیابت', 'قند خون', 'فشار خون', 'هایپرتنشن',
      'آسم', 'آرتریت', 'روماتیسم', 'قلبی', 'عروقی',
      'کلیوی', 'کبدی', 'تیروئید', 'مزمن', 'طولانی مدت',
      // Management terms
      'کنترل', 'مدیریت', 'مراقبت', 'پیگیری', 'نظارت',
      'رژیم', 'ورزش', 'سبک زندگی', 'عادات', 'روزانه',
      'قند', 'انسولین', 'تست', 'اندازه گیری', 'چک'
    ],
    patterns: [
      /دیابت.*دارم/,
      /فشار خون.*دارم/,
      /.*مزمن/,
      /کنترل.*قند/,
      /مدیریت.*/,
      /پیگیری.*/,
      /.*طولانی مدت/
    ]
  },

  [MedicalIntent.DIAGNOSTIC_RESULT_INTERPRETATION]: {
    keywords: [
      // Test types
      'آزمایش', 'تست', 'نتیجه', 'جواب', 'گزارش',
      'خون', 'ادرار', 'مدفوع', 'رادیولوژی', 'سونوگرافی',
      'ام آر آی', 'سی تی', 'ایکو', 'الکتروکاردیوگرام',
      'بیوپسی', 'کشت', 'پاتولوژی', 'رنگ آمیزی',
      // Results terminology
      'نرمال', 'غیرطبیعی', 'بالا', 'پایین', 'مثبت', 'منفی',
      'نتیجه', 'مقدار', 'عدد', 'رنج', 'حد طبیعی'
    ],
    patterns: [
      /نتیجه.*آزمایش/,
      /جواب.*تست/,
      /گزارش.*/,
      /.*نرمال هست/,
      /.*غیرطبیعی/,
      /مقدار.*بالا/,
      /.*درست هست/
    ]
  },

  [MedicalIntent.PREVENTIVE_CARE_WELLNESS]: {
    keywords: [
      // Prevention
      'پیشگیری', 'جلوگیری', 'محافظت', 'مراقبت', 'حفظ سلامتی',
      'سلامت', 'تندرستی', 'بهداشت', 'ایمنی', 'مقاوم',
      // Lifestyle
      'رژیم', 'غذا', 'تغذیه', 'ورزش', 'فعالیت بدنی',
      'خواب', 'استراحت', 'استرس', 'آرامش', 'ریلکس',
      'سیگار', 'الکل', 'مواد مخدر', 'ترک', 'قطع',
      // Wellness
      'سبک زندگی', 'عادت', 'روتین', 'برنامه', 'منظم',
      'بهتر', 'بهبود', 'ارتقا', 'توسعه', 'پیشرفت'
    ],
    patterns: [
      /چطور.*پیشگیری/,
      /جلوگیری.*کنم/,
      /سلامت.*نگه دارم/,
      /بهتر.*باشم/,
      /سبک زندگی.*/,
      /عادت.*خوب/,
      /.*مراقبت کنم/
    ]
  }
};

/**
 * Rule-based classification using keywords and patterns
 */
export function classifyByRules(message: string): ClassificationResult | null {
  const normalizedMessage = message.toLowerCase().trim();
  
  const scores: Record<MedicalIntent, number> = {
    [MedicalIntent.SYMPTOM_REPORTING]: 0,
    [MedicalIntent.MEDICATION_QUERIES]: 0,
    [MedicalIntent.INFORMATION_SEEKING]: 0,
    [MedicalIntent.CHRONIC_DISEASE_MANAGEMENT]: 0,
    [MedicalIntent.DIAGNOSTIC_RESULT_INTERPRETATION]: 0,
    [MedicalIntent.PREVENTIVE_CARE_WELLNESS]: 0
  };

  // Score based on keyword matches
  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    const intentKey = intent as MedicalIntent;
    
    // Keyword scoring
    for (const keyword of config.keywords) {
      if (normalizedMessage.includes(keyword)) {
        scores[intentKey] += 1;
      }
    }
    
    // Pattern scoring (higher weight)
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedMessage)) {
        scores[intentKey] += 2;
      }
    }
  }

  // Find best match
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;

  const bestIntent = Object.entries(scores)
    .find(([_, score]) => score === maxScore)?.[0] as MedicalIntent;

  if (!bestIntent) return null;

  // Calculate confidence based on score and message characteristics
  const totalWords = normalizedMessage.split(' ').length;
  const confidence = Math.min(0.95, (maxScore / totalWords) * 2 + 0.3);

  // Find secondary intents
  const secondaryIntents = Object.entries(scores)
    .filter(([intent, score]) => intent !== bestIntent && score > 0)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([intent]) => intent as MedicalIntent);

  return {
    intent: bestIntent,
    confidence,
    method: 'rule_based',
    secondaryIntents: secondaryIntents.length > 0 ? secondaryIntents : undefined,
    reasoning: `Rule-based classification: ${maxScore} matches found`
  };
}

/**
 * AI-based classification for complex cases
 */
export async function classifyByAI(message: string, apiKey: string): Promise<ClassificationResult> {
  const classificationPrompt = `
You are a medical intent classifier for Persian language queries. Classify the following Persian medical message into exactly ONE of these categories:

1. SYMPTOM_REPORTING - Patient describing physical symptoms, pain, discomfort, or health issues they're experiencing
2. MEDICATION_QUERIES - Questions about medications, drugs, dosage, side effects, interactions
3. INFORMATION_SEEKING - General medical questions, wanting to learn about conditions, treatments, procedures
4. CHRONIC_DISEASE_MANAGEMENT - Managing ongoing conditions like diabetes, hypertension, heart disease
5. DIAGNOSTIC_RESULT_INTERPRETATION - Questions about test results, lab values, medical reports
6. PREVENTIVE_CARE_WELLNESS - Prevention, lifestyle, diet, exercise, wellness, healthy habits

Message: "${message}"

Respond with ONLY a JSON object in this exact format:
{
  "intent": "category_name",
  "confidence": 0.85,
  "reasoning": "Brief explanation in Persian"
}

Do not include any other text or explanation.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://salamatbot.ir',
        'X-Title': 'SalamatBot Intent Classification'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: classificationPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
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

    // Parse AI response
    const aiResult = JSON.parse(content);
    
    return {
      intent: aiResult.intent as MedicalIntent,
      confidence: Math.min(Math.max(aiResult.confidence, 0.1), 0.95),
      method: 'ai_based',
      reasoning: aiResult.reasoning
    };

  } catch (error) {
    console.error('AI Classification Error:', error);
    
    // Fallback to general symptom reporting
    return {
      intent: MedicalIntent.SYMPTOM_REPORTING,
      confidence: 0.4,
      method: 'fallback',
      reasoning: 'AI classification failed, defaulting to symptom reporting'
    };
  }
}

/**
 * Main classification function - hybrid approach
 */
export async function classifyIntent(
  message: string, 
  apiKey?: string
): Promise<ClassificationResult> {
  // First try rule-based classification
  const ruleResult = classifyByRules(message);
  
  if (ruleResult && ruleResult.confidence >= 0.7) {
    return ruleResult;
  }
  
  // If rule-based is uncertain or failed, try AI classification
  if (apiKey) {
    try {
      const aiResult = await classifyByAI(message, apiKey);
      
      // If we have both results, combine them intelligently
      if (ruleResult && aiResult.intent === ruleResult.intent) {
        return {
          ...aiResult,
          confidence: Math.min(0.95, (ruleResult.confidence + aiResult.confidence) / 2 + 0.1),
          method: 'rule_based',
          reasoning: `Both rule-based and AI agreed on ${aiResult.intent}`
        };
      }
      
      return aiResult;
    } catch (error) {
      console.error('AI classification failed:', error);
    }
  }
  
  // Final fallback
  return ruleResult || {
    intent: MedicalIntent.SYMPTOM_REPORTING,
    confidence: 0.3,
    method: 'fallback',
    reasoning: 'All classification methods failed, defaulting to symptom reporting'
  };
}

/**
 * Get user-friendly category name in Persian
 */
export function getCategoryDisplayName(intent: MedicalIntent): string {
  const names = {
    [MedicalIntent.SYMPTOM_REPORTING]: 'بررسی علائم',
    [MedicalIntent.MEDICATION_QUERIES]: 'سوالات دارویی',
    [MedicalIntent.INFORMATION_SEEKING]: 'کسب اطلاعات پزشکی',
    [MedicalIntent.CHRONIC_DISEASE_MANAGEMENT]: 'مدیریت بیماری‌های مزمن',
    [MedicalIntent.DIAGNOSTIC_RESULT_INTERPRETATION]: 'تفسیر نتایج آزمایش',
    [MedicalIntent.PREVENTIVE_CARE_WELLNESS]: 'پیشگیری و سلامت'
  };
  
  return names[intent] || intent;
}
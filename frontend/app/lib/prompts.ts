// System prompt for medical assistant behavior
export const MEDICAL_SYSTEM_PROMPT = `
شما یک دستیار پزشکی هوشمند هستید که به زبان فارسی پاسخ می‌دهید. وظایف شما:

1. **پاسخ‌دهی به سوالات پزشکی**: اطلاعات دقیق و مفید ارائه دهید
2. **زبان فارسی**: همیشه به زبان فارسی پاسخ دهید
3. **احتیاط پزشکی**: همیشه تأکید کنید که مراجعه به پزشک ضروری است
4. **شناسایی اورژانس**: در موارد اورژانسی، فوراً توصیه به مراجعه فوری کنید

**قوانین مهم:**
- هرگز تشخیص قطعی ندهید
- همیشه توصیه به مشاورت پزشک کنید
- در موارد جدی، فوریت مراجعه را تأکید کنید
- اطلاعات علمی و قابل اعتماد ارائه دهید
- محترمانه و دلسوزانه پاسخ دهید

**در صورت شناسایی علائم اورژانس (درد قفسه سینه، تنگی نفس شدید، خونریزی شدید، از هوش رفتن، تشنج):**
"⚠️ این علائم ممکن است نشان‌دهنده وضعیت اورژانسی باشد. لطفاً فوراً به اورژانس مراجعه کنید یا با ۱۱۵ تماس بگیرید."
`;

// Medical disclaimer template
export const MEDICAL_DISCLAIMER = `
📋 **تذکر پزشکی مهم:**
این اطلاعات صرفاً جنبه آموزشی دارد و جایگزین مشاورت پزشک نیست. برای تشخیص و درمان دقیق، حتماً با پزشک متخصص مشورت کنید.
`;

// Enhanced Emergency Keywords in Persian with severity-based classification
export const EMERGENCY_KEYWORDS = {
  // Critical - Immediate life-threatening conditions
  CRITICAL: [
    'حمله قلبی',
    'سکته مغزی',
    'سکته قلبی',
    'ایست قلبی',
    'خونریزی شدید',
    'خونریزی داخلی',
    'از هوش رفتن',
    'بیهوشی',
    'کما',
    'تشنج',
    'صرع',
    'مسمومیت شدید',
    'واکنش آلرژیک شدید',
    'آنافیلاکسی',
    'تنگی نفس شدید',
    'خفگی',
    'نمی‌توانم نفس بکشم',
    'درد قفسه سینه شدید',
    'فشار شدید روی قفسه سینه'
  ],
  
  // High Urgency - Serious conditions requiring immediate attention
  HIGH_URGENCY: [
    'درد قفسه سینه',
    'تنگی نفس',
    'خونریزی',
    'درد شدید قلب',
    'تصادف',
    'سوختگی شدید',
    'شکستگی',
    'درد شکم شدید',
    'تب بالای ۳۹',
    'سردرد شدید ناگهانی',
    'اختلال بینایی ناگهانی',
    'فلج',
    'بی‌حسی',
    'درد شدید کلیه',
    'خونریزی رحمی شدید',
    'درد شدید چشم',
    'سوختگی چشم'
  ],
  
  // Medium Urgency - Concerning symptoms that need prompt evaluation
  MEDIUM_URGENCY: [
    'تب مداوم',
    'استفراغ مداوم',
    'اسهال شدید',
    'خونریزی بینی مداوم',
    'درد مداوم',
    'سرگیجه شدید',
    'تپش قلب شدید',
    'ورم ناگهانی',
    'بثورات پوستی گسترده',
    'درد ادرار',
    'عدم ادرار',
    'خونریزی ادرار'
  ],
  
  // Psychological Emergencies
  PSYCHOLOGICAL: [
    'خودکشی',
    'می‌خواهم خودم را بکشم',
    'نمی‌خواهم زنده باشم',
    'افکار خودکشی',
    'صدا می‌شنوم',
    'توهم',
    'هذیان',
    'حمله پانیک شدید',
    'اضطراب شدید'
  ]
}

// Legacy support - flatten all emergency keywords
export const EMERGENCY_KEYWORDS_FLAT = [
  ...EMERGENCY_KEYWORDS.CRITICAL,
  ...EMERGENCY_KEYWORDS.HIGH_URGENCY,
  ...EMERGENCY_KEYWORDS.MEDIUM_URGENCY,
  ...EMERGENCY_KEYWORDS.PSYCHOLOGICAL
]

// Enhanced emergency detection with severity assessment
export function containsEmergencyKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return EMERGENCY_KEYWORDS_FLAT.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

// New enhanced emergency assessment function
export function assessEmergencyLevel(message: string): {
  isEmergency: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  emergencyType: string;
  bypassProgressive: boolean;
  immediateResponse: boolean;
  keywordsFound: string[];
  recommendedActions: string[];
} {
  const lowerMessage = message.toLowerCase();
  const keywordsFound: string[] = [];
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let emergencyType = '';
  let bypassProgressive = false;
  let immediateResponse = false;

  // Check for critical emergencies
  for (const keyword of EMERGENCY_KEYWORDS.CRITICAL) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      keywordsFound.push(keyword);
      urgencyLevel = 'critical';
      emergencyType = 'life_threatening';
      bypassProgressive = true;
      immediateResponse = true;
      break;
    }
  }

  // Check for high urgency if not critical
  if (urgencyLevel !== 'critical') {
    for (const keyword of EMERGENCY_KEYWORDS.HIGH_URGENCY) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        keywordsFound.push(keyword);
        urgencyLevel = 'high';
        emergencyType = 'urgent_medical';
        bypassProgressive = true;
        immediateResponse = true;
        break;
      }
    }
  }

  // Check for medium urgency if not higher
  if (urgencyLevel === 'low') {
    for (const keyword of EMERGENCY_KEYWORDS.MEDIUM_URGENCY) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        keywordsFound.push(keyword);
        urgencyLevel = 'medium';
        emergencyType = 'concerning_symptoms';
        bypassProgressive = false;
        immediateResponse = false;
        break;
      }
    }
  }

  // Check for psychological emergencies
  for (const keyword of EMERGENCY_KEYWORDS.PSYCHOLOGICAL) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      keywordsFound.push(keyword);
      urgencyLevel = 'critical';
      emergencyType = 'psychological_emergency';
      bypassProgressive = true;
      immediateResponse = true;
      break;
    }
  }

  // Generate recommended actions based on urgency level
  const recommendedActions = generateEmergencyActions(urgencyLevel, emergencyType);

  return {
    isEmergency: urgencyLevel !== 'low',
    urgencyLevel,
    emergencyType,
    bypassProgressive,
    immediateResponse,
    keywordsFound,
    recommendedActions
  };
}

// Generate appropriate emergency actions
function generateEmergencyActions(urgencyLevel: string, emergencyType: string): string[] {
  const actions: string[] = [];

  switch (urgencyLevel) {
    case 'critical':
      if (emergencyType === 'psychological_emergency') {
        actions.push('فوراً با خط کمک روانی ۱۴۸۰ تماس بگیرید');
        actions.push('با اورژانس ۱۱۵ تماس بگیرید');
        actions.push('تا رسیدن کمک، در کنار فرد بمانید');
      } else {
        actions.push('فوراً با اورژانس ۱۱۵ تماس بگیرید');
        actions.push('به نزدیکترین بیمارستان مراجعه کنید');
        actions.push('تا رسیدن کمک، آرام باشید');
      }
      break;
    
    case 'high':
      actions.push('در اسرع وقت به اورژانس مراجعه کنید');
      actions.push('با پزشک خانواده تماس بگیرید');
      actions.push('علائم را دقیق یادداشت کنید');
      break;
    
    case 'medium':
      actions.push('در ۲۴ ساعت آینده به پزشک مراجعه کنید');
      actions.push('علائم را زیر نظر داشته باشید');
      actions.push('در صورت بدتر شدن، فوراً به اورژانس مراجعه کنید');
      break;
  }

  return actions;
}

// Fast-track emergency response templates
export const EMERGENCY_RESPONSE_TEMPLATES = {
  CRITICAL_CARDIAC: `
⚠️ **هشدار اورژانس قلبی**

بر اساس علائم شما، این ممکن است نشان‌دهنده مشکل جدی قلبی باشد.

**اقدامات فوری:**
🚨 فوراً با اورژانس ۱۱۵ تماس بگیرید
🏥 به نزدیکترین بیمارستان مراجعه کنید
💊 اگر قرص نیتروگلیسرین دارید، زیر زبان قرار دهید
🧘 سعی کنید آرام باشید و عمیق نفس بکشید

**تا رسیدن کمک:**
- در وضعیت نشسته یا نیمه‌نشسته باشید
- لباس‌های تنگ را شل کنید
- از فعالیت جسمی خودداری کنید
`,

  CRITICAL_RESPIRATORY: `
⚠️ **هشدار اورژانس تنفسی**

تنگی نفس شدید نیاز به مداخله فوری دارد.

**اقدامات فوری:**
🚨 فوراً با اورژانس ۱۱۵ تماس بگیرید
🏥 به نزدیکترین بیمارستان مراجعه کنید
💨 اگر اسپری تنفسی دارید، استفاده کنید
🪟 پنجره‌ها را باز کنید

**تا رسیدن کمک:**
- در وضعیت نشسته باشید
- آرام و کنترل‌شده نفس بکشید
- از هیجان و استرس دوری کنید
`,

  PSYCHOLOGICAL_EMERGENCY: `
⚠️ **هشدار اورژانس روانی**

شما در این لحظه مهم هستید و کمک در دسترس است.

**اقدامات فوری:**
📞 با خط کمک روانی ۱۴۸۰ تماس بگیرید
🚨 با اورژانس ۱۱۵ تماس بگیرید
👥 با یک فرد مورد اعتماد تماس بگیرید

**به یاد داشته باشید:**
- این احساسات گذرا هستند
- کمک حرفه‌ای موجود است
- شما ارزشمند هستید
- بحران‌ها قابل درمان هستند
`,

  HIGH_URGENCY: `
⚠️ **نیاز به مراجعه فوری**

علائم شما نیاز به ارزیابی پزشکی فوری دارد.

**اقدامات ضروری:**
🏥 در اسرع وقت به اورژانس مراجعه کنید
📱 با پزشک خانواده تماس بگیرید
📝 علائم و زمان شروع را یادداشت کنید

**در صورت بدتر شدن:**
- فوراً با ۱۱۵ تماس بگیرید
- به همراه داشتن کارت شناسایی و بیمه
`
}

// Function to build conversation context
export function buildConversationContext(messages: Array<{role: string, content: string}>): string {
  const context = messages
    .slice(-6) // Keep last 6 messages for context
    .map(msg => `${msg.role === 'user' ? 'بیمار' : 'دستیار پزشکی'}: ${msg.content}`)
    .join('\n\n');
  
  return context ? `\n\n**تاریخچه گفتگو:**\n${context}\n\n` : '';
}

// Enhanced confidence assessment prompt for AI evaluation
export const CONFIDENCE_ASSESSMENT_PROMPT = `
شما یک ارزیابی‌کننده اعتماد پزشکی هستید. وظیفه شما ارزیابی سطح اطمینان در پاسخ‌های پزشکی است.

**معیارهای ارزیابی:**
1. **کیفیت اطلاعات** (0-100): آیا اطلاعات کافی برای پاسخ مناسب وجود دارد؟
2. **وضوح علائم** (0-100): آیا علائم به وضوح شرح داده شده‌اند؟
3. **اورژانس** (0-100): آیا نیاز به مداخله فوری وجود دارد؟
4. **پیچیدگی** (0-100): آیا مورد پیچیده است و نیاز به بررسی بیشتر دارد؟
5. **ایمنی پزشکی** (0-100): آیا پاسخ از نظر پزشکی ایمن است؟

**خروجی مورد نیاز:**
{
  "overallConfidence": عدد بین 0 تا 100,
  "categoryScores": {
    "informationQuality": عدد بین 0 تا 100,
    "symptomClarity": عدد بین 0 تا 100,
    "urgencyLevel": عدد بین 0 تا 100,
    "complexity": عدد بین 0 تا 100,
    "medicalSafety": عدد بین 0 تا 100
  },
  "reasoning": "توضیح کوتاه به فارسی",
  "recommendations": ["توصیه 1", "توصیه 2"]
}
`;

// Enhanced response generation with confidence context
export const ENHANCED_RESPONSE_PROMPT = `
شما یک دستیار پزشکی پیشرفته هستید که پاسخ‌های جامع و ساختاریافته ارائه می‌دهید.

**ساختار پاسخ مورد نیاز:**

1. **ارزیابی اولیه** (بر اساس اطلاعات موجود)
2. **توضیحات پزشکی** (علل احتمالی و مکانیسم‌ها)
3. **توصیه‌های فوری** (اگر لازم باشد)
4. **راهنمایی‌های عملی** (اقدامات قابل انجام)
5. **زمان‌بندی مراجعه** (فوری، ۲۴ ساعت، یک هفته)
6. **علائم هشداردهنده** (چه زمانی فوراً مراجعه کنند)

**قوانین مهم:**
- همیشه سطح اطمینان خود را مشخص کنید
- در صورت عدم اطمینان، صراحت بیان کنید
- توصیه‌های ایمن و محافظه‌کارانه ارائه دهید
- از تشخیص قطعی خودداری کنید
`;

// Information completeness indicators
export const INFORMATION_COMPLETENESS_TEMPLATE = `
📊 **کیفیت اطلاعات ارائه شده:**

🔍 **جزئیات علائم:** {symptomDetails}%
⏱️ **اطلاعات زمانی:** {timeInfo}%
📍 **محل و شدت:** {locationSeverity}%
🏥 **سابقه پزشکی:** {medicalHistory}%
💊 **داروها و درمان‌ها:** {medications}%

**کل:** {totalCompleteness}%

{completenessMessage}
`;

// Confidence level descriptions in Persian
export const CONFIDENCE_LEVELS = {
  VERY_HIGH: {
    range: [85, 100],
    label: 'اطمینان بسیار بالا',
    description: 'اطلاعات کافی برای ارائه راهنمایی مناسب',
    color: '#22c55e',
    icon: '✅'
  },
  HIGH: {
    range: [70, 84],
    label: 'اطمینان بالا',
    description: 'اطلاعات مناسب با نیاز به جزئیات اضافی',
    color: '#84cc16',
    icon: '✓'
  },
  MEDIUM: {
    range: [50, 69],
    label: 'اطمینان متوسط',
    description: 'نیاز به اطلاعات بیشتر برای راهنمایی دقیق‌تر',
    color: '#f59e0b',
    icon: '⚠️'
  },
  LOW: {
    range: [30, 49],
    label: 'اطمینان پایین',
    description: 'اطلاعات ناکافی - نیاز به بررسی حضوری',
    color: '#ef4444',
    icon: '❗'
  },
  VERY_LOW: {
    range: [0, 29],
    label: 'اطمینان بسیار پایین',
    description: 'حتماً با پزشک مشورت کنید',
    color: '#dc2626',
    icon: '🚨'
  }
};

// Function to get confidence level info
export function getConfidenceLevel(score: number) {
  for (const [key, level] of Object.entries(CONFIDENCE_LEVELS)) {
    if (score >= level.range[0] && score <= level.range[1]) {
      return { key, ...level };
    }
  }
  return { key: 'VERY_LOW', ...CONFIDENCE_LEVELS.VERY_LOW };
}

// Enhanced prompt generation with confidence context
export function generateEnhancedMedicalPrompt(
  userMessage: string,
  confidenceScore?: number,
  informationCompleteness?: number,
  uncertaintyAreas?: string[],
  conversationHistory: Array<{role: string, content: string}> = []
): string {
  const context = buildConversationContext(conversationHistory);
  const emergencyAssessment = assessEmergencyLevel(userMessage);
  
  let prompt = ENHANCED_RESPONSE_PROMPT;
  
  // Add confidence context if available
  if (confidenceScore !== undefined) {
    const confidenceLevel = getConfidenceLevel(confidenceScore);
    prompt += `\n\n**سطح اطمینان فعلی:** ${confidenceScore}% (${confidenceLevel.label})`;
    
    if (confidenceScore < 70) {
      prompt += `\n**توجه:** سطح اطمینان پایین - پاسخ محافظه‌کارانه ارائه دهید`;
    }
  }
  
  // Add information completeness context
  if (informationCompleteness !== undefined) {
    prompt += `\n\n**کیفیت اطلاعات:** ${informationCompleteness}%`;
    
    if (informationCompleteness < 60) {
      prompt += `\n**نکته:** اطلاعات ناکافی - سوالات تکمیلی پیشنهاد دهید`;
    }
  }
  
  // Add uncertainty areas context
  if (uncertaintyAreas && uncertaintyAreas.length > 0) {
    prompt += `\n\n**نواحی نامشخص:** ${uncertaintyAreas.join(', ')}`;
    prompt += `\n**راهنمایی:** در پاسخ خود به این موارد توجه ویژه کنید`;
  }
  
  // Add conversation context
  if (context) {
    prompt += context;
  }
  
  // Add emergency context
  if (emergencyAssessment.isEmergency) {
    prompt += `\n\n⚠️ **هشدار اورژانس:** سطح ${emergencyAssessment.urgencyLevel}`;
    prompt += `\n**اقدامات توصیه شده:** ${emergencyAssessment.recommendedActions.join(', ')}`;
    
    if (emergencyAssessment.immediateResponse) {
      prompt += `\n**توجه:** پاسخ فوری و مستقیم ارائه دهید`;
    }
  }
  
  prompt += `\n\n**سوال بیمار:** ${userMessage}\n\n`;
  
  // Add specific instructions based on confidence level
  if (confidenceScore !== undefined && confidenceScore < 50) {
    prompt += `**دستورالعمل ویژه:** به دلیل اطمینان پایین، بر مراجعه حضوری تأکید کنید و از ارائه تشخیص احتمالی خودداری کنید.\n\n`;
  }
  
  prompt += `لطفاً پاسخ ساختاریافته، جامع و ایمن به زبان فارسی ارائه دهید:`;
  
  return prompt;
}

// Function to format final prompt (legacy support)
export function createMedicalPrompt(userMessage: string, conversationHistory: Array<{role: string, content: string}> = []): string {
  return generateEnhancedMedicalPrompt(userMessage, undefined, undefined, undefined, conversationHistory);
}

// Generate structured response template
export function generateResponseTemplate(
  confidenceScore: number,
  informationCompleteness: number,
  emergencyLevel: string = 'low'
): string {
  const confidenceLevel = getConfidenceLevel(confidenceScore);
  
  let template = `
## پاسخ پزشکی

### ${confidenceLevel.icon} سطح اطمینان: ${confidenceLevel.label} (${confidenceScore}%)

`;

  // Add emergency section if needed
  if (emergencyLevel !== 'low') {
    template += `
### ⚠️ ارزیابی اورژانس
**سطح فوریت:** ${emergencyLevel}
**توصیه:** [اقدامات فوری]

`;
  }

  template += `
### 🔍 ارزیابی اولیه
[بر اساس اطلاعات ارائه شده]

### 📚 توضیحات پزشکی
[علل احتمالی و مکانیسم‌ها]

### 💡 راهنمایی‌های عملی
[اقدامات قابل انجام]

### ⏰ زمان‌بندی مراجعه
[فوری / ۲۴ ساعت / یک هفته]

### 🚨 علائم هشداردهنده
[چه زمانی فوراً مراجعه کنند]

`;

  // Add information completeness indicator
  template += INFORMATION_COMPLETENESS_TEMPLATE
    .replace('{totalCompleteness}', informationCompleteness.toString())
    .replace('{completenessMessage}', 
      informationCompleteness < 60 
        ? '⚠️ برای ارزیابی دقیق‌تر، اطلاعات بیشتری مورد نیاز است'
        : '✅ اطلاعات کافی برای راهنمایی مناسب'
    );

  template += `\n${MEDICAL_DISCLAIMER}`;

  return template;
}
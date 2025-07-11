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

// Emergency keywords in Persian
export const EMERGENCY_KEYWORDS = [
  'درد قفسه سینه',
  'تنگی نفس',
  'خونریزی',
  'از هوش رفتن',
  'بیهوشی',
  'تشنج',
  'درد شدید قلب',
  'حمله قلبی',
  'سکته',
  'تصادف',
  'سوختگی شدید',
  'مسمومیت',
  'خودکشی',
  'درد شکم شدید',
  'تب بالا',
  'سردرد شدید ناگهانی'
];

// Function to check for emergency keywords
export function containsEmergencyKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

// Function to build conversation context
export function buildConversationContext(messages: Array<{role: string, content: string}>): string {
  const context = messages
    .slice(-6) // Keep last 6 messages for context
    .map(msg => `${msg.role === 'user' ? 'بیمار' : 'دستیار پزشکی'}: ${msg.content}`)
    .join('\n\n');
  
  return context ? `\n\n**تاریخچه گفتگو:**\n${context}\n\n` : '';
}

// Function to format final prompt
export function createMedicalPrompt(userMessage: string, conversationHistory: Array<{role: string, content: string}> = []): string {
  const context = buildConversationContext(conversationHistory);
  const isEmergency = containsEmergencyKeywords(userMessage);
  
  let prompt = MEDICAL_SYSTEM_PROMPT;
  
  if (context) {
    prompt += context;
  }
  
  prompt += `\n\n**سوال جدید بیمار:** ${userMessage}\n\n`;
  
  if (isEmergency) {
    prompt += `⚠️ **هشدار:** این پیام ممکن است حاوی علائم اورژانسی باشد. در پاسخ خود اولویت را به توصیه مراجعه فوری دهید.\n\n`;
  }
  
  prompt += `لطفاً پاسخ جامع، دقیق و به زبان فارسی ارائه دهید:`;
  
  return prompt;
}
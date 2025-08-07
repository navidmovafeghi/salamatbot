/**
 * Medical Triage Classification Templates
 * 
 * Cost-optimized system: Hardcoded UI templates + LLM-generated medical content
 * Reduces token usage by 60-70% while maintaining quality
 */

export interface TriageTemplate {
  header: string
  cssClass: string
  primaryAction?: string
  actionButtons: Array<{
    type: string
    label: string
    phone?: string
    style: string
  }>
  sections: Array<{
    key: string
    title: string
    icon: string
    cssClass?: string
  }>
  disclaimer: string
}

export interface TriageClassification {
  category: 'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT' | 'SELF_CARE'
  template: TriageTemplate
  content?: Record<string, string>
}

export const CLASSIFICATION_TEMPLATES: Record<string, TriageTemplate> = {
  EMERGENCY: {
    header: "طبقه‌بندی تریاژ: فوریت (قرمز)",
    cssClass: "emergency",
    actionButtons: [
      {
        type: "call",
        label: "تماس با آمبولانس",
        phone: "115",
        style: "emergency-call-btn"
      }
    ],
    sections: [
      {
        key: "comprehensive_assessment",
        title: "ارزیابی کامل",
        icon: "🏥"
      },
      {
        key: "immediate_actions", 
        title: "اقدامات فوری - همین الان انجام دهید",
        icon: "🚨",
        cssClass: "immediate-actions-section"
      },
      {
        key: "emergency_instructions",
        title: "دستورالعمل اضطراری",
        icon: "📞"
      }
    ],
    disclaimer: "این ارزیابی تشخیص پزشکی نیست. فوراً با اورژانس تماس بگیرید."
  },

  URGENT: {
    header: "طبقه‌بندی تریاژ: عاجل (نارنجی)",
    cssClass: "urgent", 
    primaryAction: "ظرف چند ساعت به اورژانس مراجعه کنید",
    actionButtons: [],
    sections: [
      {
        key: "comprehensive_assessment",
        title: "ارزیابی کامل",
        icon: "🏥"
      },
      {
        key: "next_steps",
        title: "مراحل بعدی", 
        icon: "➡️"
      },
      {
        key: "timeframe_details",
        title: "زمان‌بندی",
        icon: "⏰"
      },
      {
        key: "preparation_guidance",
        title: "آماده‌سازی برای مراجعه",
        icon: "🎒"
      }
    ],
    disclaimer: "این ارزیابی تشخیص پزشکی نیست. برای مراقبت فوری با متخصصان بهداشت مشورت کنید."
  },

  SEMI_URGENT: {
    header: "طبقه‌بندی تریاژ: نیمه عاجل (زرد)",
    cssClass: "semi-urgent",
    primaryAction: "ظرف ۲۴-۴۸ ساعت به پزشک مراجعه کنید", 
    actionButtons: [],
    sections: [
      {
        key: "comprehensive_assessment",
        title: "ارزیابی کامل",
        icon: "🏥"
      },
      {
        key: "scheduling_advice",
        title: "راهنمای زمان‌بندی",
        icon: "📅"
      },
      {
        key: "monitoring_instructions", 
        title: "علائم قابل نظارت",
        icon: "👀"
      },
      {
        key: "interim_management",
        title: "مراقبت موقت",
        icon: "🏠"
      }
    ],
    disclaimer: "این ارزیابی تشخیص پزشکی نیست. برای مراقبت مناسب با متخصصان بهداشت مشورت کنید."
  },

  NON_URGENT: {
    header: "طبقه‌بندی تریاژ: غیرعاجل (سبز)",
    cssClass: "non-urgent",
    primaryAction: "مراقبت پزشکی معمولی را برنامه‌ریزی کنید",
    actionButtons: [],
    sections: [
      {
        key: "comprehensive_assessment", 
        title: "ارزیابی کامل",
        icon: "🏥"
      },
      {
        key: "scheduling_recommendations",
        title: "گزینه‌های زمان‌بندی",
        icon: "📋"
      },
      {
        key: "self_management",
        title: "خودمراقبتی موقت", 
        icon: "💊"
      },
      {
        key: "escalation_guidelines",
        title: "معیارهای تشدید",
        icon: "⚠️"
      }
    ],
    disclaimer: "این ارزیابی تشخیص پزشکی نیست. برای مراقبت مناسب با متخصصان بهداشت مشورت کنید."
  },

  SELF_CARE: {
    header: "طبقه‌بندی تریاژ: خودمراقبتی (آبی)",
    cssClass: "self-care",
    primaryAction: "احتمالاً قابل مدیریت در خانه است",
    actionButtons: [],
    sections: [
      {
        key: "comprehensive_assessment",
        title: "ارزیابی کامل", 
        icon: "🏥"
      },
      {
        key: "home_treatment",
        title: "درمان‌های خانگی",
        icon: "🏡"
      },
      {
        key: "monitoring_guidelines",
        title: "برنامه نظارت",
        icon: "📊"
      },
      {
        key: "warning_indicators",
        title: "علائم هشداردهنده",
        icon: "🚨"
      },
      {
        key: "prevention_advice",
        title: "نکات پیشگیری",
        icon: "🛡️"
      }
    ],
    disclaimer: "این ارزیابی تشخیص پزشکی نیست. در صورت تشدید علائم با متخصصان بهداشت مشورت کنید."
  }
};

// Helper function to get template by category
export function getTriageTemplate(category: string): TriageTemplate | null {
  return CLASSIFICATION_TEMPLATES[category] || null;
}

// Helper function to get all available categories
export function getAvailableCategories(): string[] {
  return Object.keys(CLASSIFICATION_TEMPLATES);
}
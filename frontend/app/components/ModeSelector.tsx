'use client'

import React from 'react';

export type ChatMode = 'legacy' | 'triage';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <div className="mode-selector-header">
        <h3>نوع مشاورت را انتخاب کنید</h3>
        <p>برای بهترین نتیجه، مناسب‌ترین حالت را انتخاب کنید</p>
      </div>
      
      <div className="mode-options">
        {/* Legacy Mode - General Chat */}
        <div 
          className={`mode-option ${currentMode === 'legacy' ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onModeChange('legacy')}
        >
          <div className="mode-icon">
            <i className="fa-solid fa-comments"></i>
          </div>
          <div className="mode-content">
            <h4>گفتگوی عمومی</h4>
            <p>مشاورت کلی پزشکی و پاسخ به سوالات متنوع</p>
            <ul>
              <li>سوالات پزشکی عمومی</li>
              <li>اطلاعات سلامتی</li>
              <li>راهنمایی‌های کلی</li>
            </ul>
          </div>
          <div className="mode-provider">
            <span>Google Gemini</span>
          </div>
        </div>

        {/* Triage Mode - Symptom Checking */}
        <div 
          className={`mode-option ${currentMode === 'triage' ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && onModeChange('triage')}
        >
          <div className="mode-icon">
            <i className="fa-solid fa-stethoscope"></i>
          </div>
          <div className="mode-content">
            <h4>بررسی علائم (تریاژ)</h4>
            <p>ارزیابی علائم و تعیین سطح فوریت مراجعه</p>
            <ul>
              <li>طبقه‌بندی ۵ سطحه فوریت</li>
              <li>راهنمایی مرحله‌ای</li>
              <li>تصمیم‌گیری هوشمند</li>
            </ul>
            <div className="mode-badge">
              <i className="fa-solid fa-zap"></i>
              <span>بهینه‌سازی شده</span>
            </div>
          </div>
          <div className="mode-provider">
            <span>OpenAI GPT-4o</span>
          </div>
        </div>
      </div>

      <div className="mode-selector-footer">
        <div className="safety-note">
          <i className="fa-solid fa-shield-heart"></i>
          <span>
            در هر دو حالت، در صورت وضعیت اورژانسی فوراً با ۱۱۵ تماس بگیرید
          </span>
        </div>
      </div>
    </div>
  );
}
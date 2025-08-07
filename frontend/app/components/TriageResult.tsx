'use client'

import React from 'react';
import { TriageTemplate } from '@/app/lib/triageTemplates';

interface TriageResultProps {
  classification: string;
  template: TriageTemplate;
  finalResponse: Record<string, string>;
  disclaimer?: string;
  onNewSession: () => void;
}

export default function TriageResult({ 
  classification, 
  template, 
  finalResponse, 
  disclaimer,
  onNewSession 
}: TriageResultProps) {
  
  const handleEmergencyCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const formatContent = (content: string) => {
    // Handle <br> tags and basic formatting
    return content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <div className={`triage-result ${template.cssClass}`}>
      {/* Header */}
      <div className="triage-header">
        <h2>{template.header}</h2>
        {template.primaryAction && (
          <div className="primary-action">
            <strong>{template.primaryAction}</strong>
          </div>
        )}
      </div>

      {/* Emergency Action Buttons */}
      {template.actionButtons.length > 0 && (
        <div className="action-buttons">
          {template.actionButtons.map((button, index) => (
            <button
              key={index}
              className={`action-btn ${button.style}`}
              onClick={() => button.phone && handleEmergencyCall(button.phone)}
            >
              <i className="fa-solid fa-phone"></i>
              {button.label}
              {button.phone && <span className="phone-number">{button.phone}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Content Sections */}
      <div className="triage-content">
        {template.sections.map((section) => {
          const content = finalResponse[section.key];
          if (!content) return null;

          return (
            <div key={section.key} className={`content-section ${section.cssClass || ''}`}>
              <h3>
                <span className="section-icon">{section.icon}</span>
                {section.title}
              </h3>
              <div 
                className="section-content"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(content) 
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Medical Disclaimer */}
      <div className="medical-disclaimer">
        <div className="disclaimer-content">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <div>
            <strong>تذکر پزشکی:</strong>
            <p>{template.disclaimer}</p>
            {disclaimer && (
              <p className="additional-disclaimer">{disclaimer}</p>
            )}
          </div>
        </div>
      </div>

      {/* New Session Button */}
      <div className="triage-actions">
        <button className="new-session-btn" onClick={onNewSession}>
          <i className="fa-solid fa-refresh"></i>
          بررسی علائم جدید
        </button>
      </div>
    </div>
  );
}
'use client'
import React, { useState } from 'react';
import './HelpPage.css';
import { useLanguage } from '@/contexts/LanguageContext';

const FAQ_ITEMS = [
  { questionKey: 'help.faq_q1', answerKey: 'help.faq_a1' },
  { questionKey: 'help.faq_q2', answerKey: 'help.faq_a2' },
  { questionKey: 'help.faq_q3', answerKey: 'help.faq_a3' },
  { questionKey: 'help.faq_q6', answerKey: 'help.faq_a6' },
  { questionKey: 'help.faq_q4', answerKey: 'help.faq_a4' },
  { questionKey: 'help.faq_q7', answerKey: 'help.faq_a7' },
  { questionKey: 'help.faq_q5', answerKey: 'help.faq_a5' },
];

export default function HelpPage() {
  const { t } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="help-page">
      <div className="hero-section">
        <div className="hero-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 17H12.01M12 14C12.8906 12.0938 15 12.2344 15 10C15 8.5 14 7 12 7C10.4521 7 9.50325 7.89844 9.15332 9M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" />
          </svg>
        </div>
        <h1 className="hero-title">{t('help.hero_title')}</h1>
        <p className="hero-subtitle">{t('help.hero_subtitle')}</p>
      </div>

      <div className="faq-section">
        {FAQ_ITEMS.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div key={item.questionKey} className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className="faq-header"
                onClick={() => toggleFaq(index)}
                aria-expanded={isExpanded}
              >
                <span className="faq-question">{t(item.questionKey)}</span>
                <svg className="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div className="faq-content">
                <p className="faq-answer">{t(item.answerKey)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="quick-links">
        <div className="quick-links-title">{t('help.quick_links')}</div>

        <a href="#" className="quick-link">
          <div className="quick-link-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <span className="quick-link-text">{t('help.pricing')}</span>
        </a>

        <a href="https://dochub.run" target="_blank" rel="noreferrer" className="quick-link">
          <div className="quick-link-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <span className="quick-link-text">{t('help.instructions')}</span>
        </a>

        <a href="#" className="quick-link">
          <div className="quick-link-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <span className="quick-link-text">{t('help.privacy')}</span>
        </a>
      </div>

      <div className="cta-section">
        <div className="cta-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </div>
        <h2 className="cta-title">{t('help.cta_title')}</h2>
        <p className="cta-description">{t('help.cta_description')}</p>
        <a href="https://t.me/opengater_support" className="cta-button" target="_blank" rel="noreferrer">
          {t('help.contact_support')}
        </a>
      </div>
    </div>
  );
}

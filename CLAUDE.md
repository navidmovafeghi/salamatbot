# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SalamatBot** is a sophisticated Persian medical chatbot focused on **symptom checking and medical triage**. The application features a **dual-mode system**: a cost-optimized triage mode for symptom classification and a legacy general chat mode. The primary triage system uses a 2-stage flow optimized for 60-70% cost reduction while maintaining medical accuracy.

## Key Commands

### Development Commands
```bash
cd frontend
npm install           # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Setup
- Create `frontend/.env.local` with the following:
  ```
  GEMINI_API_KEY=your_gemini_api_key          # For legacy general chat mode
  OPENROUTER_API_KEY=your_openrouter_api_key  # For triage system (primary)
  ```
- **Primary Mode**: Triage system uses OpenAI GPT-4o via OpenRouter
- **Legacy Mode**: General chat uses Google Gemini

## Architecture Overview

### Dual-Mode System

**Primary Mode: Medical Triage System**
The main focus - a cost-optimized 2-stage symptom checking system:

**Stage 1: Medical Interview**
- Progressive questioning with Persian medical vocabulary
- Smart question selection based on user input
- One question per response with quick-answer options
- Continue until confident classification possible

**Stage 2: Classification & Response**
- 5-level triage classification (Emergency → Self-Care)
- Template-driven response generation (60-70% cost savings)
- Category-specific medical guidance
- Emergency fast-track with direct action buttons

**Legacy Mode: General Medical Chat**
- Original SalamatBot general medical consultation
- Broader medical Q&A capabilities  
- Google Gemini integration
- Maintained for backward compatibility

### API Architecture

**Primary Triage API** (`frontend/app/api/triage/route.ts`)
- **NEW**: Cost-optimized medical triage system
- Handles 2-stage conversation flow (interview → classification)
- Session-based conversation management
- Template-driven response generation
- OpenAI GPT-4o integration via OpenRouter

**Legacy Chat API** (`frontend/app/api/chat/route.ts`)
- Original general medical chat functionality
- Google Gemini integration
- Backward compatibility support
- Simple request/response pattern

### Key Libraries & Utilities

**Triage System Libraries** (all in `frontend/app/lib/`):
- `triageTemplates.ts` - **NEW**: 5-level classification templates with UI structure
- `triagePrompts.ts` - **NEW**: Cost-optimized prompts for medical triage
- `openai.ts` - **NEW**: OpenAI integration via OpenRouter proxy

**Legacy System Libraries**:
- `prompts.ts` - Original medical prompts and emergency detection  
- `gemini.ts` - Google Gemini API integration

### Frontend Architecture

**Triage Components** (NEW):
- `ModeSelector.tsx` - **NEW**: Dual-mode selection interface
- `TriageChat.tsx` - **NEW**: Complete triage conversation interface
- `TriageResult.tsx` - **NEW**: 5-level classification results with templates

**Legacy Components**:
- `ChatScreen.tsx` - Original chat interface
- `ChatForm.tsx` - Original message input form
- `InitialScreen.tsx` - Welcome screen with prompt suggestions

**State Management**:
- `hooks/useConversationFlow.ts` - 3-stage flow orchestration
- `hooks/useChatManager.ts` - Chat state and message management
- `hooks/useMedicalChatApp.ts` - Main application state
- `contexts/AppContext.tsx` - Global application context

**Type Definitions** (`frontend/app/types/conversation.ts`):
- Comprehensive TypeScript interfaces for all conversation flow components
- 300+ lines of detailed type definitions
- Supports both legacy and enhanced conversation systems

### Persian Language Support
- Full RTL (Right-to-Left) layout support
- Kalameh font family with multiple weights
- Persian medical terminology and emergency keywords
- Localized confidence descriptions and UI text

## Development Guidelines

### Adding New Medical Categories
1. Update `ENHANCED_MEDICAL_CATEGORIES` in `medicalCategories.ts`
2. Add category-specific keywords and question sets
3. Update confidence assessment adjustments if needed
4. Test with appropriate Persian medical terms

### Modifying Confidence Assessment
- Quick assessment logic in `confidenceAssessment.ts`
- AI assessment prompts in `prompts.ts` (CONFIDENCE_ASSESSMENT_PROMPT)
- Hybrid weighting in `hybridConfidence.ts` (60% quick, 40% AI)
- Medical safety baseline: minimum 30% confidence for any advice

### Emergency Detection Customization
- Emergency keywords in `prompts.ts` (EMERGENCY_KEYWORDS)
- 4-tier emergency classification (Critical, High, Medium, Psychological)
- Fast-track bypass logic in chat API route handlers
- Emergency response templates for different scenarios

### Performance Optimization
- Caching system in `performanceOptimizer.ts` with TTL management
- API call optimization with retry logic
- Target: 23-38% reduction in API calls, 6.5s average response time
- Emergency response target: 2-4 seconds

## Important Configuration

### System Thresholds (in `systemConfig.ts`):
- High confidence: 80% (proceed to final response)  
- Medium confidence: 60% (1 additional question)
- Low confidence: 40% (2 additional questions)
- AI assessment range: 40-75% confidence scores
- Maximum questions per conversation: 4 total

### Medical Categories:
1. Symptom Reporting (General symptoms)
2. Emergency/Urgent (Critical conditions)  
3. Medication Inquiry (Drug interactions)
4. Preventive Care (Health maintenance)
5. Chronic Disease Management
6. Women's Health
7. Mental Health

## Testing & Validation

When testing the system:
1. Test emergency detection with Persian emergency keywords
2. Validate 3-stage flow progression with different confidence levels
3. Check progressive questioning triggers (confidence < 75%)
4. Verify Persian text rendering and RTL layout
5. Test API error handling and fallback responses

## Deployment

- Configured for Netlify deployment via `netlify.toml`
- Next.js app with `@netlify/plugin-nextjs`
- Build command: `npm run build` in frontend directory
- Requires `GEMINI_API_KEY` environment variable

## Legacy Support

The system maintains backward compatibility with the original chat interface while providing enhanced 3-stage flow capabilities. Legacy chat requests are handled through the default case in the chat API route.
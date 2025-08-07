# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SalamatBot** is a sophisticated Persian medical chatbot built with Next.js that implements a 3-stage enhanced conversation flow system. The application combines smart question selection, confidence assessment, and progressive disclosure to provide accurate medical guidance while optimizing API usage and response times.

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
- Create `frontend/.env.local` with `GEMINI_API_KEY=your_gemini_api_key`
- Gemini API key is required for all chat functionality

## Architecture Overview

### 3-Stage Conversation Flow System
The application implements a sophisticated medical conversation system:

**Stage 1: Smart Classification & Emergency Fast-Track**
- Input analysis using Persian medical keywords
- Emergency detection with bypass logic
- Medical category classification (7 categories)
- Located in: `frontend/app/lib/inputAnalysis.ts`, `frontend/app/lib/medicalCategories.ts`

**Stage 2A: Smart Question Selection**
- Intelligent question selection based on missing information
- Category-specific question targeting
- Implemented in: `frontend/app/lib/questionSelection.ts`, `frontend/app/lib/questionGenerator.ts`

**Stage 2B: Confidence Assessment**
- Hybrid confidence scoring (quick + AI assessment)
- Medical safety adjustments for conservative scoring
- Files: `frontend/app/lib/confidenceAssessment.ts`, `frontend/app/lib/hybridConfidence.ts`

**Stage 2C: Progressive Questions (if needed)**
- Adaptive questioning based on confidence gaps
- Uncertainty area targeting
- Logic in: `frontend/app/lib/progressiveQuestions.ts`

**Stage 3: Enhanced Final Response**
- Comprehensive medical advice with confidence context
- Information completeness indicators
- Emergency-specific response templates

### API Architecture
Three main API endpoints handle the conversation flow:

**Primary Chat API** (`frontend/app/api/chat/route.ts`)
- Handles all conversation stages with request type routing
- Supports legacy chat requests for backward compatibility
- Emergency fast-track processing
- 3-stage flow orchestration

**Confidence Assessment API** (`frontend/app/api/confidence/route.ts`)
- Dedicated confidence calculation endpoint
- Supports quick, AI, and optimized assessment methods
- Used for uncertainty evaluation

**Classification API** (`frontend/app/api/classify/route.ts`)
- Input analysis and medical categorization
- Emergency detection
- Question selection assistance

### Key Libraries & Utilities

**Core Logic Libraries** (all in `frontend/app/lib/`):
- `inputAnalysis.ts` - Persian medical input processing
- `medicalCategories.ts` - 7 medical categories with question sets
- `confidenceAssessment.ts` - Rule-based confidence scoring
- `hybridConfidence.ts` - Combined quick+AI confidence assessment
- `questionSelection.ts` - Smart question selection algorithms
- `questionGenerator.ts` - Dynamic question generation
- `progressiveQuestions.ts` - Adaptive follow-up questioning
- `prompts.ts` - Medical prompts and emergency detection
- `systemConfig.ts` - System configuration and thresholds
- `performanceOptimizer.ts` - API call optimization and caching
- `gemini.ts` - Google Gemini API integration

### Frontend Architecture

**Component Structure**:
- `ChatScreen.tsx` - Main chat interface with confidence indicators
- `ChatForm.tsx` - Message input with progressive question support  
- `ProgressiveQuestionCard.tsx` - Multi-stage questioning interface
- `ConfidenceIndicator.tsx` - Visual confidence display
- `EmergencyAlert.tsx` - Emergency situation handling
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
# SalamatBot Technical Architecture Guide

## Overview
SalamatBot is a Persian medical chatbot with intelligent intent classification that routes conversations to specialized medical category modules.

## System Flow
```
User Message → Intent Classification → Category Module → AI Processing → Structured Response
```

## Core Architecture

### Frontend (Next.js + React)
**Main Components:**
- `page.tsx` - Root application with `AppProvider`
- `ChatScreen.tsx` - Message display and quick action buttons
- `ChatForm.tsx` - Message input interface
- `InitialScreen.tsx` - Welcome screen with suggestions

**State Management:**
- `useChatManager.ts` - API calls and message handling
- `useAppContext.tsx` - Global state via React Context
- Session storage for conversation persistence

### Backend API (`/api/unified/route.ts`)
**Request Processing:**
1. **Session Management** - Creates/retrieves conversation sessions
2. **Intent Classification** - Uses AI to categorize user message into 6 medical categories
3. **Module Routing** - Dispatches to appropriate category module
4. **Response Assembly** - Standardizes module output for frontend

**Supported Actions:**
- `new_session` - Initialize new conversation
- `chat` - Process user message
- `get_info` - Retrieve session information

### Category Module System
**Base Architecture (`CategoryModule.ts`):**
- Abstract base class defining standard interface
- `CategoryRegistry` - Manages module registration and lookup
- Standardized `CategoryResponse` format

**Available Modules:**
1. **SYMPTOM_REPORTING** - Medical triage with progressive questioning
2. **MEDICATION_QUERIES** - Drug interactions and pharmaceutical guidance
3. **INFORMATION_SEEKING** - General medical education
4. **CHRONIC_DISEASE_MANAGEMENT** - Long-term condition management
5. **DIAGNOSTIC_RESULT_INTERPRETATION** - Test result explanations
6. **PREVENTIVE_CARE_WELLNESS** - Health maintenance guidance

### AI Integration
**Primary AI Service:**
- OpenAI GPT-4o via OpenRouter proxy
- Configured in `lib/openai.ts`

**Processing Pipeline:**
1. **Intent Classification** - Determines message category using specialized prompt
2. **Category Processing** - Module-specific AI prompts and logic
3. **Response Generation** - Template-driven or dynamic responses

### Session Management
**Session Structure:**
- Unified sessions in `/api/unified` with category-specific sub-sessions
- In-memory storage (Map-based) for development
- Session switching when user changes topics

**Data Flow:**
- Frontend maintains session ID in sessionStorage
- Backend maps session ID to conversation history
- Category modules maintain isolated conversation state

### Response Format
**Standardized Output:**
```typescript
{
  message: string,           // Main response text
  category: string,          // Medical category
  categoryName: string,      // Display name
  options?: string[],        // Quick action buttons
  isComplete?: boolean,      // Conversation completion status
  nextAction: string,        // System action guidance
  metadata: object           // Module-specific data
}
```

### Configuration
**Environment Variables:**
- `OPENROUTER_API_KEY` - Primary AI service
- Stored in `.env.local`

**Key Dependencies:**
- `openai` - AI service integration
- `next` - Full-stack framework
- `react` - UI framework

## Technical Features

### Intent Classification
Uses AI-powered classification with keyword-based fallback to route messages to appropriate medical category modules.

### Progressive Questioning (Symptom Module)
Implements multi-turn triage conversations with:
- Dynamic question generation
- Confidence-based progression
- 5-level medical urgency classification
- Quick response options

### Module Isolation
Each category module operates independently:
- Separate session state
- Independent processing logic
- Standardized interfaces
- Zero cross-module dependencies

### Error Handling
- Module fallback system
- Graceful degradation
- User-friendly error messages
- Debug logging

## Deployment
- Next.js application with API routes
- Configured for Netlify deployment
- Build command: `npm run build`
- Environment variables required for AI services

## Development Guidelines
1. **Adding Categories** - Extend `CategoryModule` base class
2. **Modifying Flows** - Each module is independent
3. **UI Customization** - Standard response format supports various UI elements
4. **Testing** - Module isolation enables focused testing
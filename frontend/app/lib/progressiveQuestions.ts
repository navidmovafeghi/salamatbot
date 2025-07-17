/**
 * Progressive Questions Logic - Stage 2C Implementation
 * 
 * This module implements the progressive questioning system that determines
 * when and what additional questions to ask based on confidence levels and
 * uncertainty areas identified in the initial analysis.
 * 
 * Key Features:
 * - Intelligent question selection based on confidence gaps
 * - Targeted follow-up questions for uncertainty areas
 * - Question count optimization to balance accuracy and efficiency
 * - Stopping criteria to prevent over-questioning
 * - Context preservation across question rounds
 */

import { 
  OptimizedProgressiveState, 
  InputAnalysis, 
  MedicalCategory, 
  ConfidenceAssessment,
  QuestionSelectionResult,
  ProgressiveQuestionContext,
  UncertaintyArea
} from '../types/conversation';
import { calculateOptimizedConfidence } from './hybridConfidence';
import { selectOptimalQuestions } from './questionSelection';

/**
 * Configuration for progressive questioning behavior
 */
const PROGRESSIVE_CONFIG = {
  // Confidence thresholds for triggering progressive questions
  MIN_CONFIDENCE_FOR_FINAL: 0.75,  // Below this, ask more questions
  MIN_CONFIDENCE_FOR_PARTIAL: 0.60, // Below this, ask targeted questions
  CRITICAL_CONFIDENCE_THRESHOLD: 0.45, // Below this, ask comprehensive questions
  
  // Question count limits
  MAX_PROGRESSIVE_QUESTIONS: 3,     // Maximum additional questions per round
  MAX_TOTAL_ROUNDS: 2,              // Maximum progressive question rounds
  MIN_QUESTIONS_PER_ROUND: 1,       // Minimum questions if we decide to ask
  
  // Uncertainty area weights
  UNCERTAINTY_WEIGHTS: {
    symptoms: 0.3,
    severity: 0.25,
    duration: 0.2,
    context: 0.15,
    medical_history: 0.1
  },
  
  // Stopping criteria
  CONFIDENCE_IMPROVEMENT_THRESHOLD: 0.1, // Minimum improvement to continue
  DIMINISHING_RETURNS_THRESHOLD: 0.05,   // Stop if improvement is too small
};

/**
 * Determines if progressive questions should be asked based on current confidence
 */
export function shouldAskProgressiveQuestions(
  confidence: ConfidenceAssessment,
  currentRound: number = 0
): boolean {
  // Don't ask if we've reached maximum rounds
  if (currentRound >= PROGRESSIVE_CONFIG.MAX_TOTAL_ROUNDS) {
    return false;
  }
  
  // Don't ask if confidence is already high enough
  if (confidence.overallScore >= PROGRESSIVE_CONFIG.MIN_CONFIDENCE_FOR_FINAL) {
    return false;
  }
  
  // Always ask if confidence is critically low
  if (confidence.overallScore < PROGRESSIVE_CONFIG.CRITICAL_CONFIDENCE_THRESHOLD) {
    return true;
  }
  
  // Check if there are significant uncertainty areas
  const hasSignificantUncertainty = confidence.categoryScores.some(
    category => category.score < PROGRESSIVE_CONFIG.MIN_CONFIDENCE_FOR_PARTIAL
  );
  
  return hasSignificantUncertainty;
}

/**
 * Identifies uncertainty areas that need targeted follow-up questions
 */
export function identifyUncertaintyAreas(
  analysis: InputAnalysis,
  confidence: ConfidenceAssessment
): UncertaintyArea[] {
  const uncertaintyAreas: UncertaintyArea[] = [];
  
  // Check each category for uncertainty
  confidence.categoryScores.forEach(categoryScore => {
    if (categoryScore.score < PROGRESSIVE_CONFIG.MIN_CONFIDENCE_FOR_PARTIAL) {
      const uncertaintyArea: UncertaintyArea = {
        area: categoryScore.category as keyof typeof PROGRESSIVE_CONFIG.UNCERTAINTY_WEIGHTS,
        confidenceScore: categoryScore.score,
        priority: calculateUncertaintyPriority(categoryScore.category, categoryScore.score),
        specificConcerns: identifySpecificConcerns(categoryScore.category, analysis),
        suggestedQuestions: []
      };
      
      uncertaintyAreas.push(uncertaintyArea);
    }
  });
  
  // Sort by priority (highest first)
  return uncertaintyAreas.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculates priority for an uncertainty area
 */
function calculateUncertaintyPriority(
  category: string,
  confidenceScore: number
): number {
  const baseWeight = PROGRESSIVE_CONFIG.UNCERTAINTY_WEIGHTS[
    category as keyof typeof PROGRESSIVE_CONFIG.UNCERTAINTY_WEIGHTS
  ] || 0.1;
  
  // Lower confidence = higher priority
  const confidenceWeight = 1 - confidenceScore;
  
  return baseWeight * confidenceWeight;
}

/**
 * Identifies specific concerns within a category
 */
function identifySpecificConcerns(
  category: string,
  analysis: InputAnalysis
): string[] {
  const concerns: string[] = [];
  
  switch (category) {
    case 'symptoms':
      if (!analysis.symptoms || analysis.symptoms.length === 0) {
        concerns.push('علائم مشخص نشده');
      }
      if (analysis.symptoms?.some(s => s.severity === 'unknown')) {
        concerns.push('شدت علائم نامشخص');
      }
      break;
      
    case 'severity':
      if (!analysis.severity || analysis.severity === 'unknown') {
        concerns.push('سطح شدت مشخص نشده');
      }
      break;
      
    case 'duration':
      if (!analysis.duration || analysis.duration === 'unknown') {
        concerns.push('مدت زمان علائم نامشخص');
      }
      break;
      
    case 'context':
      if (!analysis.context || Object.keys(analysis.context).length === 0) {
        concerns.push('شرایط محیطی نامشخص');
      }
      break;
      
    case 'medical_history':
      if (!analysis.medicalHistory || analysis.medicalHistory.length === 0) {
        concerns.push('سابقه پزشکی ناقص');
      }
      break;
  }
  
  return concerns;
}

/**
 * Determines the optimal number of progressive questions to ask
 */
export function determineQuestionCount(
  uncertaintyAreas: UncertaintyArea[],
  currentRound: number,
  previousImprovement?: number
): number {
  // Check for diminishing returns
  if (previousImprovement !== undefined && 
      previousImprovement < PROGRESSIVE_CONFIG.DIMINISHING_RETURNS_THRESHOLD) {
    return 0; // Stop asking questions
  }
  
  // Base count on number of high-priority uncertainty areas
  const highPriorityAreas = uncertaintyAreas.filter(area => area.priority > 0.2);
  let questionCount = Math.min(highPriorityAreas.length, PROGRESSIVE_CONFIG.MAX_PROGRESSIVE_QUESTIONS);
  
  // Adjust based on round number (fewer questions in later rounds)
  if (currentRound > 0) {
    questionCount = Math.max(1, Math.floor(questionCount * 0.7));
  }
  
  // Ensure minimum if we decide to ask
  if (questionCount > 0) {
    questionCount = Math.max(questionCount, PROGRESSIVE_CONFIG.MIN_QUESTIONS_PER_ROUND);
  }
  
  return questionCount;
}

/**
 * Main function to determine progressive questions
 */
export async function determineProgressiveQuestions(
  analysis: InputAnalysis,
  confidence: ConfidenceAssessment,
  context: ProgressiveQuestionContext
): Promise<QuestionSelectionResult> {
  // Check if we should ask progressive questions
  if (!shouldAskProgressiveQuestions(confidence, context.currentRound)) {
    return {
      questions: [],
      reasoning: 'اعتماد کافی برای پاسخ نهایی یا حداکثر دور سوالات رسیده',
      confidenceImprovement: 0,
      shouldContinue: false
    };
  }
  
  // Identify uncertainty areas
  const uncertaintyAreas = identifyUncertaintyAreas(analysis, confidence);
  
  if (uncertaintyAreas.length === 0) {
    return {
      questions: [],
      reasoning: 'هیچ منطقه عدم اطمینان قابل توجهی یافت نشد',
      confidenceImprovement: 0,
      shouldContinue: false
    };
  }
  
  // Determine question count
  const questionCount = determineQuestionCount(
    uncertaintyAreas,
    context.currentRound,
    context.previousImprovement
  );
  
  if (questionCount === 0) {
    return {
      questions: [],
      reasoning: 'بازده کاهشی - توقف سوالات اضافی',
      confidenceImprovement: 0,
      shouldContinue: false
    };
  }
  
  // Generate targeted questions for uncertainty areas
  const targetedQuestions = await generateTargetedQuestions(
    uncertaintyAreas.slice(0, questionCount),
    analysis,
    context
  );
  
  // Calculate expected confidence improvement
  const expectedImprovement = calculateExpectedImprovement(
    uncertaintyAreas.slice(0, questionCount),
    confidence
  );
  
  return {
    questions: targetedQuestions,
    reasoning: `سوالات هدفمند برای ${questionCount} منطقه عدم اطمینان اولویت‌دار`,
    confidenceImprovement: expectedImprovement,
    shouldContinue: expectedImprovement >= PROGRESSIVE_CONFIG.CONFIDENCE_IMPROVEMENT_THRESHOLD,
    uncertaintyAreas: uncertaintyAreas.slice(0, questionCount)
  };
}

/**
 * Generates targeted questions for specific uncertainty areas
 */
async function generateTargetedQuestions(
  uncertaintyAreas: UncertaintyArea[],
  analysis: InputAnalysis,
  context: ProgressiveQuestionContext
): Promise<string[]> {
  const questions: string[] = [];
  
  for (const area of uncertaintyAreas) {
    const areaQuestions = await generateQuestionsForArea(area, analysis, context);
    questions.push(...areaQuestions);
  }
  
  // Ensure we don't exceed the maximum
  return questions.slice(0, PROGRESSIVE_CONFIG.MAX_PROGRESSIVE_QUESTIONS);
}

/**
 * Generates questions for a specific uncertainty area
 */
async function generateQuestionsForArea(
  area: UncertaintyArea,
  analysis: InputAnalysis,
  context: ProgressiveQuestionContext
): Promise<string[]> {
  const questions: string[] = [];
  
  switch (area.area) {
    case 'symptoms':
      if (area.specificConcerns.includes('علائم مشخص نشده')) {
        questions.push('آیا علائم دیگری غیر از موارد ذکر شده دارید؟');
      }
      if (area.specificConcerns.includes('شدت علائم نامشخص')) {
        questions.push('شدت علائم فعلی‌تان را از ۱ تا ۱۰ چگونه ارزیابی می‌کنید؟');
      }
      break;
      
    case 'severity':
      questions.push('این علائم چقدر در فعالیت‌های روزانه‌تان اختلال ایجاد کرده؟');
      break;
      
    case 'duration':
      questions.push('این علائم دقیقاً از چه زمانی شروع شده و چگونه تغییر کرده؟');
      break;
      
    case 'context':
      questions.push('آیا عوامل خاصی باعث بهتر یا بدتر شدن علائم می‌شود؟');
      break;
      
    case 'medical_history':
      questions.push('آیا سابقه بیماری مشابه یا مصرف دارو دارید؟');
      break;
  }
  
  return questions.slice(0, 1); // One question per area for now
}

/**
 * Calculates expected confidence improvement from asking questions
 */
function calculateExpectedImprovement(
  uncertaintyAreas: UncertaintyArea[],
  currentConfidence: ConfidenceAssessment
): number {
  let totalImprovement = 0;
  
  uncertaintyAreas.forEach(area => {
    // Estimate improvement based on area priority and current confidence gap
    const confidenceGap = PROGRESSIVE_CONFIG.MIN_CONFIDENCE_FOR_FINAL - area.confidenceScore;
    const expectedImprovement = confidenceGap * area.priority * 0.5; // Conservative estimate
    totalImprovement += expectedImprovement;
  });
  
  // Cap the improvement to realistic levels
  return Math.min(totalImprovement, 0.3);
}

/**
 * Updates progressive state after receiving answers
 */
export function updateProgressiveState(
  currentState: OptimizedProgressiveState,
  newAnswers: string[],
  newConfidence: ConfidenceAssessment
): OptimizedProgressiveState {
  const previousConfidence = currentState.confidenceHistory[currentState.confidenceHistory.length - 1]?.overallScore || 0;
  const improvement = newConfidence.overallScore - previousConfidence;
  
  return {
    ...currentState,
    currentRound: currentState.currentRound + 1,
    questionsAsked: currentState.questionsAsked + newAnswers.length,
    confidenceHistory: [
      ...currentState.confidenceHistory,
      newConfidence
    ],
    previousImprovement: improvement,
    lastQuestionTime: new Date(),
    shouldContinue: improvement >= PROGRESSIVE_CONFIG.CONFIDENCE_IMPROVEMENT_THRESHOLD &&
                   currentState.currentRound < PROGRESSIVE_CONFIG.MAX_TOTAL_ROUNDS
  };
}

/**
 * Determines if the progressive questioning should stop
 */
export function shouldStopProgressive(
  state: OptimizedProgressiveState,
  latestConfidence: ConfidenceAssessment
): boolean {
  // Stop if confidence is high enough
  if (latestConfidence.overallScore >= PROGRESSIVE_CONFIG.MIN_CONFIDENCE_FOR_FINAL) {
    return true;
  }
  
  // Stop if we've reached maximum rounds
  if (state.currentRound >= PROGRESSIVE_CONFIG.MAX_TOTAL_ROUNDS) {
    return true;
  }
  
  // Stop if improvement is too small (diminishing returns)
  if (state.previousImprovement !== undefined && 
      state.previousImprovement < PROGRESSIVE_CONFIG.DIMINISHING_RETURNS_THRESHOLD) {
    return true;
  }
  
  return false;
}

/**
 * Generates a summary of the progressive questioning session
 */
export function generateProgressiveSummary(
  state: OptimizedProgressiveState
): string {
  const totalQuestions = state.questionsAsked;
  const rounds = state.currentRound;
  const finalConfidence = state.confidenceHistory[state.confidenceHistory.length - 1]?.overallScore || 0;
  const initialConfidence = state.confidenceHistory[0]?.overallScore || 0;
  const improvement = finalConfidence - initialConfidence;
  
  return `جلسه سوال‌پرسی تدریجی تکمیل شد:
- تعداد سوالات: ${totalQuestions}
- تعداد دورها: ${rounds}
- بهبود اعتماد: ${(improvement * 100).toFixed(1)}%
- اعتماد نهایی: ${(finalConfidence * 100).toFixed(1)}%`;
}
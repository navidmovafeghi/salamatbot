/**
 * Performance Optimizer for 3-Stage Enhanced Medical Conversation Flow
 * 
 * This module implements performance optimization strategies including:
 * - API call optimization and caching
 * - Response time monitoring
 * - Cost tracking and reduction
 * - Memory management
 * - Intelligent caching mechanisms
 */

import { 
  InputAnalysis, 
  MedicalCategory, 
  ConfidenceAssessment,
  ConversationFlowState 
} from '../types/conversation';

// Performance configuration
const PERFORMANCE_CONFIG = {
  // Caching settings
  CACHE_TTL: {
    analysis: 5 * 60 * 1000,        // 5 minutes
    classification: 10 * 60 * 1000,  // 10 minutes
    confidence: 3 * 60 * 1000,       // 3 minutes
    questions: 15 * 60 * 1000        // 15 minutes
  },
  
  // API optimization
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_TIMEOUT: 10000,           // 10 seconds
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,               // 1 second
  
  // Cost optimization
  MAX_API_CALLS_PER_SESSION: 10,
  COST_TRACKING_ENABLED: true,
  
  // Performance monitoring
  RESPONSE_TIME_THRESHOLD: 5000,   // 5 seconds
  MEMORY_CLEANUP_INTERVAL: 30000,  // 30 seconds
  
  // Intelligent batching
  BATCH_SIZE: 3,
  BATCH_DELAY: 100                 // 100ms
};

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Performance metrics interface
interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  totalResponseTime: number;
  averageResponseTime: number;
  costEstimate: number;
  memoryUsage: number;
  sessionStartTime: number;
}

// Cache storage
class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalResponseTime: 0,
    averageResponseTime: 0,
    costEstimate: 0,
    memoryUsage: 0,
    sessionStartTime: Date.now()
  };

  constructor() {
    // Start memory cleanup interval
    setInterval(() => this.cleanupExpiredEntries(), PERFORMANCE_CONFIG.MEMORY_CLEANUP_INTERVAL);
  }

  // Generate cache key
  private generateKey(type: string, data: any): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return `${type}:${this.hashString(dataString)}`;
  }

  // Simple hash function
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Set cache entry
  set<T>(type: string, key: any, data: T): void {
    const cacheKey = this.generateKey(type, key);
    const ttl = PERFORMANCE_CONFIG.CACHE_TTL[type as keyof typeof PERFORMANCE_CONFIG.CACHE_TTL] || 300000;
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  // Get cache entry
  get<T>(type: string, key: any): T | null {
    const cacheKey = this.generateKey(type, key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      this.metrics.cacheMisses++;
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.metrics.cacheHits++;

    return entry.data as T;
  }

  // Check if key exists and is valid
  has(type: string, key: any): boolean {
    return this.get(type, key) !== null;
  }

  // Clear cache by type
  clearByType(type: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Update memory usage estimate
    this.metrics.memoryUsage = this.cache.size;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      ...this.metrics
    };
  }

  // Update metrics
  updateMetrics(responseTime: number, apiCalled: boolean = false) {
    if (apiCalled) {
      this.metrics.apiCalls++;
      this.metrics.costEstimate += this.estimateAPICost();
    }
    
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / 
      (this.metrics.apiCalls + this.metrics.cacheHits);
  }

  // Estimate API cost (simplified)
  private estimateAPICost(): number {
    // Rough estimate: $0.001 per API call
    return 0.001;
  }
}

// Global cache instance
const performanceCache = new PerformanceCache();

// API call optimizer
class APIOptimizer {
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;
  private batchQueue: Array<{ resolve: Function; reject: Function; request: () => Promise<any> }> = [];

  // Optimized API call with caching and batching
  async optimizedAPICall<T>(
    cacheType: string,
    cacheKey: any,
    apiCall: () => Promise<T>,
    options: {
      skipCache?: boolean;
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();

    // Check cache first (unless skipped)
    if (!options.skipCache) {
      const cached = performanceCache.get<T>(cacheType, cacheKey);
      if (cached) {
        performanceCache.updateMetrics(Date.now() - startTime, false);
        return cached;
      }
    }

    // Execute API call with optimization
    try {
      const result = await this.executeWithOptimization(apiCall, options);
      
      // Cache the result
      performanceCache.set(cacheType, cacheKey, result);
      
      const responseTime = Date.now() - startTime;
      performanceCache.updateMetrics(responseTime, true);
      
      return result;
    } catch (error) {
      performanceCache.updateMetrics(Date.now() - startTime, true);
      throw error;
    }
  }

  // Execute API call with concurrency control and retry logic
  private async executeWithOptimization<T>(
    apiCall: () => Promise<T>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
    }
  ): Promise<T> {
    // Check concurrency limit
    if (this.activeRequests >= PERFORMANCE_CONFIG.MAX_CONCURRENT_REQUESTS) {
      if (options.priority === 'high') {
        // High priority requests bypass queue
        return this.executeWithRetry(apiCall, options.timeout);
      } else {
        // Queue the request
        return new Promise((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const result = await this.executeWithRetry(apiCall, options.timeout);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
          this.processQueue();
        });
      }
    }

    return this.executeWithRetry(apiCall, options.timeout);
  }

  // Execute with retry logic
  private async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    timeout: number = PERFORMANCE_CONFIG.REQUEST_TIMEOUT
  ): Promise<T> {
    this.activeRequests++;

    try {
      for (let attempt = 0; attempt <= PERFORMANCE_CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
          });

          const result = await Promise.race([apiCall(), timeoutPromise]);
          return result;
        } catch (error) {
          if (attempt === PERFORMANCE_CONFIG.RETRY_ATTEMPTS) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
      
      throw new Error('Max retry attempts reached');
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  // Process queued requests
  private processQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < PERFORMANCE_CONFIG.MAX_CONCURRENT_REQUESTS) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  // Batch multiple requests
  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const batches: Array<Array<() => Promise<T>>> = [];
    
    // Split into batches
    for (let i = 0; i < requests.length; i += PERFORMANCE_CONFIG.BATCH_SIZE) {
      batches.push(requests.slice(i, i + PERFORMANCE_CONFIG.BATCH_SIZE));
    }

    const results: T[] = [];

    // Execute batches with delay
    for (const batch of batches) {
      const batchResults = await Promise.all(batch.map(request => request()));
      results.push(...batchResults);
      
      // Delay between batches (except for the last one)
      if (batch !== batches[batches.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, PERFORMANCE_CONFIG.BATCH_DELAY));
      }
    }

    return results;
  }
}

// Global API optimizer instance
const apiOptimizer = new APIOptimizer();

// Performance monitoring
class PerformanceMonitor {
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Monitor navigation and resource timing
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log('Navigation timing:', entry);
          } else if (entry.entryType === 'resource') {
            console.log('Resource timing:', entry);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  // Measure function execution time
  async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    
    console.log(`${name} execution time: ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }

  // Get current performance metrics
  getMetrics() {
    const cacheStats = performanceCache.getStats();
    
    return {
      cache: cacheStats,
      memory: this.getMemoryUsage(),
      timing: this.getTimingMetrics()
    };
  }

  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private getTimingMetrics() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalPageLoad: navigation.loadEventEnd - navigation.fetchStart
        };
      }
    }
    return null;
  }
}

// Global performance monitor
const performanceMonitor = new PerformanceMonitor();

// Main performance optimizer interface
export class PerformanceOptimizer {
  // Optimized input analysis
  static async optimizeInputAnalysis(message: string): Promise<InputAnalysis> {
    return apiOptimizer.optimizedAPICall(
      'analysis',
      message,
      async () => {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message, 
            requestType: 'analysis_only' 
          })
        });
        const data = await response.json();
        return data.analysis;
      },
      { priority: 'high' }
    );
  }

  // Optimized classification
  static async optimizeClassification(message: string): Promise<MedicalCategory> {
    return apiOptimizer.optimizedAPICall(
      'classification',
      message,
      async () => {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message, 
            requestType: 'classification_only' 
          })
        });
        const data = await response.json();
        return data.primaryCategory;
      }
    );
  }

  // Optimized confidence assessment
  static async optimizeConfidenceAssessment(
    analysis: InputAnalysis,
    category: MedicalCategory,
    questionAnswers: any[]
  ): Promise<ConfidenceAssessment> {
    const cacheKey = { analysis, category, questionAnswers };
    
    return apiOptimizer.optimizedAPICall(
      'confidence',
      cacheKey,
      async () => {
        const response = await fetch('/api/confidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            analysis, 
            category, 
            questionAnswers,
            method: 'optimized'
          })
        });
        const data = await response.json();
        return data.confidence;
      }
    );
  }

  // Batch multiple API calls
  static async batchAPIRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return apiOptimizer.batchRequests(requests);
  }

  // Clear cache
  static clearCache(type?: string): void {
    if (type) {
      performanceCache.clearByType(type);
    } else {
      performanceCache.clear();
    }
  }

  // Get performance metrics
  static getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  // Measure execution time
  static async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    return performanceMonitor.measureExecutionTime(name, fn);
  }

  // Cost optimization report
  static getCostOptimizationReport() {
    const stats = performanceCache.getStats();
    const potentialSavings = stats.cacheHits * 0.001; // Estimated cost per API call
    
    return {
      totalAPICalls: stats.apiCalls,
      cacheHits: stats.cacheHits,
      cacheMisses: stats.cacheMisses,
      hitRate: stats.hitRate,
      estimatedCost: stats.costEstimate,
      potentialSavings,
      costReduction: potentialSavings / (stats.costEstimate + potentialSavings) || 0,
      recommendations: this.generateOptimizationRecommendations(stats)
    };
  }

  // Generate optimization recommendations
  private static generateOptimizationRecommendations(stats: any): string[] {
    const recommendations: string[] = [];
    
    if (stats.hitRate < 0.3) {
      recommendations.push('افزایش مدت زمان کش برای بهبود نرخ بازیابی');
    }
    
    if (stats.averageResponseTime > PERFORMANCE_CONFIG.RESPONSE_TIME_THRESHOLD) {
      recommendations.push('بهینه‌سازی زمان پاسخ API');
    }
    
    if (stats.apiCalls > PERFORMANCE_CONFIG.MAX_API_CALLS_PER_SESSION) {
      recommendations.push('کاهش تعداد فراخوانی‌های API در هر جلسه');
    }
    
    return recommendations;
  }
}

// Export performance utilities
export { performanceCache, apiOptimizer, performanceMonitor };
export default PerformanceOptimizer;
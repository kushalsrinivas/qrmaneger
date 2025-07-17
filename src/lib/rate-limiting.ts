import { Redis } from "ioredis";

// ================================
// RATE LIMITING SERVICE
// ================================

/**
 * Rate limiting service for QR code generation and URL submissions
 */
export class RateLimitingService {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor() {
    // Initialize Redis if available, otherwise use memory store
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
      }
    } catch (error) {
      console.warn("Redis not available, using memory store for rate limiting");
    }
  }
  
  /**
   * Check if a request is rate limited
   */
  public async isRateLimited(
    key: string,
    limit: number,
    windowMs: number = 60000 // 1 minute default
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (this.redis) {
      return this.checkRedisRateLimit(key, limit, windowMs, now);
    } else {
      return this.checkMemoryRateLimit(key, limit, windowMs, now);
    }
  }
  
  /**
   * Rate limit for URL submissions
   */
  public async checkUrlSubmissionLimit(
    userId: string,
    ipAddress?: string
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const userKey = `url_submission:user:${userId}`;
    const ipKey = ipAddress ? `url_submission:ip:${ipAddress}` : null;
    
    // Check user-based limit (100 per hour)
    const userLimit = await this.isRateLimited(userKey, 100, 3600000);
    if (userLimit.limited) {
      return userLimit;
    }
    
    // Check IP-based limit (50 per hour) if IP is provided
    if (ipKey) {
      const ipLimit = await this.isRateLimited(ipKey, 50, 3600000);
      if (ipLimit.limited) {
        return ipLimit;
      }
    }
    
    return { limited: false, remaining: userLimit.remaining, resetTime: userLimit.resetTime };
  }
  
  /**
   * Rate limit for QR code generation
   */
  public async checkQRGenerationLimit(
    userId: string,
    ipAddress?: string
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const userKey = `qr_generation:user:${userId}`;
    const ipKey = ipAddress ? `qr_generation:ip:${ipAddress}` : null;
    
    // Check user-based limit (200 per hour)
    const userLimit = await this.isRateLimited(userKey, 200, 3600000);
    if (userLimit.limited) {
      return userLimit;
    }
    
    // Check IP-based limit (100 per hour) if IP is provided
    if (ipKey) {
      const ipLimit = await this.isRateLimited(ipKey, 100, 3600000);
      if (ipLimit.limited) {
        return ipLimit;
      }
    }
    
    return { limited: false, remaining: userLimit.remaining, resetTime: userLimit.resetTime };
  }
  
  /**
   * Rate limit for dynamic QR code redirects
   */
  public async checkRedirectLimit(
    shortCode: string,
    ipAddress?: string
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const shortCodeKey = `redirect:shortcode:${shortCode}`;
    const ipKey = ipAddress ? `redirect:ip:${ipAddress}` : null;
    
    // Check short code based limit (1000 per hour)
    const shortCodeLimit = await this.isRateLimited(shortCodeKey, 1000, 3600000);
    if (shortCodeLimit.limited) {
      return shortCodeLimit;
    }
    
    // Check IP-based limit (500 per hour) if IP is provided
    if (ipKey) {
      const ipLimit = await this.isRateLimited(ipKey, 500, 3600000);
      if (ipLimit.limited) {
        return ipLimit;
      }
    }
    
    return { limited: false, remaining: shortCodeLimit.remaining, resetTime: shortCodeLimit.resetTime };
  }
  
  /**
   * Redis-based rate limiting
   */
  private async checkRedisRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    now: number
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    if (!this.redis) {
      throw new Error("Redis not available");
    }
    
    const pipeline = this.redis.pipeline();
    const windowStart = now - windowMs;
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error("Redis pipeline failed");
    }
    
    const count = results[1][1] as number;
    const resetTime = now + windowMs;
    
    return {
      limited: count >= limit,
      remaining: Math.max(0, limit - count - 1),
      resetTime,
    };
  }
  
  /**
   * Memory-based rate limiting
   */
  private checkMemoryRateLimit(
    key: string,
    limit: number,
    windowMs: number,
    now: number
  ): { limited: boolean; remaining: number; resetTime: number } {
    const entry = this.memoryStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      const resetTime = now + windowMs;
      this.memoryStore.set(key, { count: 1, resetTime });
      return { limited: false, remaining: limit - 1, resetTime };
    }
    
    entry.count++;
    
    return {
      limited: entry.count > limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime,
    };
  }
  
  /**
   * Clear expired entries from memory store
   */
  public cleanupMemoryStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// ================================
// MALICIOUS URL DETECTION
// ================================

/**
 * Service for detecting malicious URLs
 */
export class MaliciousUrlDetectionService {
  private static readonly SUSPICIOUS_PATTERNS = [
    // Phishing patterns
    /paypal.*verify/i,
    /amazon.*suspend/i,
    /apple.*suspend/i,
    /microsoft.*verify/i,
    /google.*suspend/i,
    
    // Malware patterns
    /download.*exe/i,
    /install.*now/i,
    /update.*flash/i,
    /codec.*required/i,
    
    // Scam patterns
    /free.*money/i,
    /click.*here.*win/i,
    /congratulations.*winner/i,
    /urgent.*action/i,
    
    // Suspicious domains
    /bit\.ly\/[a-z0-9]{6,}/i,
    /tinyurl\.com\/[a-z0-9]{6,}/i,
    /t\.co\/[a-z0-9]{6,}/i,
  ];
  
  private static readonly BLACKLISTED_DOMAINS = [
    "malware.com",
    "phishing.com",
    "scam.com",
    "spam.com",
    "suspicious.site",
    "fake-paypal.com",
    "fake-amazon.com",
    "fake-apple.com",
    "fake-microsoft.com",
    "fake-google.com",
  ];
  
  private static readonly SUSPICIOUS_TLDS = [
    ".tk", ".ml", ".ga", ".cf", ".click", ".download", ".stream"
  ];
  
  /**
   * Check if a URL is potentially malicious
   */
  public static async isMaliciousUrl(url: string): Promise<{
    isMalicious: boolean;
    reason?: string;
    confidence: number; // 0-100
  }> {
    try {
      const urlObj = new URL(url);
      let confidence = 0;
      let reason = "";
      
      // Check against blacklisted domains
      if (this.BLACKLISTED_DOMAINS.includes(urlObj.hostname)) {
        return { isMalicious: true, reason: "Blacklisted domain", confidence: 100 };
      }
      
      // Check for suspicious TLDs
      if (this.SUSPICIOUS_TLDS.some(tld => urlObj.hostname.endsWith(tld))) {
        confidence += 30;
        reason = "Suspicious TLD";
      }
      
      // Check for suspicious patterns
      for (const pattern of this.SUSPICIOUS_PATTERNS) {
        if (pattern.test(url)) {
          confidence += 40;
          reason = "Suspicious URL pattern";
          break;
        }
      }
      
      // Check for URL shortener abuse
      if (this.isUrlShortener(urlObj.hostname) && urlObj.pathname.length > 10) {
        confidence += 20;
        reason = "Potential URL shortener abuse";
      }
      
      // Check for suspicious parameters
      if (urlObj.search.includes("phishing") || urlObj.search.includes("malware")) {
        confidence += 50;
        reason = "Suspicious URL parameters";
      }
      
      return {
        isMalicious: confidence >= 70,
        reason: confidence >= 70 ? reason : undefined,
        confidence,
      };
    } catch (error) {
      return { isMalicious: true, reason: "Invalid URL format", confidence: 100 };
    }
  }
  
  /**
   * Check if domain is a URL shortener
   */
  private static isUrlShortener(hostname: string): boolean {
    const shorteners = [
      "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
      "short.link", "rebrand.ly", "tiny.cc", "is.gd"
    ];
    
    return shorteners.includes(hostname);
  }
}

// ================================
// EXPORT SINGLETON INSTANCES
// ================================

export const rateLimitingService = new RateLimitingService();
export const maliciousUrlDetection = MaliciousUrlDetectionService;

// Cleanup memory store every 5 minutes
if (typeof window === "undefined") {
  setInterval(() => {
    rateLimitingService.cleanupMemoryStore();
  }, 5 * 60 * 1000);
} 
// Upstash Redis client for persistent state storage

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

class RedisClient {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const url = process.env.KV_REST_API_URL;
      const token = process.env.KV_REST_API_TOKEN;

      if (!url || !token) {
        logger.warn('Redis credentials not found. Running without persistence.');
        this.isEnabled = false;
        return;
      }

      this.client = new Redis({
        url,
        token,
      });

      this.isEnabled = true;
      logger.info('Redis client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis client', error);
      this.isEnabled = false;
    }
  }

  /**
   * Check if Redis is available
   */
  get enabled(): boolean {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Get value by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.client!.get<T>(key);
      logger.debug(`Redis GET: ${key}`, { found: !!value });
      return value;
    } catch (error) {
      logger.error(`Redis GET error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value with optional expiration (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      if (ttl) {
        await this.client!.setex(key, ttl, JSON.stringify(value));
      } else {
        await this.client!.set(key, JSON.stringify(value));
      }
      logger.debug(`Redis SET: ${key}`, { ttl });
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await this.client!.del(key);
      logger.debug(`Redis DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Redis DELETE error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get multiple keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.enabled) return [];

    try {
      const keys = await this.client!.keys(pattern);
      return keys;
    } catch (error) {
      logger.error(`Redis KEYS error for pattern: ${pattern}`, error);
      return [];
    }
  }

  /**
   * Set with expiration time (alternative method)
   */
  async setWithExpiry(key: string, value: any, seconds: number): Promise<boolean> {
    return this.set(key, value, seconds);
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number | null> {
    if (!this.enabled) return null;

    try {
      const result = await this.client!.incr(key);
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Get TTL (time to live) of a key
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.enabled) return null;

    try {
      const ttl = await this.client!.ttl(key);
      return ttl;
    } catch (error) {
      logger.error(`Redis TTL error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await this.client!.flushall();
      logger.warn('Redis FLUSHALL executed - all data cleared');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHALL error', error);
      return false;
    }
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis PING error', error);
      return false;
    }
  }
}

// Singleton instance
export const redisClient = new RedisClient();

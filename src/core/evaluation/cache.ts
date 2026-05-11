/**
 * Evaluation Cache - LRU Cache for EvaluatedScene
 *
 * Caches evaluated scenes to avoid re-evaluation.
 * Invalidates on epoch changes.
 *
 * Cache Key: time + epoch + clipVersion
 * Cache Strategy: LRU (Least Recently Used)
 */

import type { EvaluatedScene } from "./types";

/**
 * Cache key for evaluated scenes.
 */
interface CacheKey {
  /** Timeline time (rounded to frame precision) */
  time: number;

  /** Timeline epoch (invalidates on timeline changes) */
  epoch: number;

  /** Clip version (hash of clip IDs and properties) */
  clipVersion: string;
}

/**
 * Cache entry with metadata.
 */
interface CacheEntry {
  key: CacheKey;
  scene: EvaluatedScene;
  timestamp: number;
  hits: number;
}

/**
 * LRU Cache for evaluated scenes.
 */
export class EvaluationCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get cached scene if available.
   */
  get(key: CacheKey): EvaluatedScene | null {
    const cacheKey = this.serializeKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Update access time and hit count
    entry.timestamp = Date.now();
    entry.hits++;
    this.hits++;

    // Move to end (most recently used)
    this.cache.delete(cacheKey);
    this.cache.set(cacheKey, entry);

    return entry.scene;
  }

  /**
   * Store scene in cache.
   */
  set(key: CacheKey, scene: EvaluatedScene): void {
    const cacheKey = this.serializeKey(key);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(cacheKey)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(cacheKey, {
      key,
      scene,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Invalidate all entries for a specific epoch.
   */
  invalidateEpoch(epoch: number): void {
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.key.epoch !== epoch) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + "%",
    };
  }

  /**
   * Serialize cache key to string.
   */
  private serializeKey(key: CacheKey): string {
    // Round time to 3 decimal places (millisecond precision)
    const roundedTime = Math.round(key.time * 1000) / 1000;
    return `${roundedTime}:${key.epoch}:${key.clipVersion}`;
  }
}

/**
 * Global evaluation cache instance.
 */
let globalCache: EvaluationCache | null = null;

/**
 * Get or create global evaluation cache.
 */
export function getEvaluationCache(): EvaluationCache {
  if (!globalCache) {
    globalCache = new EvaluationCache(100);
  }
  return globalCache;
}

/**
 * Reset global cache (for testing).
 */
export function resetEvaluationCache(): void {
  globalCache = null;
}

/**
 * Compute clip version hash.
 * This is a simple hash of clip IDs and key properties.
 * Changes when clips are added/removed/modified.
 */
export function computeClipVersion(clips: Array<{ id: string; startTime: number; duration: number; trackId: string }>): string {
  // Simple hash: concatenate clip IDs and positions
  const signature = clips
    .map((c) => `${c.id}:${c.trackId}:${c.startTime.toFixed(3)}:${c.duration.toFixed(3)}`)
    .sort()
    .join("|");

  // Use a simple hash function
  return hashString(signature);
}

/**
 * Simple string hash function (FNV-1a).
 */
function hashString(str: string): string {
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, "0");
}

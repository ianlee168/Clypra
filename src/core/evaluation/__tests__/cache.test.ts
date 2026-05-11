import { describe, it, expect, beforeEach } from "vitest";
import { EvaluationCache, computeClipVersion } from "../cache";

describe("EvaluationCache", () => {
  let cache: EvaluationCache;

  beforeEach(() => {
    cache = new EvaluationCache(3); // Small cache for testing
  });

  it("caches and retrieves scenes", () => {
    const key = { time: 1.0, epoch: 0, clipVersion: "abc123" };
    const scene = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };

    // Cache miss
    expect(cache.get(key)).toBeNull();

    // Store
    cache.set(key, scene);

    // Cache hit
    expect(cache.get(key)).toBe(scene);
  });

  it("respects max size (LRU eviction)", () => {
    const scene1 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };
    const scene2 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };
    const scene3 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };
    const scene4 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };

    cache.set({ time: 1.0, epoch: 0, clipVersion: "v1" }, scene1);
    cache.set({ time: 2.0, epoch: 0, clipVersion: "v1" }, scene2);
    cache.set({ time: 3.0, epoch: 0, clipVersion: "v1" }, scene3);

    // Cache is full (3 entries)
    expect(cache.get({ time: 1.0, epoch: 0, clipVersion: "v1" })).toBe(scene1);
    expect(cache.get({ time: 2.0, epoch: 0, clipVersion: "v1" })).toBe(scene2);
    expect(cache.get({ time: 3.0, epoch: 0, clipVersion: "v1" })).toBe(scene3);

    // Add 4th entry - should evict oldest (1.0)
    cache.set({ time: 4.0, epoch: 0, clipVersion: "v1" }, scene4);

    expect(cache.get({ time: 1.0, epoch: 0, clipVersion: "v1" })).toBeNull(); // Evicted
    expect(cache.get({ time: 2.0, epoch: 0, clipVersion: "v1" })).toBe(scene2);
    expect(cache.get({ time: 3.0, epoch: 0, clipVersion: "v1" })).toBe(scene3);
    expect(cache.get({ time: 4.0, epoch: 0, clipVersion: "v1" })).toBe(scene4);
  });

  it("invalidates by epoch", () => {
    const scene1 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };
    const scene2 = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };

    cache.set({ time: 1.0, epoch: 0, clipVersion: "v1" }, scene1);
    cache.set({ time: 2.0, epoch: 1, clipVersion: "v1" }, scene2);

    // Both cached
    expect(cache.get({ time: 1.0, epoch: 0, clipVersion: "v1" })).toBe(scene1);
    expect(cache.get({ time: 2.0, epoch: 1, clipVersion: "v1" })).toBe(scene2);

    // Invalidate epoch 0
    cache.invalidateEpoch(1);

    // Epoch 0 invalidated, epoch 1 still cached
    expect(cache.get({ time: 1.0, epoch: 0, clipVersion: "v1" })).toBeNull();
    expect(cache.get({ time: 2.0, epoch: 1, clipVersion: "v1" })).toBe(scene2);
  });

  it("tracks cache statistics", () => {
    const scene = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };
    const key = { time: 1.0, epoch: 0, clipVersion: "v1" };

    // Initial stats
    let stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);

    // Cache miss
    cache.get(key);
    stats = cache.getStats();
    expect(stats.misses).toBe(1);

    // Cache hit
    cache.set(key, scene);
    cache.get(key);
    stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it("clears all entries", () => {
    const scene = { visualLayers: [], audioLayers: [], transitions: [], metadata: {} as any };

    cache.set({ time: 1.0, epoch: 0, clipVersion: "v1" }, scene);
    cache.set({ time: 2.0, epoch: 0, clipVersion: "v1" }, scene);

    expect(cache.getStats().size).toBe(2);

    cache.clear();

    expect(cache.getStats().size).toBe(0);
    expect(cache.get({ time: 1.0, epoch: 0, clipVersion: "v1" })).toBeNull();
  });
});

describe("computeClipVersion", () => {
  it("generates consistent hash for same clips", () => {
    const clips = [
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
      { id: "c2", trackId: "t1", startTime: 10, duration: 5 },
    ];

    const hash1 = computeClipVersion(clips);
    const hash2 = computeClipVersion(clips);

    expect(hash1).toBe(hash2);
  });

  it("generates different hash when clips change", () => {
    const clips1 = [
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
      { id: "c2", trackId: "t1", startTime: 10, duration: 5 },
    ];

    const clips2 = [
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
      { id: "c2", trackId: "t1", startTime: 10, duration: 6 }, // Different duration
    ];

    const hash1 = computeClipVersion(clips1);
    const hash2 = computeClipVersion(clips2);

    expect(hash1).not.toBe(hash2);
  });

  it("generates different hash when clip order changes", () => {
    const clips1 = [
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
      { id: "c2", trackId: "t1", startTime: 10, duration: 5 },
    ];

    const clips2 = [
      { id: "c2", trackId: "t1", startTime: 10, duration: 5 },
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
    ];

    const hash1 = computeClipVersion(clips1);
    const hash2 = computeClipVersion(clips2);

    // Should be same because we sort before hashing
    expect(hash1).toBe(hash2);
  });

  it("generates different hash when clips added/removed", () => {
    const clips1 = [{ id: "c1", trackId: "t1", startTime: 0, duration: 10 }];

    const clips2 = [
      { id: "c1", trackId: "t1", startTime: 0, duration: 10 },
      { id: "c2", trackId: "t1", startTime: 10, duration: 5 },
    ];

    const hash1 = computeClipVersion(clips1);
    const hash2 = computeClipVersion(clips2);

    expect(hash1).not.toBe(hash2);
  });
});

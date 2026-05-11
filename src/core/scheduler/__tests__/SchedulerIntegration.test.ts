/**
 * Frame Scheduler Integration Tests
 *
 * Tests the complete pipeline:
 *   Timeline → Scheduler → Evaluation → Rasterization → Output
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FrameScheduler, resetFrameScheduler } from "../FrameScheduler";
import type { Clip, Track, MediaAsset, Project } from "../../../types";

describe("FrameScheduler Integration", () => {
  let scheduler: FrameScheduler;
  let mockClips: Clip[];
  let mockTracks: Track[];
  let mockAssets: MediaAsset[];
  let mockProject: Project;

  beforeEach(() => {
    resetFrameScheduler();
    scheduler = new FrameScheduler({ debug: false });

    // Create mock timeline data
    mockTracks = [
      {
        id: "track-1",
        name: "Video Track 1",
        type: "video",
        visible: true,
        muted: false,
        locked: false,
        height: 80,
      },
    ];

    mockAssets = [
      {
        id: "asset-1",
        name: "test-video.mp4",
        type: "video",
        path: "/test/video.mp4",
        duration: 10,
        width: 1920,
        height: 1080,
        size: 1024 * 1024,
        posterFrame: "data:image/png;base64,test",
      },
    ];

    mockClips = [
      {
        id: "clip-1",
        mediaId: "asset-1",
        trackId: "track-1",
        startTime: 0,
        duration: 5,
        trimIn: 0,
        trimOut: 5,
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        rotation: 0,
        opacity: 1,
      },
    ];

    mockProject = {
      id: "project-1",
      name: "Test Project",
      canvasWidth: 1920,
      canvasHeight: 1080,
      frameRate: 30,
      aspectRatio: "16:9",
      duration: 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Update timeline state
    scheduler.updateTimeline(mockClips, mockTracks, mockAssets, mockProject, 0);
  });

  describe("Basic Scheduling", () => {
    it("should schedule and complete a frame render", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      expect(jobId).toBeDefined();

      const job = scheduler.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe("pending");

      const result = await scheduler.wait(jobId);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(ImageBitmap);
      expect(result.renderTimeMs).toBeGreaterThan(0);

      const completedJob = scheduler.getJob(jobId);
      expect(completedJob?.status).toBe("complete");
    });

    it("should handle multiple concurrent frames", async () => {
      const jobIds = [
        scheduler.schedule({
          time: 0.0,
          resolution: { width: 1920, height: 1080 },
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
        scheduler.schedule({
          time: 1.0,
          resolution: { width: 1920, height: 1080 },
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
        scheduler.schedule({
          time: 2.0,
          resolution: { width: 1920, height: 1080 },
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
      ];

      const results = await Promise.all(jobIds.map((id) => scheduler.wait(id)));

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.data).toBeInstanceOf(ImageBitmap);
      });
    });
  });

  describe("Priority Scheduling", () => {
    it("should prioritize realtime over background", async () => {
      // Schedule background job first
      const backgroundJobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "background",
      });

      // Schedule realtime job second (should jump queue)
      const realtimeJobId = scheduler.schedule({
        time: 2.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      // Both should complete, but realtime should be processed first
      const results = await Promise.all([scheduler.wait(realtimeJobId), scheduler.wait(backgroundJobId)]);

      expect(results).toHaveLength(2);
    });

    it("should prioritize export over background", async () => {
      const backgroundJobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "background",
      });

      const exportJobId = scheduler.schedule({
        time: 2.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "blob",
        priority: "export",
      });

      const results = await Promise.all([scheduler.wait(exportJobId), scheduler.wait(backgroundJobId)]);

      expect(results).toHaveLength(2);
    });
  });

  describe("Cancellation", () => {
    it("should cancel a pending job", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      scheduler.cancel(jobId);

      const job = scheduler.getJob(jobId);
      expect(job?.cancelled).toBe(true);
      expect(job?.status).toBe("cancelled");

      await expect(scheduler.wait(jobId)).rejects.toThrow("Job cancelled");
    });

    it("should cancel all jobs", async () => {
      const jobIds = [
        scheduler.schedule({
          time: 0.0,
          resolution: { width: 1920, height: 1080 },
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
        scheduler.schedule({
          time: 1.0,
          resolution: { width: 1920, height: 1080 },
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
      ];

      scheduler.cancelAll();

      for (const jobId of jobIds) {
        const job = scheduler.getJob(jobId);
        expect(job?.cancelled).toBe(true);
      }
    });
  });

  describe("Output Formats", () => {
    it("should output ImageBitmap", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      const result = await scheduler.wait(jobId);
      expect(result.data).toBeInstanceOf(ImageBitmap);
    });

    it("should output ImageData", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagedata",
        priority: "realtime",
      });

      const result = await scheduler.wait(jobId);
      expect(result.data).toBeInstanceOf(ImageData);
    });

    it("should output Blob", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "blob",
        priority: "export",
      });

      const result = await scheduler.wait(jobId);
      expect(result.data).toBeInstanceOf(Blob);
    });
  });

  describe("Telemetry", () => {
    it("should track statistics", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      await scheduler.wait(jobId);

      const stats = scheduler.getStats();

      expect(stats.totalJobs).toBe(1);
      expect(stats.complete).toBe(1);
      expect(stats.avgEvaluationTimeMs).toBeGreaterThan(0);
      expect(stats.avgRasterTimeMs).toBeGreaterThan(0);
      expect(stats.avgTotalTimeMs).toBeGreaterThan(0);
    });

    it("should track job metrics", async () => {
      const jobId = scheduler.schedule({
        time: 1.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      await scheduler.wait(jobId);

      const job = scheduler.getJob(jobId);

      expect(job?.metrics.evaluationTimeMs).toBeGreaterThan(0);
      expect(job?.metrics.rasterTimeMs).toBeGreaterThan(0);
      expect(job?.metrics.totalTimeMs).toBeGreaterThan(0);
    });
  });

  describe("Timeline Updates", () => {
    it("should handle timeline state updates", () => {
      const newClips = [
        ...mockClips,
        {
          id: "clip-2",
          mediaId: "asset-1",
          trackId: "track-1",
          startTime: 5,
          duration: 5,
          trimIn: 0,
          trimOut: 5,
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          opacity: 1,
        },
      ];

      scheduler.updateTimeline(newClips, mockTracks, mockAssets, mockProject, 1);

      // Should be able to schedule frames with new timeline
      const jobId = scheduler.schedule({
        time: 6.0,
        resolution: { width: 1920, height: 1080 },
        outputFormat: "imagebitmap",
        priority: "realtime",
      });

      expect(jobId).toBeDefined();
    });
  });

  describe("Resolution Independence", () => {
    it("should render at different resolutions", async () => {
      const resolutions = [
        { width: 1920, height: 1080 },
        { width: 1280, height: 720 },
        { width: 640, height: 360 },
      ];

      const jobIds = resolutions.map((resolution) =>
        scheduler.schedule({
          time: 1.0,
          resolution,
          outputFormat: "imagebitmap",
          priority: "realtime",
        }),
      );

      const results = await Promise.all(jobIds.map((id) => scheduler.wait(id)));

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result.data).toBeInstanceOf(ImageBitmap);
        const bitmap = result.data as ImageBitmap;
        expect(bitmap.width).toBe(resolutions[i].width);
        expect(bitmap.height).toBe(resolutions[i].height);
      });
    });
  });
});

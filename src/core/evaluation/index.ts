/**
 * Evaluation Module - Canonical Timeline Evaluation
 *
 * This is the SINGLE SOURCE OF TRUTH for timeline evaluation.
 *
 * Architecture:
 *
 *   Timeline State
 *        ↓
 *   Evaluation Contract (contract.md)
 *        ↓
 *   Scene Evaluator (evaluator.ts)
 *        ↓
 *   EvaluatedScene (types.ts)
 *        ↓
 *   Render Engine
 *
 * All rendering paths use this:
 * - Preview rendering
 * - Export rendering
 * - Thumbnail generation
 * - Proxy rendering
 * - Timeline validation
 */

// Types
export type { EvaluatedScene, EvaluatedVisualLayer, EvaluatedAudioLayer, EvaluatedTransition, EvaluatedEffect, EvaluatedMask, SceneMetadata, BlendMode, EvaluationCacheKey, EvaluationResult } from "./types";

// Evaluator
export { evaluateScene, evaluateSceneCached, getEvaluationCacheStats, clearEvaluationCache, invalidateEvaluationCache } from "./evaluator";

// Cache
export { getEvaluationCache, resetEvaluationCache, computeClipVersion } from "./cache";
export type { EvaluationCache } from "./cache";

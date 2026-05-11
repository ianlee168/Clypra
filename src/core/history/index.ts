/**
 * History Module - Command-Based Undo/Redo System
 *
 * This is intent-based history, NOT snapshot-based.
 *
 * Architecture:
 *   User Action → Command → HistoryManager → Timeline State → Epoch++
 *
 * Features:
 * - Command pattern (semantic operations)
 * - Transaction support (group commands)
 * - Coalescing (merge similar commands)
 * - Epoch integration (cache invalidation)
 * - Serializable (for collaboration/macros)
 */

// Core types
export type { Command, SerializableCommand } from "./Command";
export { generateCommandId } from "./Command";

// Transaction system
export { Transaction, TransactionState, CompositeCommand } from "./Transaction";

// History manager
export { HistoryManager } from "./HistoryManager";
export type { HistoryConfig, HistoryState } from "./HistoryManager";

// Commands
export * from "./commands";

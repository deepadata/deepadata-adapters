/**
 * DeepaData Zep Adapter
 *
 * EDM enrichment layer for Zep.
 *
 * Zep uses temporal memory scoring for retrieval weighting.
 * EDM's Gravity domain produces structured salience data that
 * maps naturally to Zep's retrieval model.
 *
 * Usage:
 *   const { edmArtifact } = await enrichWithEDM(text, { profile: 'extended' })
 *   await zep.memory.add(sessionId, { messages })  // Zep unchanged
 */

import type { EdmArtifact } from "deepadata-edm-sdk";
import { extractFromContent } from "deepadata-edm-sdk";

/** EDM profile: controls schema depth */
export type EdmProfile = "core" | "extended" | "full";

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  /** EDM profile: "core" (~20 fields), "extended" (~45), "full" (96) */
  profile?: EdmProfile;

  /** LLM provider for extraction */
  provider?: "anthropic" | "openai" | "kimi";

  /** LLM model override */
  model?: string;

  /** Subject ID for the artifact owner */
  subjectId?: string;

  /** Jurisdiction for governance (GDPR, CCPA, etc.) */
  jurisdiction?: "GDPR" | "CCPA" | "HIPAA" | "LGPD" | null;

  /** Consent basis */
  consentBasis?: "consent" | "contract" | "legitimate_interest" | "none";

  /** Visibility level */
  visibility?: "private" | "shared" | "public";

  /** PII sensitivity tier */
  piiTier?: "none" | "low" | "moderate" | "high" | "extreme";

  /** Tags for the artifact */
  tags?: string[];
}

/**
 * Enrichment result with Gravity domain fields highlighted
 */
export interface EnrichmentResult {
  /** The EDM artifact containing emotional context */
  edmArtifact: EdmArtifact;

  /** Extraction confidence (0-1) */
  confidence: number;

  /** Model used for extraction */
  model: string;

  /** Profile used */
  profile: EdmProfile;

  /**
   * Gravity domain fields useful for Zep's temporal scoring.
   * These map naturally to retrieval weighting.
   */
  gravity: {
    /** Emotional salience (0-1) — higher = more significant */
    emotionalWeight: number;
    /** Pattern: cyclical | isolated | chronic | emerging */
    recurrencePattern: string | null;
    /** Overall strength (0-1) */
    strengthScore: number;
    /** Decay rate: slow | moderate | fast */
    temporalDecay: string | null;
  };
}

/**
 * Enrich text input with EDM emotional context.
 *
 * Run this alongside Zep — not instead of it.
 * Zep handles temporal memory. EDM captures emotional salience.
 *
 * The Gravity domain fields (emotional_weight, recurrence_pattern,
 * strength_score, temporal_decay) can inform Zep's retrieval weighting.
 *
 * @example
 * ```typescript
 * const text = "Finally resolved the conflict with my team lead...";
 *
 * // EDM enrichment (emotional salience)
 * const { edmArtifact, gravity } = await enrichWithEDM(text, { profile: 'extended' });
 *
 * // Zep storage (unchanged)
 * await zep.memory.add(sessionId, { messages: [{ role: 'user', content: text }] });
 *
 * // Now you have both:
 * // - Zep memory for temporal retrieval
 * // - EDM gravity data for salience weighting
 * //   gravity.emotionalWeight → boost retrieval relevance
 * //   gravity.recurrencePattern → detect recurring themes
 * ```
 *
 * @param text - The raw text input (same text you send to Zep)
 * @param options - Enrichment options
 * @returns EDM artifact with emotional context and gravity summary
 */
export async function enrichWithEDM(
  text: string,
  options?: EnrichmentOptions
): Promise<EnrichmentResult> {
  // Default to extended profile for Zep — includes full Gravity domain
  const profile = options?.profile ?? "extended";

  const artifact = await extractFromContent({
    content: { text },
    metadata: {
      subjectId: options?.subjectId,
      jurisdiction: options?.jurisdiction,
      consentBasis: options?.consentBasis ?? "consent",
      visibility: options?.visibility ?? "private",
      piiTier: options?.piiTier ?? "moderate",
      tags: options?.tags,
    },
    provider: options?.provider ?? "kimi",
    model: options?.model,
    profile,
  });

  return {
    edmArtifact: artifact,
    confidence: artifact.telemetry.entry_confidence,
    model: artifact.telemetry.extraction_model ?? "unknown",
    profile,
    gravity: {
      emotionalWeight: artifact.gravity.emotional_weight,
      recurrencePattern: artifact.gravity.recurrence_pattern,
      strengthScore: artifact.gravity.strength_score,
      temporalDecay: artifact.gravity.temporal_decay,
    },
  };
}

// Re-export useful types from SDK
export type { EdmArtifact } from "deepadata-edm-sdk";

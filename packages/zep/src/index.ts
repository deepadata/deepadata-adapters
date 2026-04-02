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
export type EdmProfile = "essential" | "extended" | "full";

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  /** EDM profile: "essential" (~20 fields), "extended" (~45), "full" (96) */
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
 * Gravity domain summary for Zep's temporal scoring
 */
export interface GravitySummary {
  /** Emotional salience (0-1) — higher = more significant */
  emotionalWeight: number;
  /** Pattern: cyclical | isolated | chronic | emerging */
  recurrencePattern: string | null;
  /** Overall strength (0-1) */
  strengthScore: number;
  /** Decay rate: slow | moderate | fast */
  temporalDecay: string | null;
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
   *
   * NOTE: Only available for 'extended' and 'full' profiles.
   * Returns null for 'essential' profile (no Gravity domain).
   */
  gravity: GravitySummary | null;
}

/**
 * Options for significance-based query routing
 */
export interface SignificanceQueryOptions {
  query: string;
  subjectVpId?: string;
  topK?: number;
  apiKey?: string;
}

/**
 * A field filter returned by /v1/activate
 */
export interface FieldFilter {
  field: string;
  operator: 'gte' | 'eq' | 'not_null' | 'in';
  value: unknown;
  weight: number;
}

/**
 * Result from queryBySignificance
 */
export interface SignificanceQueryResult {
  arcTypes: string[];
  primaryDomain: string | null;
  fieldFilters: FieldFilter[];
  confidence: number;
  significanceGate: boolean;
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

  const artifact = (await extractFromContent({
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
  })) as EdmArtifact;

  // Gravity domain only exists in extended and full profiles
  // Essential profile does not include gravity
  const hasGravity = profile !== "essential" && artifact.gravity;
  const gravity: GravitySummary | null = hasGravity
    ? {
        emotionalWeight: artifact.gravity.emotional_weight,
        recurrencePattern: artifact.gravity.recurrence_pattern,
        strengthScore: artifact.gravity.strength_score,
        temporalDecay: artifact.gravity.temporal_decay,
      }
    : null;

  return {
    edmArtifact: artifact,
    confidence: artifact.telemetry.entry_confidence,
    model: artifact.telemetry.extraction_model ?? "unknown",
    profile,
    gravity,
  };
}

/**
 * Translate a natural language query into EDM significance field filters.
 *
 * Call /v1/activate then apply the returned field_filters to your
 * Zep storage alongside semantic search.
 *
 * @example
 * ```typescript
 * const { fieldFilters } = await queryBySignificance({
 *   query: 'when was I happiest with mum',
 *   subjectVpId: userId,
 *   apiKey: process.env.DEEPADATA_API_KEY,
 * })
 * // Apply fieldFilters to your memory system query
 * ```
 */
export async function queryBySignificance(
  options: SignificanceQueryOptions
): Promise<SignificanceQueryResult> {
  const apiKey = options.apiKey ?? process.env.DEEPADATA_API_KEY

  if (!apiKey) {
    throw new Error(
      'DEEPADATA_API_KEY is required for queryBySignificance. ' +
      'Pass apiKey option or set DEEPADATA_API_KEY env var.'
    )
  }

  const baseUrl = process.env.DEEPADATA_API_URL ?? 'https://deepadata.com'

  const response = await fetch(
    `${baseUrl}/api/v1/activate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: options.query,
        subject_vp_id: options.subjectVpId,
        top_k: options.topK ?? 10,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `queryBySignificance failed: ${response.status} ` +
      `${(error as Record<string, unknown>).error ?? ''}`
    )
  }

  const result = await response.json()
  const data = result.data

  return {
    arcTypes: data.arc_types ?? [],
    primaryDomain: data.primary_domain ?? null,
    fieldFilters: data.field_filters ?? [],
    confidence: data.confidence ?? 0,
    significanceGate: data.significance_gate ?? false,
  }
}

// Re-export useful types from SDK
export type { EdmArtifact } from "deepadata-edm-sdk";

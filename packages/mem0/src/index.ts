/**
 * DeepaData Mem0 Adapter
 *
 * EDM enrichment layer for Mem0.
 *
 * Mem0 stores what was said.
 * EDM captures the emotional context of why it mattered —
 * as a governed, portable artifact.
 *
 * Usage:
 *   const { edmArtifact } = await enrichWithEDM(text, { profile: 'essential' })
 *   await mem0.add(text, { user_id: 'user123' })  // Mem0 unchanged
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
 * Enrichment result
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
}

/**
 * Enrich text input with EDM emotional context.
 *
 * Run this alongside Mem0 — not instead of it.
 * Mem0 stores the memory. EDM captures the emotional context.
 *
 * @example
 * ```typescript
 * const text = "Had an amazing conversation with Sarah about our startup idea...";
 *
 * // EDM enrichment (emotional context)
 * const { edmArtifact } = await enrichWithEDM(text, { profile: 'essential' });
 *
 * // Mem0 storage (unchanged)
 * await mem0.add(text, { user_id: 'user123' });
 *
 * // Now you have both:
 * // - Mem0 memory for retrieval
 * // - EDM artifact for emotional governance
 * ```
 *
 * @param text - The raw text input (same text you send to Mem0)
 * @param options - Enrichment options
 * @returns EDM artifact with emotional context
 */
export async function enrichWithEDM(
  text: string,
  options?: EnrichmentOptions
): Promise<EnrichmentResult> {
  const profile = options?.profile ?? "essential";

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

  return {
    edmArtifact: artifact,
    confidence: artifact.telemetry.entry_confidence,
    model: artifact.telemetry.extraction_model ?? "unknown",
    profile,
  };
}

// Re-export useful types from SDK
export type { EdmArtifact } from "deepadata-edm-sdk";

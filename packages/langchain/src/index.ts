/**
 * DeepaData LangChain Adapter
 *
 * EDM enrichment layer for LangChain.
 *
 * LangChain has the widest developer surface area. EDM Core Profile
 * provides a governed emotional schema layer on top of any LangChain
 * memory (ConversationBufferMemory, VectorStoreRetrieverMemory, etc.)
 *
 * Usage:
 *   const { edmArtifact } = await enrichWithEDM(text, { profile: 'core' })
 *   await memory.saveContext({ input }, { output })  // LangChain unchanged
 */

import type { EdmArtifact, EdmProfile } from "deepadata-edm-sdk";
import { extractFromContent } from "deepadata-edm-sdk";

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
  consentBasis?: "consent" | "contract" | "legitimate_interest" | "legal_obligation" | "vital_interest" | "public_task" | "none";

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
 * Run this alongside LangChain memory — not instead of it.
 * LangChain stores conversation context. EDM captures emotional governance.
 *
 * Works with any LangChain memory type:
 * - ConversationBufferMemory
 * - ConversationSummaryMemory
 * - VectorStoreRetrieverMemory
 * - ConversationKGMemory
 * - etc.
 *
 * @example
 * ```typescript
 * const input = "I'm feeling overwhelmed with the project deadline...";
 * const output = "I understand. Let's break this down into smaller tasks.";
 *
 * // EDM enrichment (emotional context)
 * const { edmArtifact } = await enrichWithEDM(input, { profile: 'core' });
 *
 * // LangChain memory (unchanged)
 * await memory.saveContext({ input }, { output });
 *
 * // Now you have both:
 * // - LangChain memory for conversation context
 * // - EDM artifact for emotional governance
 * ```
 *
 * @param text - The raw text input (user message, context, etc.)
 * @param options - Enrichment options
 * @returns EDM artifact with emotional context
 */
export async function enrichWithEDM(
  text: string,
  options?: EnrichmentOptions
): Promise<EnrichmentResult> {
  const profile = options?.profile ?? "core";

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
  };
}

// Re-export useful types from SDK
export type { EdmArtifact, EdmProfile } from "deepadata-edm-sdk";

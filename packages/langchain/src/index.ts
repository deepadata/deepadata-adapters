/**
 * DeepaData LangChain Adapter
 *
 * EDM enrichment layer for LangChain.
 *
 * LangChain has the widest developer surface area. EDM Essential profile
 * provides a governed emotional schema layer on top of any LangChain
 * memory (ConversationBufferMemory, VectorStoreRetrieverMemory, etc.)
 *
 * Usage:
 *   const { edmArtifact } = await enrichWithEDM(text, { profile: 'essential' })
 *   await memory.saveContext({ input }, { output })  // LangChain unchanged
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
 * const { edmArtifact } = await enrichWithEDM(input, { profile: 'essential' });
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

/**
 * Translate a natural language query into EDM significance field filters.
 *
 * Call /v1/activate then apply the returned field_filters to your
 * LangChain memory system alongside semantic search.
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

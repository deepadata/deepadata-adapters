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

import type { EdmArtifact, ActivateResult, FeedbackOptions } from "deepadata-edm-sdk";
import { extractFromContent, activate, feedback } from "deepadata-edm-sdk";
import {
  createAnthropicClient,
  createOpenAIClient,
  createKimiClient,
  extractWithLlm,
  extractWithOpenAI,
  extractWithKimi,
  getKimiModelId,
  assembleProfileArtifact,
} from "ddna-tools";

/**
 * EDM canonical profile.
 *
 * Partner profiles (`partner:<id>`) are intentionally not part of this
 * type. The registry that resolves partner-profile prompts is gated
 * by ADR-0012 and is not yet shipped; until then, any `partner:` value
 * silently falls through to the full-profile prompt. Re-add when the
 * registry exists per ADR-0012 / ADR-0017.
 */
export type EdmProfile = "essential" | "extended" | "full";

const CANONICAL_PROFILES: ReadonlySet<string> = new Set([
  "essential",
  "extended",
  "full",
]);

/**
 * Enrichment options
 */
export interface EnrichmentOptions {
  /** EDM profile: "essential" (~24 fields), "extended" (~50), "full" (96) */
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

/** @deprecated Use ActivateResult from deepadata-edm-sdk */
export type SignificanceQueryResult = ActivateResult;

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
 * Canonical profiles (essential / extended / full) extract via ddna-tools
 * v0.3.0 (MIT, BYOK). Non-canonical string values fall back to the SDK
 * extraction path with a deprecation warning.
 *
 * @param text - The raw text input (user message, context, etc.)
 * @param options - Enrichment options
 * @returns EDM artifact with emotional context
 */
export async function enrichWithEDM(
  text: string,
  options?: EnrichmentOptions
): Promise<EnrichmentResult> {
  const profile = (options?.profile ?? "essential") as string;
  const provider = options?.provider ?? "kimi";

  const metadata = {
    subjectId: options?.subjectId,
    jurisdiction: options?.jurisdiction ?? undefined,
    consentBasis: options?.consentBasis ?? "consent",
    visibility: options?.visibility ?? "private",
    piiTier: options?.piiTier ?? "moderate",
    tags: options?.tags,
  } as const;

  if (CANONICAL_PROFILES.has(profile)) {
    const canonical = profile as "essential" | "extended" | "full";
    const llmResult =
      provider === "openai"
        ? await extractWithOpenAI(createOpenAIClient(), { text }, options?.model, 0, canonical)
        : provider === "anthropic"
        ? await extractWithLlm(createAnthropicClient(), { text }, options?.model, canonical)
        : await extractWithKimi(
            createKimiClient(),
            { text },
            options?.model ?? getKimiModelId(),
            canonical
          );

    const artifact = assembleProfileArtifact(
      llmResult.extracted as unknown as Record<string, unknown>,
      metadata,
      {
        confidence: llmResult.confidence,
        model: llmResult.model,
        profile: canonical,
        provider,
        notes: llmResult.notes,
        hasText: true,
        hasImage: false,
      }
    ) as unknown as EdmArtifact;

    return {
      edmArtifact: artifact,
      confidence: artifact.telemetry.entry_confidence,
      model: artifact.telemetry.extraction_model ?? "unknown",
      profile: canonical,
    };
  }

  console.warn(
    `[deepadata-langchain-adapter] profile "${profile}" is not canonical; ` +
      `falling back to SDK extraction. This path is deprecated and will be ` +
      `removed once partner-profile registry support lands (ADR-0012).`
  );

  const sdkArtifact = (await extractFromContent({
    content: { text },
    metadata,
    provider,
    model: options?.model,
    profile: profile as "essential" | "extended" | "full",
  })) as EdmArtifact;

  return {
    edmArtifact: sdkArtifact,
    confidence: sdkArtifact.telemetry.entry_confidence,
    model: sdkArtifact.telemetry.extraction_model ?? "unknown",
    profile: profile as EdmProfile,
  };
}

/**
 * Translate a natural language query into EDM significance field filters.
 *
 * Calls activate() from deepadata-edm-sdk then returns field_filters
 * to apply to your LangChain memory system alongside semantic search.
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
): Promise<ActivateResult> {
  const activateResult = await activate(options.query, {
    apiKey: options.apiKey,
    subjectVpId: options.subjectVpId,
    topK: options.topK,
  })

  return activateResult
}

// Re-export useful types and functions from SDK
export type { EdmArtifact, ActivateResult, FeedbackOptions } from "deepadata-edm-sdk";
export { activate, feedback } from "deepadata-edm-sdk";

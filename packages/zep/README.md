# deepadata-zep-adapter

Zep handles retrieval. EDM encodes what's worth retrieving.

Most memory systems score relevance at retrieval time. EDM encodes significance at capture time — 57 affective fields including emotional_weight, arc_type, recall_triggers, and identity_thread. The artifact knows what mattered before any query is asked.

This adapter runs EDM extraction alongside Zep — not replacing what Zep does, completing it.

## Installation

```bash
npm install deepadata-zep-adapter
```

`ddna-tools` (MIT) and `deepadata-edm-sdk` are pulled in transitively. Canonical extraction (`essential | extended | full`) routes through `ddna-tools` v0.3.0 per ADR-0023; the SDK is retained for activation, feedback, and as a fallback path.

## Why significance matters

In a controlled retrieval comparison, EDM field routing outperformed raw vector similarity by 55.6 percentage points on significance-typed queries — queries like "what has this person been working through all along?" that have zero lexical overlap with the answer.

Raw vector similarity answers factual queries well. It structurally cannot answer significance queries. EDM can.

## Usage

```typescript
import { enrichWithEDM } from 'deepadata-zep-adapter';
import { ZepClient } from '@getzep/zep-cloud';

const zep = new ZepClient({ apiKey: process.env.ZEP_API_KEY });
const text = "Finally resolved the conflict with my team lead. It's been weighing on me for months but we talked it through and I feel like a weight has been lifted.";

// EDM enrichment (emotional salience)
const { edmArtifact, gravity } = await enrichWithEDM(text, { profile: 'extended' });

// Zep storage (unchanged — Zep does what Zep does)
await zep.memory.add(sessionId, {
  messages: [{ role: 'user', content: text }],
});

// Now you have both:
// - Zep memory for temporal retrieval
// - EDM artifact for emotional governance
//
// Gravity domain fields for retrieval weighting:
//   gravity.emotionalWeight  → 0.85 (high significance)
//   gravity.recurrencePattern → "chronic" (ongoing theme)
//   gravity.strengthScore    → 0.9
//   gravity.temporalDecay    → "slow" (long-lasting impact)
```

## Querying by significance

After capturing with enrichWithEDM, query by emotional significance using /v1/activate:

```typescript
import { queryBySignificance } from 'deepadata-zep-adapter'

const { fieldFilters, arcTypes, significanceGate } = await queryBySignificance({
  query: 'when was I happiest with mum',
  subjectVpId: userId,
})

// fieldFilters contains ranked EDM field filters to apply to
// your memory system alongside semantic search.
// Example:
// [
//   { field: 'emotional_weight', operator: 'gte', value: 0.6, weight: 0.82 },
//   { field: 'tether_type', operator: 'not_null', weight: 0.74 }
// ]
```

The significance channel runs alongside your existing semantic search — it finds what similarity misses. 94.4% hit rate on significance-typed queries vs 33.3% raw vector similarity.

## Gravity Domain → Zep Scoring

EDM's Gravity domain produces structured salience data that maps naturally to Zep's temporal memory scoring:

| EDM Gravity Field | Zep Use Case |
|-------------------|--------------|
| `emotional_weight` (0-1) | Boost retrieval relevance for high-salience memories |
| `recurrence_pattern` | Detect chronic vs isolated themes (cyclical, isolated, chronic, emerging) |
| `strength_score` (0-1) | Weight memory importance in search results |
| `temporal_decay` | Adjust decay rate based on emotional permanence (slow, moderate, fast) |

## What You Get

From the same text input, you now have:

| Zep | EDM |
|-----|-----|
| Stores temporal memory | Captures emotional context |
| Scores for retrieval | Scores for salience |
| Platform-specific | Portable standard |
| When it happened | Why it mattered |

## API

### `enrichWithEDM(text, options?)`

```typescript
const { edmArtifact, confidence, model, profile, gravity } = await enrichWithEDM(text, {
  // EDM profile (default: "extended" for Zep)
  profile: "extended",  // includes full Gravity domain

  // LLM provider (default: "anthropic")
  provider: "anthropic",

  // Governance
  subjectId: "user123",
  jurisdiction: "GDPR",
  consentBasis: "consent",
});

// Gravity summary for quick access
console.log(gravity.emotionalWeight);    // 0.85
console.log(gravity.recurrencePattern);  // "chronic"
console.log(gravity.strengthScore);      // 0.9
console.log(gravity.temporalDecay);      // "slow"
```

## Profiles

| Profile | Fields | Use Case |
|---------|--------|----------|
| **essential** | ~24 | Basic emotional context (no Gravity domain) |
| **extended** | ~50 | Full Gravity domain (recommended for Zep) |
| **full** | 96 | Clinical, therapeutic applications |

For Zep integrations, `extended` profile is recommended to get all Gravity fields.

> **Note:** The `gravity` field in the result is `null` when using `essential` profile since it doesn't include the Gravity domain.

> Partner profiles (`partner:<id>`) are not yet supported by this adapter.
> Registry resolution lands with ADR-0012; until then, the adapter accepts
> only canonical profile values.

## Why Both?

Zep excels at temporal memory — knowing what happened when and retrieving relevant context. But enterprise customers ask:

- "How do you weight memory importance?"
- "Can you detect emotionally significant patterns?"
- "How do you handle GDPR for emotional data?"

EDM answers these with structured salience data:
- **Gravity domain** — emotional_weight, recurrence_pattern, strength_score, temporal_decay
- **Governance domain** — consent, retention, subject rights
- **Portable format** — moves with the user, not locked to Zep

## Commercial Boundary

Three classes of surface across the EDM stack — free, metered, and subscription. Per ADR-0022 the moat is artifact + activation + registry: extraction is open and unmetered; activation, feedback, and certification are paid.

| Surface | Where it lives | Commercial model |
|---|---|---|
| Canonical extraction (`essential` / `extended` / `full`) | `ddna-tools` (MIT) | **Free** — bring your own LLM key |
| Local seal / verify (Ed25519, W3C Data Integrity Proofs) | `ddna-tools` (MIT) | **Free** — no network call |
| `queryBySignificance` → `/v1/activate` | `deepadata-com` API | **Metered** — requires `DEEPADATA_API_KEY` |
| `feedback` → `/v1/feedback` | `deepadata-com` API | **Metered** — requires `DEEPADATA_API_KEY` |
| Reasoning queries → `/v1/activate_reason` (ADR-0018; adapter wrapper pending) | `deepadata-com` API | **Metered** (reasoning premium) |
| Certification → `/v1/issue` | `deepadata-com` API | **Subscription** |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude extraction (default) |
| `OPENAI_API_KEY` | GPT extraction |
| `MOONSHOT_API_KEY` | Kimi extraction |
| `DEEPADATA_API_KEY` | DeepaData account API key; required for activation queries (`queryBySignificance`). Not required for extraction (uses your LLM provider key directly). |

## Related

- [deepadata-edm-sdk](https://github.com/deepadata/deepadata-edm-sdk) — Core SDK
- [ddna-tools](https://github.com/emotional-data-model/ddna-tools) — Signing and verification
- [deepadata-mem0-adapter](https://github.com/deepadata/deepadata-mem0-adapter) — Mem0 enrichment

## License

MIT

# deepadata-langchain-adapter

LangChain handles retrieval. EDM encodes what's worth retrieving.

Most memory systems score relevance at retrieval time. EDM encodes significance at capture time — 57 affective fields including emotional_weight, arc_type, recall_triggers, and identity_thread. The artifact knows what mattered before any query is asked.

This adapter runs EDM extraction alongside LangChain — not replacing what LangChain does, completing it.

## Installation

```bash
npm install deepadata-langchain-adapter
```

`ddna-tools` (MIT) and `deepadata-edm-sdk` are pulled in transitively. Canonical extraction (`essential | extended | full`) routes through `ddna-tools` v0.3.0 per ADR-0023; the SDK is retained for activation, feedback, and as a fallback path.

## Why significance matters

In a controlled retrieval comparison, EDM field routing outperformed raw vector similarity by 55.6 percentage points on significance-typed queries — queries like "what has this person been working through all along?" that have zero lexical overlap with the answer.

Raw vector similarity answers factual queries well. It structurally cannot answer significance queries. EDM can.

## Usage

```typescript
import { enrichWithEDM } from 'deepadata-langchain-adapter';
import { ConversationBufferMemory } from 'langchain/memory';

const memory = new ConversationBufferMemory();
const input = "I'm feeling overwhelmed with the project deadline. Nothing seems to be going right.";
const output = "I understand that feeling. Let's break this down into smaller, manageable tasks.";

// EDM enrichment (emotional context)
const { edmArtifact } = await enrichWithEDM(input, { profile: 'essential' });

// LangChain memory (unchanged — LangChain does what LangChain does)
await memory.saveContext({ input }, { output });

// Now you have both:
// - LangChain memory for conversation context
// - EDM artifact for emotional governance and portability
```

## Querying by significance

After capturing with enrichWithEDM, query by emotional significance using /v1/activate:

```typescript
import { queryBySignificance } from 'deepadata-langchain-adapter'

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

## Works With Any Memory Type

EDM enrichment works alongside any LangChain memory:

```typescript
// ConversationBufferMemory
const buffer = new ConversationBufferMemory();
const { edmArtifact } = await enrichWithEDM(input);
await buffer.saveContext({ input }, { output });

// ConversationSummaryMemory
const summary = new ConversationSummaryMemory({ llm });
const { edmArtifact } = await enrichWithEDM(input);
await summary.saveContext({ input }, { output });

// VectorStoreRetrieverMemory
const vectorMemory = new VectorStoreRetrieverMemory({ vectorStoreRetriever });
const { edmArtifact } = await enrichWithEDM(input);
await vectorMemory.saveContext({ input }, { output });

// The EDM artifact travels alongside, not replacing, the LangChain memory
```

## What You Get

From the same text input, you now have:

| LangChain | EDM |
|-----------|-----|
| Stores conversation | Captures emotional context |
| Enables retrieval | Enables governance |
| Platform-specific | Portable standard |
| What was said | Why it mattered |

## API

### `enrichWithEDM(text, options?)`

```typescript
const { edmArtifact, confidence, model, profile } = await enrichWithEDM(text, {
  // EDM profile (default: "core")
  profile: "essential",  // ~20 fields, lightweight for LangChain

  // LLM provider (default: "anthropic")
  provider: "anthropic",  // or "openai" | "kimi"

  // Governance
  subjectId: "user123",
  jurisdiction: "GDPR",
  consentBasis: "consent",

  // Classification
  visibility: "private",
  piiTier: "moderate",
  tags: ["support", "emotional"],
});
```

## Profiles

| Profile | Fields | Use Case |
|---------|--------|----------|
| **essential** | 24 | LangChain memory enrichment (recommended) |
| **extended** | 50 | Journaling, wellness applications |
| **full** | 96 | Clinical, therapeutic applications |

For LangChain integrations, `essential` profile is recommended — lightweight enough to not impact chain performance.

> Partner profiles (`partner:<id>`) are not yet supported by this adapter.
> Registry resolution lands with ADR-0012; until then, the adapter accepts
> only canonical profile values.

## Why Both?

LangChain memory modules are excellent for conversation persistence and retrieval. But production deployments need answers to:

- "What schema does the memory follow?"
- "Who owns this conversation data?"
- "How do I handle a GDPR deletion request?"
- "Can users export their data?"

EDM answers these with a governed artifact:
- **Schema**: 20 validated fields in essential profile
- **Governance**: Consent basis, retention policy, subject rights
- **Portability**: Standard format, not locked to LangChain
- **MIT licensed**: No vendor dependency

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
- [deepadata-zep-adapter](https://github.com/deepadata/deepadata-zep-adapter) — Zep enrichment

## License

MIT

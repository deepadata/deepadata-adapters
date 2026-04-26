# deepadata-mem0-adapter

Mem0 handles retrieval. EDM encodes what's worth retrieving.

Most memory systems score relevance at retrieval time. EDM encodes significance at capture time — 57 affective fields including emotional_weight, arc_type, recall_triggers, and identity_thread. The artifact knows what mattered before any query is asked.

This adapter runs EDM extraction alongside Mem0 — not replacing what Mem0 does, completing it.

## Installation

```bash
npm install deepadata-mem0-adapter
```

`ddna-tools` (MIT) and `deepadata-edm-sdk` are pulled in transitively. Canonical extraction (`essential | extended | full`) routes through `ddna-tools` v0.3.0 per ADR-0023; the SDK is retained for activation, feedback, and as a fallback path.

## Why significance matters

In a controlled retrieval comparison, EDM field routing outperformed raw vector similarity by 55.6 percentage points on significance-typed queries — queries like "what has this person been working through all along?" that have zero lexical overlap with the answer.

Raw vector similarity answers factual queries well. It structurally cannot answer significance queries. EDM can.

## Usage

```typescript
import { enrichWithEDM } from 'deepadata-mem0-adapter';
import MemoryClient from 'mem0ai';

const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
const text = "Had an amazing conversation with Sarah about our startup idea. She really gets the vision and I feel so energized about what we're building together.";

// EDM enrichment (emotional context)
const { edmArtifact } = await enrichWithEDM(text, { profile: 'essential' });

// Mem0 storage (unchanged — Mem0 does what Mem0 does)
await mem0.add(text, { user_id: 'user123' });

// Now you have both:
// - Mem0 memory for retrieval and personalization
// - EDM artifact for emotional governance and portability
```

## Querying by significance

After capturing with enrichWithEDM, query by emotional significance using /v1/activate:

```typescript
import { queryBySignificance } from 'deepadata-mem0-adapter'

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

## Querying by reasoning

Where `queryBySignificance` returns ranked field filters for you to apply to your own retrieval, `queryByReasoning` runs the full three-step pipeline server-side via `/v1/activate_reason` (ADR-0018) — classify the query, retrieve 50 candidates from TurboPuffer, reason over them with Kimi K2, return the answer plus the sources that informed it.

```typescript
import { queryByReasoning } from 'deepadata-mem0-adapter'

const { answer, sources, reasoningFieldsUsed, significanceGate } = await queryByReasoning({
  query: 'what has this person been working through all along',
  namespace: userNamespace,
  subjectVpId: userId,
  apiKey: process.env.DEEPADATA_API_KEY,
})

// `answer` — reasoned response grounded in retrieved candidates
// `sources` — top artifacts (date, narrative, arc_type, emotional_weight,
//   identity_thread, tether_type) that informed the answer
// `reasoningFieldsUsed` — the EDM fields the model attended to
// `significanceGate` — false when the query is not significance-typed;
//   answer and sources are empty in that case
```

This is the **reasoning premium** surface — metered separately from `/v1/activate` per the ADR-0022 pricing table. Requires `DEEPADATA_API_KEY`.

## What You Get

From the same text input, you now have:

| Mem0 | EDM |
|------|-----|
| Stores the memory | Captures emotional context |
| Enables retrieval | Enables governance |
| Platform-specific | Portable standard |
| What was said | Why it mattered |

## API

### `enrichWithEDM(text, options?)`

```typescript
const { edmArtifact, confidence, model, profile } = await enrichWithEDM(text, {
  // EDM profile (default: "core")
  profile: "essential",  // ~20 fields, ideal for memory platforms

  // LLM provider (default: "anthropic")
  provider: "anthropic",  // or "openai" | "kimi"

  // Governance
  subjectId: "user123",
  jurisdiction: "GDPR",
  consentBasis: "consent",

  // Classification
  visibility: "private",
  piiTier: "moderate",
  tags: ["startup", "collaboration"],
});
```

## Profiles

| Profile | Fields | Use Case |
|---------|--------|----------|
| **essential** | 24 | Memory platforms (Mem0, Zep, LangChain) |
| **extended** | 50 | Journaling apps, wellness tools |
| **full** | 96 | Clinical, therapeutic applications |

For Mem0 integrations, `essential` profile is recommended.

> Partner profiles (`partner:<id>`) are not yet supported by this adapter.
> Registry resolution lands with ADR-0012; until then, the adapter accepts
> only canonical profile values.

## Why Both?

Mem0 is excellent at what it does — storing and retrieving memories for AI personalization. But enterprise customers ask:

- "What emotional data are you storing?"
- "Who owns this data?"
- "Can users export their memories?"
- "How do you handle GDPR requests?"

EDM answers these questions with a governed artifact format that includes:
- **Consent basis** — why you're allowed to process this
- **Subject rights** — portable, erasable, explainable
- **Retention policy** — how long, what happens on expiry
- **Emotional schema** — 20 fields that capture context, not just content

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

## License

MIT

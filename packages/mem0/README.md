# deepadata-mem0-adapter

Mem0 handles retrieval. EDM encodes what's worth retrieving.

Most memory systems score relevance at retrieval time. EDM encodes significance at capture time — 57 affective fields including emotional_weight, arc_type, recall_triggers, and identity_thread. The artifact knows what mattered before any query is asked.

This adapter runs EDM extraction alongside Mem0 — not replacing what Mem0 does, completing it.

## Installation

```bash
npm install deepadata-mem0-adapter deepadata-edm-sdk
```

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

# deepadata-mem0-adapter

EDM enrichment layer for [Mem0](https://mem0.ai).

**Mem0 stores what was said. EDM captures the emotional context of why it mattered — as a governed, portable artifact.**

## Installation

```bash
npm install deepadata-mem0-adapter deepadata-edm-sdk
```

## Usage

```typescript
import { enrichWithEDM } from 'deepadata-mem0-adapter';
import MemoryClient from 'mem0ai';

const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY });
const text = "Had an amazing conversation with Sarah about our startup idea. She really gets the vision and I feel so energized about what we're building together.";

// EDM enrichment (emotional context)
const { edmArtifact } = await enrichWithEDM(text, { profile: 'core' });

// Mem0 storage (unchanged — Mem0 does what Mem0 does)
await mem0.add(text, { user_id: 'user123' });

// Now you have both:
// - Mem0 memory for retrieval and personalization
// - EDM artifact for emotional governance and portability
```

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
  profile: "core",  // ~20 fields, ideal for memory platforms

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
| **core** | ~20 | Memory platforms (Mem0, Zep, LangChain) |
| **extended** | ~45 | Journaling apps, wellness tools |
| **full** | 96 | Clinical, therapeutic applications |

For Mem0 integrations, `core` profile is recommended.

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

## Related

- [deepadata-edm-sdk](https://github.com/deepadata/deepadata-edm-sdk) — Core SDK
- [deepadata-ddna-tools](https://github.com/deepadata/deepadata-ddna-tools) — Signing and verification

## License

MIT

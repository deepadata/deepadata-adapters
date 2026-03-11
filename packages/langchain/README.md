# deepadata-langchain-adapter

EDM enrichment layer for [LangChain](https://langchain.com).

**LangChain stores conversation context. EDM captures the emotional governance of that context — as a portable, schema-validated artifact.**

## Installation

```bash
npm install deepadata-langchain-adapter deepadata-edm-sdk
```

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
| **essential** | ~20 | LangChain memory enrichment (recommended) |
| **extended** | ~45 | Journaling, wellness applications |
| **full** | 96 | Clinical, therapeutic applications |

For LangChain integrations, `essential` profile is recommended — lightweight enough to not impact chain performance.

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

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude extraction (default) |
| `OPENAI_API_KEY` | GPT extraction |
| `MOONSHOT_API_KEY` | Kimi extraction |

## Related

- [deepadata-edm-sdk](https://github.com/deepadata/deepadata-edm-sdk) — Core SDK
- [ddna-tools](https://github.com/emotional-data-model/ddna-tools) — Signing and verification
- [deepadata-mem0-adapter](https://github.com/deepadata/deepadata-mem0-adapter) — Mem0 enrichment
- [deepadata-zep-adapter](https://github.com/deepadata/deepadata-zep-adapter) — Zep enrichment

## License

MIT

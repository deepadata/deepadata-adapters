# deepadata-zep-adapter

EDM enrichment layer for [Zep](https://www.getzep.com).

**Zep scores temporal memory for retrieval. EDM captures the emotional salience of why those memories matter — as structured data that maps to Zep's weighting model.**

## Installation

```bash
npm install deepadata-zep-adapter deepadata-edm-sdk
```

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

## Why Both?

Zep excels at temporal memory — knowing what happened when and retrieving relevant context. But enterprise customers ask:

- "How do you weight memory importance?"
- "Can you detect emotionally significant patterns?"
- "How do you handle GDPR for emotional data?"

EDM answers these with structured salience data:
- **Gravity domain** — emotional_weight, recurrence_pattern, strength_score, temporal_decay
- **Governance domain** — consent, retention, subject rights
- **Portable format** — moves with the user, not locked to Zep

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude extraction (default) |
| `OPENAI_API_KEY` | GPT extraction |
| `MOONSHOT_API_KEY` | Kimi extraction |

## Related

- [deepadata-edm-sdk](https://github.com/deepadata/deepadata-edm-sdk) — Core SDK
- [deepadata-ddna-tools](https://github.com/emotional-data-model/ddna-tools) — Signing and verification
- [deepadata-mem0-adapter](https://github.com/deepadata/deepadata-mem0-adapter) — Mem0 enrichment

## License

MIT

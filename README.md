# deepadata-adapters

EDM enrichment adapters for memory platforms.

**Memory platforms store what was said. EDM captures the emotional context of why it mattered — as a governed, portable artifact.**

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@deepadata/mem0-adapter](./packages/mem0) | EDM enrichment for Mem0 | `npm install @deepadata/mem0-adapter` |
| [@deepadata/zep-adapter](./packages/zep) | EDM enrichment for Zep | `npm install @deepadata/zep-adapter` |
| [@deepadata/langchain-adapter](./packages/langchain) | EDM enrichment for LangChain | `npm install @deepadata/langchain-adapter` |

## Architecture

All adapters follow the **enrichment layer pattern**:

```typescript
// EDM enrichment runs ALONGSIDE your memory platform, not instead of it
const { edmArtifact } = await enrichWithEDM(text, { profile: 'essential' });

// Your memory platform continues unchanged
await mem0.add(text, { user_id: 'user123' });
await zep.memory.add(sessionId, { messages });
await memory.saveContext({ input }, { output });
```

## Profiles

| Profile | Fields | Use Case |
|---------|--------|----------|
| **essential** | 24 | Memory platforms, agent frameworks (default for Mem0, LangChain) |
| **extended** | 50 | Journaling, companion AI, workplace wellness (default for Zep) |
| **full** | 96 | Clinical, therapeutic, regulated systems |

## Provider Selection

All adapters default to **Kimi K2** for cost optimization. For GDPR Article 9 or HIPAA regulated deployments, specify `anthropic` or `openai`:

```typescript
const { edmArtifact } = await enrichWithEDM(text, {
  profile: 'essential',
  provider: 'anthropic',  // EU/US compliance
});
```

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

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Typecheck all packages
npm run typecheck
```

## Related

- [deepadata-edm-sdk](https://github.com/deepadata/deepadata-edm-sdk) — Core SDK
- [ddna-tools](https://github.com/emotional-data-model/ddna-tools) — Signing and verification
- [deepadata.com](https://deepadata.com) — Platform and API

## License

MIT

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
| **essential** | ~20 | Memory platforms, agent frameworks (default for Mem0, LangChain) |
| **extended** | ~45 | Journaling, companion AI, workplace wellness (default for Zep) |
| **full** | 96 | Clinical, therapeutic, regulated systems |

## Provider Selection

All adapters default to **Kimi K2** for cost optimization. For GDPR Article 9 or HIPAA regulated deployments, specify `anthropic` or `openai`:

```typescript
const { edmArtifact } = await enrichWithEDM(text, {
  profile: 'essential',
  provider: 'anthropic',  // EU/US compliance
});
```

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
- [deepadata-ddna-tools](https://github.com/emotional-data-model/ddna-tools) — Signing and verification
- [deepadata.com](https://deepadata.com) — Platform and API

## License

MIT

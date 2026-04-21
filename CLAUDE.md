# deepadata-adapters

Memory platform connectors for EDM artifacts.

## What This Repo Is

Adapters that connect EDM artifacts to memory infrastructure —
Mem0, Zep, LangChain. Each adapter maps EDM fields to the
platform's native memory format, enabling significance-aware
retrieval without replacing the memory stack.

- **License:** MIT
- **deepadata-edm-sdk dependency:** ^0.8.4

## Adapter Versions

| Adapter | Version | npm |
|---|---|---|
| mem0 | v0.1.7 | deepadata-mem0-adapter |
| zep | v0.1.6 | deepadata-zep-adapter |
| langchain | v0.1.6 | deepadata-langchain-adapter |

## Role in the DeepaData System

```
   edm-sdk (extraction)
       ↓ produces artifacts
   deepadata-com (sealing, registry)
       ↓ certified artifacts flow to
→ deepadata-adapters ← YOU ARE HERE
       ↓ maps to
   Mem0 / Zep / LangChain memory stores
```

The adapters are the distribution layer. They let memory
platforms consume EDM artifacts without adopting the full
DeepaData stack.

## What This Repo Contains

- `packages/mem0/` — Mem0 adapter (v0.1.7)
- `packages/zep/` — Zep adapter (v0.1.6)
- `packages/langchain/` — LangChain memory connector (v0.1.6)

## What Each Adapter Exports

All three adapters export:
- `enrichWithEDM` — add EDM significance to memory records
- `queryBySignificance` — significance-aware retrieval
- `feedback` — re-exported from SDK, closes learning loop

**Note:** `activate()` and `feedback()` come from deepadata-edm-sdk.
They are not duplicated in adapters — adapters re-export SDK functions.

## What Each Adapter Does

**Mem0:** Maps EDM fields to Mem0 memory metadata. Recall
triggers and retrieval keys become searchable memory attributes.

**Zep:** Maps tether_type and associated_people to graph edges.
Recall triggers become fact metadata for graph traversal.

**LangChain:** Memory module connector that enriches LangChain
memory with EDM significance fields.

## Planned Adapters

- Supermemory (priority — outreach pending)
- Graphiti (ship before outreach)

## Hard Constraints

| Constraint | Reason |
|---|---|
| Do not expose extraction prompts | Commercial IP lives in edm-sdk |
| Adapters are thin mappers | No extraction logic in adapters |

## Partner Profiles (v0.8.0)

Adapters propagate `partner:` prefixed `meta.profile` values through
to deepadata-com. Mem0/Zep/LangChain type surfaces accept partner-prefixed
values per ADR-0017.

## Arc Types (v0.8.0)

14 canonical arc_types per edm-schema.ts:189-196. v0.8.0 added
`gratitude` and `authenticity`:

```
betrayal, liberation, grief, discovery, resistance, bond,
moral_awakening, transformation, reconciliation, reckoning,
threshold, exile,
gratitude, authenticity
```

## Deferred

- `combineWith` merge logic: deferred to v0.2.x (vendor SDK integration not yet built)

## Open Items

- `activate_reason` adapter surface: not yet implemented. Platform
  endpoint `/v1/activate_reason` exists (ADR-0018); adapter wrapper pending.

## Source of Truth

For full project context, cross-repo state, and architectural decisions:

→ **See `deepadata-com/planning/CLAUDE_PROJECT.md`**

The platform repo (deepadata-com) is the source of truth for
session state, version alignment, and task tracking.

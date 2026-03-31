# deepadata-adapters

Memory platform connectors for EDM artifacts.

## What This Repo Is

Adapters that connect EDM artifacts to memory infrastructure —
Mem0, Zep, LangChain. Each adapter maps EDM fields to the
platform's native memory format, enabling significance-aware
retrieval without replacing the memory stack.

- **Current version:** v0.1.x
- **License:** MIT
- **Status:** Published — mem0@0.1.2, zep@0.1.1, langchain@0.1.1. Dependency: deepadata-edm-sdk ^0.7.1. All adapters MIT licensed.

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

- `packages/mem0/` — Mem0 adapter (v0.1.1)
- `packages/zep/` — Zep adapter (v0.1.0)
- `packages/langchain/` — LangChain memory connector (v0.1.0)

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

## Blocked On

- npm patch republish waiting on edm-sdk v0.7.0 official npm publish
- Essential type rename needs version bump

## Source of Truth

For full project context, cross-repo state, and architectural decisions:

→ **See `deepadata-com/planning/CLAUDE_PROJECT.md`**

The platform repo (deepadata-com) is the source of truth for
session state, version alignment, and task tracking.

# deepadata-adapters

Memory platform connectors for EDM artifacts.

## What This Repo Is

Adapters that connect EDM artifacts to memory infrastructure —
Mem0, Zep, LangChain. Each adapter maps EDM fields to the
platform's native memory format, enabling significance-aware
retrieval without replacing the memory stack.

- **License:** MIT
- **deepadata-edm-sdk dependency:** ^0.8.8

## Adapter Versions

| Adapter | Version | npm |
|---|---|---|
| mem0 | v0.1.10 | deepadata-mem0-adapter |
| zep | v0.1.9 | deepadata-zep-adapter |
| langchain | v0.1.9 | deepadata-langchain-adapter |

All three adapters depend on `ddna-tools ^0.3.0` (MIT, OSS) for
canonical-profile extraction, and `deepadata-edm-sdk ^0.8.8` for activation,
feedback, and a fallback extraction path.

## Versioning

Bump triggers per audit recommendation 8:

| Bump | When | Examples |
|---|---|---|
| **Patch** (`0.x.Y`) | Bug fixes, doc updates, dependency bumps that don't change observable adapter behaviour | SDK pin nudge from `^0.8.4` to `^0.8.6`; README clarifications; internal refactors |
| **Minor** (`0.X.0`) | New methods or capabilities, routing changes that affect the extraction path | Adding `queryByReasoning`; routing canonical extraction through `ddna-tools`; new exported function |
| **Major** (`X.0.0`) | Breaking API changes, removed methods, parameter shape changes | Removing `enrichWithEDM`; renaming a public method; changing the return shape of an exported function |

**Reasoning rule:** removing a non-functional surface is patch; removing
a working surface is minor.

ADR-0023 routed canonical extraction through `ddna-tools` — a routing
change that would normally warrant a minor bump. The mem0 v0.1.7 → v0.1.8,
zep v0.1.6 → v0.1.7, and langchain v0.1.6 → v0.1.7 releases also removed
the `partner:${string}` value from the `EdmProfile` type. That removal was
treated as patch because the type was dead code: it silently fell through
to the full-profile prompt because the registry that resolves partner
prompts (ADR-0012) has not shipped. The removed surface never functioned,
so no consumer behaviour changed.

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

- `packages/mem0/` — Mem0 adapter (v0.1.10)
- `packages/zep/` — Zep adapter (v0.1.9)
- `packages/langchain/` — LangChain memory connector (v0.1.9)

## What Each Adapter Exports

All three adapters export:
- `enrichWithEDM` — add EDM significance to memory records
- `queryBySignificance` — significance-aware retrieval
- `feedback` — re-exported from SDK, closes learning loop

**Note:** `activate()` and `feedback()` come from deepadata-edm-sdk.
They are not duplicated in adapters — adapters re-export SDK functions.

## What Each Adapter Does

All three are thin enrichment wrappers: they run extraction (canonical
profiles via `ddna-tools`, fallback via SDK) and surface the EDM artifact
alongside the host platform's own memory write. The adapter does not call
the host platform's SDK — the caller does that step.

**Mem0:** Returns the EDM artifact alongside the user's `mem0.add(...)`
call. The README documents recall_triggers / retrieval_keys as candidates
for Mem0 metadata; mapping is left to the caller.

**Zep:** Returns the EDM artifact plus a `gravity` summary
(emotional_weight, recurrence_pattern, strength_score, temporal_decay)
that maps onto Zep's temporal scoring. The mapping is documented; the
caller wires it into Zep.

**LangChain:** Returns the EDM artifact alongside any LangChain memory
type (`ConversationBufferMemory`, `VectorStoreRetrieverMemory`, etc.).
No LangChain-specific wrapper class is registered.

## Planned Adapters

- Supermemory (priority — outreach pending)
- Graphiti (ship before outreach)

## Hard Constraints

| Constraint | Reason |
|---|---|
| Adapters are thin mappers | No extraction logic in adapters |
| Canonical extraction routes through `ddna-tools` | OSS distribution path per ADR-0023 |
| Partner profiles are not advertised in adapter type surfaces | Registry resolution (ADR-0012) is not yet shipped — see Partner Profiles below |

Note: canonical extraction prompts are open per ADR-0003 (amended
2026-04-23) and live in `ddna-tools`. Partner-profile prompts remain
server-side and registry-gated per EDM spec §3.7.6.

## Partner Profiles

Per ADR-0017 the `meta.profile` namespace admits canonical values
(`essential | extended | full`) and `partner:<id>` values. Per ADR-0025
partner profiles are the governed mechanism for any named, configurable
field selection.

Adapter status: **partner profiles are not yet exposed.** The
`partner:${string}` value previously declared on the adapter `EdmProfile`
type was silently falling through to the full-profile prompt because the
registry that resolves partner-profile prompts (ADR-0012) has not shipped.
The dead-code type was removed in mem0 v0.1.8 / zep v0.1.7 / langchain
v0.1.7. Re-introduce the partner profile surface when ADR-0012 registry
support lands.

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

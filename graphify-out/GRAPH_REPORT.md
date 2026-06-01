# Graph Report - .  (2026-06-01)

## Corpus Check
- Corpus is ~18,693 words - fits in a single context window. You may not need a graph.

## Summary
- 144 nodes · 147 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_TypeScript Compiler Options|TypeScript Compiler Options]]
- [[_COMMUNITY_Module Path Aliases|Module Path Aliases]]
- [[_COMMUNITY_Monorepo Tooling Config|Monorepo Tooling Config]]
- [[_COMMUNITY_AI Agent Architecture|AI Agent Architecture]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Nx Build Targets|Nx Build Targets]]
- [[_COMMUNITY_Package Scripts|Package Scripts]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_Nx Workspace Config|Nx Workspace Config]]
- [[_COMMUNITY_Implementation Planning|Implementation Planning]]
- [[_COMMUNITY_Architecture Decisions|Architecture Decisions]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 21 edges
2. `paths` - 20 edges
3. `scripts` - 11 edges
4. `Phase 1 Implementation Prompt` - 6 edges
5. `LangGraph Agent Reasoning` - 6 edges
6. `targetDefaults` - 5 edges
7. `Nx Workspace Configuration` - 5 edges
8. `Implementation Plan v4 Revised Final` - 5 edges
9. `Temporal Workflow Orchestration` - 5 edges
10. `root` - 4 edges

## Surprising Connections (you probably didn't know these)
- `root` --implements--> `Phase 1 Implementation Prompt`  [INFERRED]
  .eslintrc.json → docs/implementation-phase-1-prompt.md
- `Root package.json` --implements--> `Phase 1 Implementation Prompt`  [INFERRED]
  package.json → docs/implementation-phase-1-prompt.md
- `Nx Workspace Configuration` --implements--> `Phase 1 Implementation Prompt`  [INFERRED]
  nx.json → docs/implementation-phase-1-prompt.md
- `Nx Monorepo Architecture` --rationale_for--> `Nx Workspace Configuration`  [EXTRACTED]
  docs/PRD_AND_ADR_HUMAN_GUIDE.md → nx.json
- `pnpm Workspace Definition` --references--> `Root package.json`  [EXTRACTED]
  pnpm-workspace.yaml → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SDLC Agent Pipeline** — planner_agent, retriever_agent, architecture_agent, approval_gate, implementor_agent, reviewer_agent [EXTRACTED 1.00]
- **Phase 1 Monorepo Foundation** — package_json_root, nx_json_config, tsconfig_base, eslintrc_root, lintstagedrc, pnpm_workspace [EXTRACTED 1.00]
- **Implementation Plan Version Chain** — impl_plan_v1, impl_plan_v2, impl_plan_v3, impl_plan_v4, feedback_recommendations [INFERRED 0.95]

## Communities (11 total, 1 thin omitted)

### Community 0 - "TypeScript Compiler Options"
Cohesion: 0.10
Nodes (20): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib (+12 more)

### Community 1 - "Module Path Aliases"
Cohesion: 0.10
Nodes (20): paths, @ai-sdlc/agents/a2a, @ai-sdlc/agents/adk, @ai-sdlc/agents/architecture, @ai-sdlc/agents/core, @ai-sdlc/agents/implementor, @ai-sdlc/agents/planner, @ai-sdlc/agents/retriever (+12 more)

### Community 2 - "Monorepo Tooling Config"
Cohesion: 0.14
Nodes (15): ignorePatterns, overrides, plugins, root, *.{js,jsx}, *.{json,md,yaml,yml}, *.{ts,tsx}, Nx Workspace Configuration (+7 more)

### Community 3 - "AI Agent Architecture"
Cohesion: 0.12
Nodes (16): A2A Protocol Placeholder, Google ADK Placeholder, Human-in-the-Loop Approval Gate, Architecture Validation Agent, Evaluation Framework, Golden Demo Scenario, Governance Layer, Implementor Agent (+8 more)

### Community 4 - "Dev Dependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-prettier, eslint-plugin-import, husky, lint-staged, @nx/eslint, @nx/js (+8 more)

### Community 5 - "Nx Build Targets"
Cohesion: 0.14
Nodes (14): cache, dependsOn, inputs, cache, inputs, targetDefaults, build, lint (+6 more)

### Community 6 - "Package Scripts"
Cohesion: 0.18
Nodes (11): scripts, build, clean, dev, format, format:check, lint, prepare (+3 more)

### Community 7 - "Package Metadata"
Cohesion: 0.20
Nodes (9): description, engines, node, pnpm, license, name, packageManager, private (+1 more)

### Community 8 - "Nx Workspace Config"
Cohesion: 0.22
Nodes (8): defaultBase, namedInputs, default, production, sharedGlobals, plugins, $schema, nx

### Community 9 - "Implementation Planning"
Cohesion: 0.32
Nodes (8): Final Feedback and Recommendations, Implementation Plan v1, Implementation Plan v2, Implementation Plan v3 Final, Implementation Plan v4 Revised Final, PRD and ADR Human Guide, AI SDLC Assistant Platform README, Project Scaffolding Prompt

## Knowledge Gaps
- **95 isolated node(s):** `ignorePatterns`, `plugins`, `overrides`, `*.{ts,tsx}`, `*.{js,jsx}` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `compilerOptions` connect `TypeScript Compiler Options` to `Module Path Aliases`, `Monorepo Tooling Config`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependencies` to `Nx Workspace Config`, `Package Metadata`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `paths` connect `Module Path Aliases` to `TypeScript Compiler Options`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Phase 1 Implementation Prompt` (e.g. with `root` and `.lintstagedrc.json`) actually correct?**
  _`Phase 1 Implementation Prompt` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ignorePatterns`, `plugins`, `overrides` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript Compiler Options` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Module Path Aliases` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
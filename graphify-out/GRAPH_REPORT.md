# Knowledge Graph Report

**Corpus**: `libs/` — 923 nodes, 1714 edges, 79 communities

---

## God Nodes

The 15 highest-PageRank nodes — architectural hubs that everything connects through:

| Rank | Node                                                | Label                                                                        | File                                                             | Degree | PageRank |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------ | -------- |
| 1    | `interfaces_model_config_interface_providertype`    | ProviderType                                                                 | `ai/model-gateway/src/interfaces/model-config.interface.ts`      | 6      | 0.001656 |
| 2    | `src_agent_agentname`                               | AgentName                                                                    | `shared/types/src/agent.ts`                                      | 12     | 0.001636 |
| 3    | `src_agent_agentoutput`                             | AgentOutput                                                                  | `shared/types/src/agent.ts`                                      | 27     | 0.001464 |
| 4    | `interfaces_model_config_interface_modeldefinition` | ModelDefinition                                                              | `ai/model-gateway/src/interfaces/model-config.interface.ts`      | 19     | 0.001331 |
| 5    | `src_evaluation_evaluationcriteria`                 | EvaluationCriteria                                                           | `shared/types/src/evaluation.ts`                                 | 8      | 0.001248 |
| 6    | `interfaces_model_gateway_interface_modelgateway`   | ModelGateway                                                                 | `ai/model-gateway/src/interfaces/model-gateway.interface.ts`     | 19     | 0.001221 |
| 7    | `src_mcp_mcpprovidername`                           | McpProviderName                                                              | `shared/types/src/mcp.ts`                                        | 7      | 0.001156 |
| 8    | `types_agentoutput`                                 | AgentOutput Interface                                                        | `libs/shared/types/src/agent.ts`                                 | 8      | 0.001097 |
| 9    | `src_policy_interface_policy`                       | Policy                                                                       | `infra/governance/src/policy.interface.ts`                       | 10     | 0.001000 |
| 10   | `providers_provider_interface_providerhealthstatus` | ProviderHealthStatus                                                         | `ai/model-gateway/src/providers/provider.interface.ts`           | 11     | 0.000984 |
| 11   | `src_types_prompttemplate`                          | PromptTemplate                                                               | `shared/prompts/src/types.ts`                                    | 6      | 0.000978 |
| 12   | `mcp_mcp_client_interface`                          | McpClient Interface                                                          | `libs/mcp/src/mcp-client.interface.ts`                           | 7      | 0.000878 |
| 13   | `modelgateway_modelconfig_interface`                | ModelConfig Interface                                                        | `libs/ai/model-gateway/src/interfaces/model-config.interface.ts` | 7      | 0.000870 |
| 14   | `mg_modelresponse`                                  | ModelResponse (unified LLM response: content + toolCalls + usage + metadata) | `libs/ai/model-gateway/README.md`                                | 2      | 0.000841 |
| 15   | `providers_provider_interface_provideroptions`      | ProviderOptions                                                              | `ai/model-gateway/src/providers/provider.interface.ts`           | 11     | 0.000810 |

---

## Community Map

Union-find clustering identified **79 communities**.
The largest community has **265 nodes** — essentially all connected code.

| Community | Size | Sample Members                                                                                           |
| --------- | ---- | -------------------------------------------------------------------------------------------------------- |
| C0        | 265  | `a2a.interface.ts`, `A2AMessage`, `A2AMessageType`, `A2ACapability`...                                   |
| C1        | 56   | `Implementor Package Manifest`, `name`, `version`, `private`...                                          |
| C2        | 43   | `agent.schema.ts`, `AgentName`, `AgentExecutionStatus`, `TokenUsageSchema`...                            |
| C3        | 42   | `index.ts`, `logger.service.ts`, `AppLoggerService`, `.constructor()`...                                 |
| C4        | 36   | `TaskResponseSchema`, `WorkflowExecutionSchema`, `WorkflowStepResultSchema`, `ApprovalDecisionSchema`... |
| C5        | 24   | `Core Agent tsconfig`, `extends`, `compilerOptions`, `noEmit`...                                         |
| C6        | 22   | `package.json`, `name`, `version`, `private`...                                                          |
| C7        | 20   | `index.ts`, `approval-policy.ts`, `ApprovalPolicy`, `.evaluate()`...                                     |
| C8        | 17   | `project.json`, `name`, `$schema`, `sourceRoot`...                                                       |
| C9        | 17   | `project.json`, `name`, `$schema`, `sourceRoot`...                                                       |
| C10       | 17   | `ReviewerAgent`, `ReviewerAgent Spec`, `ReviewerState`, `Reviewer Agent Index`...                        |
| C11       | 14   | `index.ts`, `registry.ts`, `PromptRegistry`, `.register()`...                                            |
| C12       | 14   | `MCP Library Index`, `McpClient Interface`, `McpTransport Interface`, `McpRegistry`...                   |
| C13       | 12   | `auth.guard.ts`, `AuthGuard`, `.canActivate()`, `auth.module.ts`...                                      |
| C14       | 12   | `package.json`, `name`, `version`, `private`...                                                          |

---

## Surprising Connections

High-value inferred edges that bridge different subsystems (cross-community):

| Source                                                          | →   | Target                             | Relation                  | Confidence      | Score |
| --------------------------------------------------------------- | --- | ---------------------------------- | ------------------------- | --------------- | ----- |
| `Evaluation Zod Schema`                                         | →   | `shared_types_evaluation_types`    | `shares_data_with`        | INFERRED (0.95) | —     |
| `Prompt Types (PromptTemplate, ModelConfig)`                    | →   | `model_gateway_gateway`            | `conceptually_related_to` | INFERRED (0.75) | —     |
| `McpRegistry`                                                   | →   | `model_gateway_model_registry`     | `semantically_similar_to` | INFERRED (0.85) | —     |
| `McpRegistry`                                                   | →   | `evaluations_evaluator_registry`   | `semantically_similar_to` | INFERRED (0.75) | —     |
| `McpRegistry`                                                   | →   | `infra_governance_policy_registry` | `semantically_similar_to` | INFERRED (0.75) | —     |
| `Agent Zod Schema`                                              | →   | `shared_types_agent_types`         | `shares_data_with`        | INFERRED (0.95) | —     |
| `PromptRegistry`                                                | →   | `model_gateway_model_registry`     | `semantically_similar_to` | INFERRED (0.75) | —     |
| `ScopePolicy (Agent Safety Boundary - forbidden pattern guard)` | →   | `agents_coreagent`                 | `conceptually_related_to` | INFERRED (0.75) | —     |
| `PolicyRegistry (Map-based policy lookup)`                      | →   | `modelgateway_modelregistry`       | `conceptually_related_to` | INFERRED (0.85) | —     |
| `ApprovalPolicy (HITL Gate - high-risk action gating)`          | →   | `workers_approvalactivity`         | `shares_data_with`        | INFERRED (0.75) | —     |

---

## Suggested Questions

Based on the graph topology, these questions are likely to yield deep cross-cutting insights:

1. **How does the Model Gateway's profile system propagate to individual agent LLM calls?**
   - Trace: `PromptTemplate.model` → `ModelGatewayService.invoke()` → provider → LLM

2. **What is the failure propagation path when a provider is unavailable?**
   - Trace: `ModelRegistry.createModel()` → `ModelGatewayService.invoke()` → `AgentError` → `WorkflowState`

3. **Why do 5 separate agents exist instead of one configurable agent?**
   - Trace community clusters: planner/retriever/implementor/reviewer/architecture all share the same AgentState pattern — what differentiates them?

4. **How do governance policies gate agent execution?**
   - Trace: `ApprovalPolicy` / `ScopePolicy` → `PolicyRegistry` → workers → agent dispatch

5. **What binds the shared/types contract to the Zod schemas, and where does validation happen?**
   - Trace: `shared/types/*.ts` ← `shared/schemas/*.schema.ts` ← API boundary (NestJS pipes)

---

## Hyperedge Summary

Named groups of nodes that form cohesive architectural units:

| ID                                  | Label                                                                                | Members                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `agent_interoperability_layer`      | Agent Interoperability Layer                                                         | `a2a_A2ARouter`, `a2a_A2AMessage`, `adk_AdkAgentAdapter`, `adk_AdkRequest`...                                                             |
| `core_agent_framework`              | Core Agent Framework                                                                 | `core_BaseAgent`, `core_CompiledGraph`, `core_BaseAgentState`, `core_createBaseGraph`...                                                  |
| `architecture_agent_implementation` | Architecture Agent Implementation                                                    | `architecture_ArchitectureAgent`, `architecture_ArchitectureState`                                                                        |
| `agent_triad_gateway_pattern`       | Agent Triad: ModelGateway Injection + Invoke Pattern                                 | `implementor_ImplementorAgent`, `planner_PlannerAgent`, `retriever_RetrieverAgent`, `ai_modelgateway_ModelGateway`                        |
| `agent_triad_baseagent_impl`        | Agent Triad: BaseAgent Implementors                                                  | `implementor_ImplementorAgent`, `planner_PlannerAgent`, `retriever_RetrieverAgent`, `agents_core_BaseAgent`                               |
| `agent_packages_model_gateway_dep`  | Agent Packages Depend on ModelGateway                                                | `implementor_package`, `planner_package`, `retriever_package`, `reviewer_package`...                                                      |
| `agent_shared_io_types`             | Agent Triad Share AgentInput/AgentOutput Types                                       | `implementor_ImplementorAgent`, `planner_PlannerAgent`, `retriever_RetrieverAgent`, `shared_types_AgentInput`...                          |
| `llm_provider_implementations`      | LLM Provider Implementations of ModelProviderAdapter                                 | `modelgateway_openai_provider`, `modelgateway_anthropic_provider`, `modelgateway_google_provider`                                         |
| `gateway_factory_assembly`          | createModelGateway assembles all providers and config into the gateway               | `modelgateway_create_gateway`, `modelgateway_openai_provider`, `modelgateway_anthropic_provider`, `modelgateway_google_provider`...       |
| `evaluator_implementations`         | Evaluator Implementations (Quality + Relevance)                                      | `qualityevaluator_QualityEvaluator`, `relevanceevaluator_RelevanceEvaluator`, `evaluatorinterface_Evaluator`                              |
| `registry_pattern_implementors`     | Registry Pattern Implementors (ModelRegistry + EvaluatorRegistry)                    | `modelregistry_ModelRegistry`, `evaluatorregistry_EvaluatorRegistry`                                                                      |
| `auth_module_composition`           | AuthModule Guard and Decorator Composition                                           | `authmodule_AuthModule`, `authguard_AuthGuard`, `throttleguard_ThrottleGuard`, `rbacdecor_Roles`                                          |
| `evaluations_library_exports`       | Evaluations Library Public API                                                       | `evaluationsindex_Exports`, `evaluatorinterface_Evaluator`, `evaluatorregistry_EvaluatorRegistry`, `qualityevaluator_QualityEvaluator`... |
| `infra_auth_library_exports`        | infra-auth Library Public API                                                        | `infraauthindex_Exports`, `authmodule_AuthModule`, `authguard_AuthGuard`, `throttleguard_ThrottleGuard`...                                |
| `telemetry_observability_stack`     | Telemetry Observability Stack (pino + OpenTelemetry + Langfuse)                      | `telemetry_langfuse`, `telemetry_logger`, `telemetry_tracing`                                                                             |
| `governance_policy_system`          | Governance Policy System (interface + registry + implementations)                    | `governance_policyinterface`, `governance_policyregistry`, `governance_approvalpolicy`, `governance_scopepolicy`                          |
| `mcp_context_providers`             | MCP Context Providers (Docs, GitHub, Jira)                                           | `mcp_docs_provider`, `mcp_github_provider`, `mcp_jira_provider`                                                                           |
| `core_domain_validation_schemas`    | Core Domain Validation Schemas (Agent, Evaluation)                                   | `shared_schemas_agent_schema`, `shared_schemas_evaluation_schema`, `shared_schemas_env_schema`                                            |
| `shared_registry_pattern`           | Shared Registry Pattern Implementations                                              | `mcp_mcp_registry`, `shared_prompts_registry`, `model_gateway_model_registry`                                                             |
| `core_domain_contract_types`        | Core Domain Contract Types — agent + task + workflow used across all platform layers | `types_agentinput`, `types_agentoutput`, `types_agenterror`, `types_tokenusage`...                                                        |

---

_Generated by graphify · knowledge graph pipeline_

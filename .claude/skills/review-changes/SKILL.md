---
name: Review Changes
description: Perform a structured code review using change detection and impact analysis (code-review-graph and codebase-memory-mcp)
---

## Review Changes

Perform a thorough, risk-aware code review using whichever knowledge graph MCP is active.

---

### With code-review-graph

1. Run `get_minimal_context(task="review changes")` to orient before any other calls.
2. Run `detect_changes` to get risk-scored change analysis across the diff.
3. Run `get_affected_flows` to find impacted execution paths.
4. For each high-risk function, run `query_graph` with `pattern="tests_for"` to check test coverage.
5. Run `get_impact_radius` to understand the blast radius of the most critical changes.
6. For any untested or high-risk changes, suggest specific test cases based on the affected flows.

### With codebase-memory-mcp

1. Run `list_projects` to confirm the graph is indexed and current; re-index if needed.
2. Run `get_graph_schema` to understand the graph shape before writing queries.
3. For each changed function, trace callers to understand blast radius:
   ```
   trace_call_path(function_name="<changed_fn>", direction="inbound", depth=3)
   ```
4. Check for cross-service impact — changed functions that are called via HTTP from other services:
   ```
   search_graph(label="Function", name_pattern=".*<changed_fn>.*", relationship="HTTP_CALLS")
   ```
   Or with Cypher:
   ```
   MATCH (a)-[r:HTTP_CALLS]->(b)
   WHERE b.name CONTAINS '<changed_fn>'
   RETURN a.name, a.file_path, r.url_path, r.confidence
   ```
5. Identify high fan-in functions in the changed set (high risk if broken):
   ```
   search_graph(label="Function", relationship="CALLS", direction="inbound", min_degree=5)
   ```
6. Use `get_code_snippet` to read source of any flagged function before commenting.
7. For any changed REST routes, query route nodes to confirm the handler wiring is intact:
   ```
   search_graph(label="Route", name_pattern="<path_pattern>")
   ```

---

### Output Format (both MCPs)

Group findings by risk level — **high / medium / low** — with:
- What changed and why it matters structurally (callers, flows, HTTP dependents)
- Test coverage status (missing tests, untested callers)
- Suggested improvements or test cases
- Overall merge recommendation

### Tips (both MCPs)

- High fan-in = high risk. Any function with many callers that changed deserves a closer read.
- CM-MCP's `HTTP_CALLS` edges catch cross-service breakage that CRG's blast radius may not surface — use both perspectives when both MCPs are connected.
- Missing test coverage is best spotted by combining a caller trace (who calls this?) with a search for test files that reference the function name.

## Token Efficiency Rules
- **CRG**: ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- **CM-MCP**: ALWAYS call `get_graph_schema` once per session before writing Cypher queries.
- Use `detail_level="minimal"` on CRG calls. Only escalate to `"standard"` when minimal is insufficient.
- Target: complete any review task in ≤5 tool calls and ≤800 total output tokens.
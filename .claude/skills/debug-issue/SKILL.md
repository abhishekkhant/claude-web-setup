---
name: Debug Issue
description: Systematically debug issues using graph-powered code navigation (code-review-graph and codebase-memory-mcp)
---

## Debug Issue

Use whichever knowledge graph MCP is active to systematically trace and debug issues.

---

### With code-review-graph

1. Use `get_minimal_context(task="debug: <issue description>")` first to orient.
2. Use `semantic_search_nodes` to find code related to the issue.
3. Use `query_graph` with `callers_of` and `callees_of` to trace call chains around the suspect area.
4. Use `get_flow` to see full execution paths through suspected code.
5. Run `detect_changes` to check if recent changes caused the issue.
6. Use `get_impact_radius` on suspected files to see what else is affected.

### With codebase-memory-mcp

1. Run `list_projects` to confirm the repo is indexed; if stale, run `index_repository` first.
2. Use `search_graph(label="Function", name_pattern=".*<suspect>.*")` to locate relevant functions.
3. Use `trace_call_path(function_name="<suspect>", direction="inbound")` to find callers.
4. Use `trace_call_path(function_name="<suspect>", direction="outbound")` to trace downstream effects.
5. Use `query_graph` with Cypher for multi-hop paths — e.g.:
   ```
   MATCH (f:Function)-[:CALLS*1..3]->(g:Function)
   WHERE f.name = '<entry_point>'
   RETURN f.name, g.name, g.file_path
   ```
6. Use `get_code_snippet(qualified_name="...")` to read the source of any suspect function.

---

### Tips (both MCPs)

- Check both callers and callees to understand the full context around a bug.
- Look at affected flows / call chains to find the entry point that triggers the issue.
- Recent changes are the most common source of new bugs — use `detect_changes` (CRG) or compare `indexed_at` timestamps (CM-MCP) to narrow the timeline.
- Use `search_code` (CM-MCP) or `semantic_search_nodes` (CRG) for grep-style text searches when you have an error message or string literal to trace.

## Token Efficiency Rules
- **CRG**: ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- **CM-MCP**: ALWAYS call `get_graph_schema` once per session before writing Cypher queries.
- Use `detail_level="minimal"` on CRG calls. Only escalate to `"standard"` when minimal is insufficient.
- Target: complete any debug task in ≤5 tool calls and ≤800 total output tokens.
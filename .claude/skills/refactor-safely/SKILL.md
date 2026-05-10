---
name: Refactor Safely
description: Plan and execute safe refactoring using dependency analysis (code-review-graph and codebase-memory-mcp)
---

## Refactor Safely

Use whichever knowledge graph MCP is active to plan and execute refactoring with confidence.

---

### With code-review-graph

1. Use `get_minimal_context(task="refactor: <target>")` to orient before any graph queries.
2. Use `refactor_tool` with `mode="suggest"` for community-driven refactoring suggestions.
3. Use `refactor_tool` with `mode="dead_code"` to find unreferenced code safe to remove.
4. For renames, use `refactor_tool` with `mode="rename"` to preview all affected locations before touching anything.
5. Use `apply_refactor_tool` with the returned `refactor_id` to apply the rename.
6. After changes, run `detect_changes` to verify the refactoring impact and catch anything missed.

**Safety checks:**
- Always preview before applying (`rename` mode gives you a full edit list).
- Run `get_impact_radius` before any major refactor to understand blast radius.
- Use `get_affected_flows` to ensure no critical execution paths are broken.
- Use `find_large_functions` to identify decomposition candidates before splitting.

### With codebase-memory-mcp

1. Run `list_projects` to confirm the graph is current; run `index_repository` if stale.
2. **Find dead code** before removing anything:
   ```
   search_graph(
     label="Function",
     relationship="CALLS",
     direction="inbound",
     max_degree=0,
     exclude_entry_points=true
   )
   ```
3. **Preview rename impact** — find all callers of the target before renaming:
   ```
   trace_call_path(function_name="<target>", direction="inbound", depth=5)
   ```
4. **Check blast radius** with a Cypher query before moving or splitting modules:
   ```
   MATCH (f:Function)-[:CALLS]->(g:Function)
   WHERE g.file_path CONTAINS '<module_to_change>'
   RETURN DISTINCT f.file_path, count(g) AS calls_into_module
   ORDER BY calls_into_module DESC
   ```
5. Use `get_code_snippet` to read and verify each affected function before editing.
6. After refactoring, run `index_repository` to refresh the graph, then re-run the dead code query to confirm removals are clean.

**Safety checks:**
- Use `trace_call_path` with `direction="both"` to see the full context around any function before touching it.
- Scope `search_graph` with `file_pattern` to isolate impact to one service/module at a time.
- High fan-in functions (many callers) deserve extra scrutiny — detect them with `search_graph(relationship="CALLS", direction="inbound", min_degree=5)`.

---

### Tips (both MCPs)

- Never apply a rename or deletion without first running a caller trace — both MCPs make this a single tool call.
- Dead code detected by either tool may still be entry points (route handlers, `main`, test fixtures) — verify before deleting.
- After any significant refactor, re-index (CM-MCP) or run `detect_changes` (CRG) to confirm the graph reflects the new state.

## Token Efficiency Rules
- **CRG**: ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- **CM-MCP**: ALWAYS call `get_graph_schema` once per session before writing Cypher queries.
- Use `detail_level="minimal"` on CRG calls. Only escalate to `"standard"` when minimal is insufficient.
- Target: complete any refactor planning task in ≤5 tool calls and ≤800 total output tokens.
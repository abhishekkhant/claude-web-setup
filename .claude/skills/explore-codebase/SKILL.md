---
name: Explore Codebase
description: Navigate and understand codebase structure using the knowledge graph (code-review-graph and codebase-memory-mcp)
---

## Explore Codebase

Use whichever knowledge graph MCP is active to explore and understand the codebase structure.

---

### With code-review-graph

1. Run `list_graph_stats` to see overall codebase metrics (nodes, edges, communities).
2. Run `get_architecture_overview` for a high-level community structure map.
3. Use `list_communities` to find major modules, then `get_community` for details on each.
4. Use `semantic_search_nodes` to find specific functions or classes by name or meaning.
5. Use `query_graph` with patterns like `callers_of`, `callees_of`, `imports_of`, `children_of` to trace relationships.
6. Use `list_flows` and `get_flow` to understand execution paths through the codebase.
7. Use `find_large_functions` to identify complex or oversized code units.

### With codebase-memory-mcp

1. Run `list_projects` to confirm the repo is indexed and check when it was last indexed.
2. Run `get_graph_schema` to see node/edge counts, relationship patterns, and sample names — this is your architecture overview.
3. Use `search_graph(label="Function")` or `search_graph(label="Class")` to browse entities, filtered by `file_pattern` to scope to a module.
4. Use `trace_call_path` with `direction="outbound"` from a known entry point to follow execution flow.
5. Use `search_graph(label="Route")` to see all REST endpoints as first-class graph nodes.
6. Use `query_graph` with Cypher for structural patterns — e.g. to find high fan-out functions:
   ```
   MATCH (f:Function)-[:CALLS]->(g)
   WITH f, count(g) AS callees
   WHERE callees > 10
   RETURN f.name, f.file_path, callees
   ORDER BY callees DESC LIMIT 20
   ```
7. Use `list_directory` to browse the file tree, and `read_file` or `get_code_snippet` to inspect specific source.

---

### Tips (both MCPs)

- Start broad (stats/schema, architecture) then narrow down to specific areas.
- Use `children_of` (CRG) or `file_pattern` scoping (CM-MCP) to drill into a single file or module.
- Cross-service exploration is a CM-MCP strength: use `search_graph(relationship="HTTP_CALLS")` to map inter-service dependencies.
- Community detection (CRG) and package/folder node hierarchy (CM-MCP) both reveal module boundaries — pick whichever gives a cleaner picture.

## Token Efficiency Rules
- **CRG**: ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- **CM-MCP**: ALWAYS call `get_graph_schema` once per session before writing Cypher queries.
- Use `detail_level="minimal"` on CRG calls. Only escalate to `"standard"` when minimal is insufficient.
- Target: complete any exploration task in ≤5 tool calls and ≤800 total output tokens.
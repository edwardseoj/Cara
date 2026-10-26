# Graph Report - Cara  (2026-10-26)

## Corpus Check
- 5 files · ~1,437 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 23 nodes · 19 edges · 6 communities (5 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Ponytail
- Brainstorming 1.md
- Features
- Tech stack
- Language
- 0001-bring-your-own-spotify-client-id.md

## God Nodes (most connected - your core abstractions)
1. `Ponytail` - 4 edges
2. `Language` - 4 edges
3. `Tech stack` - 3 edges
4. `Features` - 3 edges
5. `Cara` - 2 edges
6. `Before you write` - 1 edges
7. `The smallest complete change` - 1 edges
8. `Levels` - 1 edges
9. `Why I want to redo it?` - 1 edges
10. `Shipped app (Linux first, Windows/Mac later)` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (6 total, 1 thin omitted)

### Community 0 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 1 - "Brainstorming 1.md"
Cohesion: 0.50
Nodes (3): Decisions, Milestones, Why I want to redo it?

### Community 2 - "Features"
Cohesion: 0.67
Nodes (3): Features, New, Old

### Community 3 - "Tech stack"
Cohesion: 0.67
Nodes (3): Local dev / training only (not shipped), Shipped app (Linux first, Windows/Mac later), Tech stack

### Community 4 - "Language"
Cohesion: 0.33
Nodes (5): Cara, Data, Gestures, Language, Spotify

## Knowledge Gaps
- **14 isolated node(s):** `Before you write`, `The smallest complete change`, `Levels`, `Why I want to redo it?`, `Shipped app (Linux first, Windows/Mac later)` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 17 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Tech stack` connect `Tech stack` to `Brainstorming 1.md`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Features` connect `Features` to `Brainstorming 1.md`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `Before you write`, `The smallest complete change`, `Levels` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
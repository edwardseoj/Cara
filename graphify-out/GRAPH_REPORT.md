# Graph Report - Cara  (2026-10-26)

## Corpus Check
- 7 files · ~3,035 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 47 nodes · 43 edges · 9 communities (6 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Ponytail
- Brainstorming 1.md
- README.md
- Getting started
- Language
- 0001-bring-your-own-spotify-client-id.md
- How it works
- CLAUDE.md
- Roadmap

## God Nodes (most connected - your core abstractions)
1. `Ponytail` - 4 edges
2. `Language` - 4 edges
3. `Getting started` - 4 edges
4. `How it works` - 4 edges
5. `Tech stack` - 3 edges
6. `Features` - 3 edges
7. `Cara` - 2 edges
8. `Roadmap` - 2 edges
9. `Before you write` - 1 edges
10. `The smallest complete change` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (9 total, 3 thin omitted)

### Community 0 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 1 - "Brainstorming 1.md"
Cohesion: 0.20
Nodes (9): Decisions, Features, Local dev / training only (not shipped), Milestones, New, Old, Shipped app (Linux first, Windows/Mac later), Tech stack (+1 more)

### Community 2 - "README.md"
Cohesion: 0.17
Nodes (11): Contributing, Development, Features, Gestures, License, Model and data, Origins, Privacy (+3 more)

### Community 3 - "Getting started"
Cohesion: 0.50
Nodes (4): 1. Install Cara, 2. Connect Spotify, 3. Gesture, Getting started

### Community 4 - "Language"
Cohesion: 0.33
Nodes (5): Cara, Data, Gestures, Language, Spotify

### Community 6 - "How it works"
Cohesion: 0.50
Nodes (4): How it works, Key design decisions, The app (shipped), The training stack (local development only)

## Knowledge Gaps
- **33 isolated node(s):** `Before you write`, `The smallest complete change`, `Levels`, `Why I want to redo it?`, `Shipped app (Linux first, Windows/Mac later)` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 35 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Getting started` connect `Getting started` to `README.md`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **What connects `Before you write`, `The smallest complete change`, `Levels` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
# Model routing

Cost is a hard constraint. Use the cheapest current Claude model that is good at the job. Do not start a session on Fable, Opus, or `best`.

Claude Code reads the default from `.claude/settings.json` (`model`: `claude-sonnet-5-5`). Cursor and any other Claude-capable agent that loads this file should follow the same routing. Legacy 4.x / 5 / 5.1 IDs (Opus 4.x, Sonnet 4.5, Sonnet 5, Haiku 4.5, Opus 5, Fable 5.1, and the rest) are retired here. All four current models have a 1M context window and 128K max output.

| Role | Model | ID | Alias | Price per MTok (in / out) | When |
| --- | --- | --- | --- | --- | --- |
| Daily driver (default) | Sonnet 5.5 | `claude-sonnet-5-5` | `sonnet` | $2 / $10 | Well-scoped features, bug fixes, UI polish, everyday multi-file edits, fast iteration |
| Narrow work | Haiku 5.5 | `claude-haiku-5-5` | `haiku` | $0.10 / $0.50 up to 100K input tokens; $0.50 / $2.50 above that | Subagents, compaction, summaries, classification, lookups, browser and other narrow bulk tasks |
| Complex work | Opus 5.5 | `claude-opus-5-5` | `opus`, `best` | $4 / $20 | Architecture that needs sustained judgment, large refactors, difficult reviews, long sessions where Sonnet was tried and was still wrong |
| Rare top tier | Fable 5.2 | `claude-fable-5-2` | `fable` | $8 / $40 | Migrations that would otherwise stall, root-cause or outage debugging, architecting work you would normally split, orchestrating smaller models |

## How to choose

1. Stay on Sonnet 5.5 for almost all coding in this repo. That is the default for agentic IDE sessions.
2. Send subagents, compaction, summaries, classification, lookups, and narrow bulk tasks to Haiku 5.5. A subagent must not inherit an expensive parent model unless the task truly needs that model. Set the subagent model to `haiku` (or `claude-haiku-5-5`). Claude Code's default for unassigned subagents is Haiku via `CLAUDE_CODE_SUBAGENT_MODEL`; a caller can still pass a stronger model for one task. Do not force every subagent onto Haiku.
3. Step up to Opus 5.5 only for complex, open-ended, or codebase-wide work, and only after Sonnet has been tried with enough context and was still wrong. Prefer `opusplan` (Opus plans, Sonnet implements) over leaving the whole session on Opus.
4. Use Fable 5.2 only for rare, hard, ambiguous, multi-hour work. Never make it the default. Do not use it for routine PRs or small features. `best` means Opus 5.5, not Fable.
5. Raise effort before you raise the model. These models start at medium. If the failure looks like skipped files, unrun tests, or a refactor abandoned midway, move medium to high, then xhigh, and retry. Change models only when the agent had the context, clearly tried, and was still wrong.

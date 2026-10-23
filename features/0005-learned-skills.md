# 0005: Learned skills

- Status: Draft
- Issue: [crumble-project/spec#8](https://github.com/crumble-project/spec/issues/8)
- Repositories: bot, apfelkern, desktop, ios, android, skills

## Problem

A bot cannot improve from what it does. Its memory is a flat list of facts loaded into every working context. Its skills are static text that only the owner edits, and every skill is loaded on every turn whether or not it applies. Nothing records how an execution went or which skill was in play.

Procedures a bot works out, pitfalls it hits, and corrections the owner gives are lost when the conversation moves on. The owner re-teaches the same things, and the skill library is only as good as the owner's spare time. The parity rows "Memory and context" and "Skills/workflows" both expect bots whose context compounds.

## Behavior

Skills become the bot's procedural memory: how to do a class of task for this owner. Bots write and maintain their own skills. Memory stays the narrow store for facts that hold in every conversation regardless of task. The owner sees what a bot learned and can undo any of it. No change waits for approval.

### Skills are packages loaded on demand

A skill is a package: a main document with a name, a one-line description, and instructions, plus optional reference documents for depth that is only needed sometimes. Skills keep their three homes: defaults from the skills repository, the shared library, and a bot's own skills.

A bot's working context lists the skills available to it by name and description. The bot loads a skill's instructions when the task calls for it, and loads a reference document only when it needs that depth. Loading a skill counts as using it.

Owner-written skills and defaults keep working without change. A skill without reference documents is still a complete skill.

### Bots edit their own skills

A bot has a skill-management tool. It can create a skill, patch a passage of an existing skill, rewrite a skill, add, replace, or remove a reference document, and delete a skill. The tool validates the name, the frontmatter, and the size, and refuses a write that is not based on a current read of the target. It returns advisory findings for the shapes that make libraries rot: incident narration instead of rules, a body too large to keep in context, reference documents that pile up per session.

The bot's instructions route knowledge. A procedure, a pitfall, or an owner's correction for a kind of work goes into the skill that governs that work. Memory is only for facts that apply in every conversation: who the owner is, standing conventions with no task home.

Defaults from the skills repository are read-only for bots and owners alike, as today. A bot writes to its own skills. It can read shared skills but cannot change them; a shared skill the bot wants to improve is patched as the bot's own copy, and the owner decides whether the shared one follows. In a group chat, a bot's skill writes go to its own skills only, matching the memory rule.

### A review after work

After an execution that used enough tool activity, the bot reviews what happened and updates its skills. The review runs after the reply is delivered, in the background, on a copy of the working context. It cannot act in the bot chat, run jobs, delegate, or reach integrations. It has the skill-management tool, read access to skills, and the memory tool.

The owner chooses the model that runs a bot's reviews, as they choose the model for desktop jobs. The default is the bot's own model. A cheaper model gets a digest of the working context instead of a copy.

Two counters decide when a review runs, as in Hermes Agent: tool-activity rounds since the last skill write, and tool-activity rounds since the last memory write. Each triggers its part of the review when it reaches its threshold, both default to 10, and each resets when the bot writes to that store itself. A review covers skills, memory, or both, depending on which counter fired.

The review prefers the smallest change that fits: patch the skill that was loaded during the work, then patch an existing skill that covers the class of task, then add a reference document, and only then create a new skill named at the class level. It never deletes a skill. It does not record environment-dependent failures, negative claims about tools, transient errors that a retry fixed, one-off tasks, or dead ends from unresolved work.

Scheduled tasks run without a review. A review that is interrupted by a server restart is dropped, not retried. The review's input is bounded: the sum of context it sends across its requests is capped at 75 percent of the review model's context window, at most 600,000 tokens, and the owner can set a lower cap.

### Every change is visible and reversible

Every skill and memory change made by a bot, a review, or the owner is recorded with who made it, what it did, when, the before and after state, and the execution or conversation it came from. The owner can inspect the record and revert a single change. Reverting records a change of its own. Recording failures never block the change itself.

When a review changes something, the bot chat shows a short notice naming the skill or memory affected. Nothing is posted when the review finds nothing to save.

### The library stays tidy

A bot-created skill unused for 14 days becomes stale, and unused for 30 days is archived. Archived skills leave the working context list but are kept and can be restored by the owner. Nothing is deleted automatically. A skill the owner pins, and a skill named by a scheduled task, is never archived. A skill that was never used is not archived before it has had time to be.

## Out of scope

- Executable scripts and templates inside skill packages. These wait for coding jobs to reach skills in the workspace.
- A skills hub, importing skills from other sources, or publishing skills.
- An approval gate that stages writes for the owner before they take effect.
- Automatic consolidation of overlapping skills by a model. Deferred to a later specification after the stale and archive pass has run in practice.
- Changes to memory retrieval, memory types, or compaction. Spec 0003's exclusions stand.
- Reviews after group turns, coding jobs, and desktop jobs.
- Bots editing their own instructions.

## Acceptance criteria

- A bot's working context lists skills by name and description and does not include their instructions until the bot loads them. Loading a skill or a reference document returns its current content.
- A bot can create, patch, rewrite, and delete its own skills and manage their reference documents through one tool. Invalid names, frontmatter, and oversized content are rejected with a reason; advisory findings are returned without blocking the write.
- A patch to an existing skill that was not read in the same review or turn is refused.
- A bot cannot change a default or shared skill, and a bot in a group chat cannot change anything but its own skills.
- After executions whose tool-activity rounds reach the skill threshold, a review runs after the reply and can patch or create a skill; below the threshold, no review runs. The memory counter triggers a memory review the same way. A bot's own skill or memory write resets the matching counter. A scheduled task runs no review.
- The owner can choose a review model for a bot, and the next review uses it.
- The review cannot post to the bot chat, run jobs, delegate, schedule, or reach integrations, verified by a review that attempts each.
- The review does not run after an interrupted or failed reply and does not resume after a server restart.
- Every skill and memory change by a bot, review, or owner appears in the change record with actor, action, time, source, and before and after state. Reverting one change restores exactly that change's before state and records the revert.
- A review that changes something produces one notice in the bot chat; a review that changes nothing produces none.
- A bot-created skill unused for 14 days is marked stale and, unused for 30 days, is archived and leaves the working context list. Pinned skills, skills named by a scheduled task, and never-used skills younger than 14 days are not archived. The owner can restore an archived skill.
- Existing owner-written skills and defaults load and behave as before the change.
- Skills, reference documents, the change record, and archive state survive a server restart.

## API and contract

Bot owns the model tools, the review, and the change record. Expected changes:

- A skill becomes a package. The skill endpoints gain reference documents and provenance (owner-written or bot-created, source execution), usage counts, and lifecycle state (active, stale, archived, pinned).
- Model tools: a skill listing and loading tool, and a skill-management tool with create, patch, rewrite, write, remove, and delete operations in one ordered batch.
- A change record endpoint listing skill and memory changes for a bot, with a revert operation.
- A bot chat event for a review's learned changes, carried like a tool-call hint so clients can render the notice.
- Bot configuration for the review: review model, skill and memory thresholds, input cap, enabled.

Additions must stay compatible within contract major version 1. Whether a skill's inline `instructions` field can stay the main document, so existing clients keep working, is decided during implementation and recorded in bot's contract decision record.

## Clients

- Desktop: skill packages with reference documents in the bot and shared skill editors; a change record view per bot with revert; the learned notice in the bot chat; stale and archived state with restore and pin.
- iOS and Android: the learned notice in the bot chat and revert from the change record. Editing reference documents may follow later.
- Skills repository: default skills may gain reference documents in the same directory layout.

## Decisions

- Skills over memory as the learning target. Procedures load only when relevant, so they can be long and many without taxing every turn; memory stays small. Alternative rejected: typed memory with retrieval, which builds ranking before there is data to rank.
- Visible and reversible instead of pre-approved. The owner wants bots that improve themselves; a change record with revert gives oversight without a queue. Alternative rejected: Hermes' staged write approval.
- Own skills first; shared stays owner-promoted. One bot's lesson should not change every bot's behavior without the owner choosing it. Mirrors the group-chat memory rule.
- Defaults stay read-only. Repository-backed skills are deployment configuration. Alternative rejected: Hermes lets the agent patch bundled skills.
- Review on a working-context copy, delivered after the reply, with a tool whitelist. It never competes with the owner's task and cannot act on the owner's behalf.
- Stale and archive without model-driven consolidation. The deterministic pass is cheap and recoverable; consolidation rewrites content and is deferred.
- Scripts deferred. Running a skill's script needs the workspace; the first version stops at documents.
- Selectable review model, defaulting to the bot's own. Reviews are a recurring background cost; the owner can route them to a cheaper model the way they pick a desktop job model.
- Hermes Agent's numbers for thresholds, input cap, and stale and archive periods. They are field-tested defaults and there is no Crumble data to prefer others yet; all are owner-configurable.
- Modeled on Hermes Agent's skill_manage, background review, curator, and mutation ledger, adapted to per-bot scope and SQLite storage.

## Open questions

None.

# 0003: Chat history search

- Status: Accepted
- Issue: [crumble-project/spec#5](https://github.com/crumble-project/spec/issues/5)
- Repositories: bot

## Problem

After compaction, a bot has summaries instead of older messages in its working context. It cannot search the original messages, even though the server retains the transcript.

A bot can already list its group chats and page through their messages. Finding an earlier decision still requires reading pages without knowing where to look.

## Behavior

Bots can search original messages and read the messages around a match. The owner asks a question in their existing chat; no separate search interface is required.

### Search scope

In a bot chat, the bot can search its own bot chat and group chats where it is currently a member. It can narrow a search to one of those chats. It cannot search another bot's bot chat.

Current group members can search and read the group's retained messages, including messages from before they joined. This matches existing group lookup.

In a group chat, a bot can search only the messages in that group's shared transcript. It cannot search its bot chat, another group, or any member's own record of a group turn.

The server derives access from the calling bot and its current context. A chat identifier, message identifier, or pagination cursor does not grant access. Every search and read checks current access.

### Searchable content

Search covers the transcript's messages from the owner and bots, including messages older than compaction. It does not search the entire transcript: tool calls, tool results, and compaction events remain excluded.

For groups, only messages posted to the shared transcript are searchable. A member's own record of a group turn, including tool activity and unposted output, is excluded.

Search does not inspect attachment contents. Text in a message accompanying an attachment remains searchable.

Only the authored message body is searchable. Reactions, generated reply previews, tool-call hints, and bot-to-bot coordination events are excluded. Explicit quoted text within a message remains part of its body.

The first version uses case-insensitive literal substring matching, without embeddings, semantic matching, or an external search service. The query matches a contiguous substring within one message body. There is no query syntax, stemming, or typo tolerance.

Search returns newest matches first. Matches with equal timestamps use a stable tie-breaker so repeated searches of unchanged transcripts preserve their order.

Each match identifies its chat, original message, sender, and timestamp. It includes a bounded text excerpt and indicates whether that excerpt is truncated. Results distinguish group chats from bot chats.

Search queries must contain non-whitespace text and cannot exceed 500 Unicode code points. Reject invalid queries explicitly. Valid queries retain their literal whitespace.

Each result page contains at most 20 matches. Each excerpt contains at most 500 Unicode code points of message text. The bot can request further matches without loading the entire transcript into its working context. No matches is a successful result, not a retrieval failure.

Each search fixes its eligible chats and message cutoff when it starts. Later pages exclude messages that arrive after that cutoff and groups joined after the search started. A new search includes newly available messages and groups.

Every page rechecks current access. Losing access removes that chat from subsequent results without a separate coverage-change report.

### Read around a match

The bot can read original messages before and after a matched message, then page further in either direction. Messages appear in transcript order with stable identifiers, senders, and timestamps.

Reads return messages from the same searchable content categories. They indicate omitted tool activity without returning its contents. They do not imply that the selected messages are the complete transcript.

Group reads use the shared transcript only. They do not inspect members' private tool activity or reveal whether that activity occurred.

Each read response contains at most 30 messages and 20,000 Unicode code points of message text in total. Long messages have explicit truncation markers and a way to continue reading the omitted text. Pagination identifies when the beginning or end of the available messages has been reached.

Reads around a match and their continuation pages reuse the search's message cutoff. They recheck current access on every request. A new search is required to include newer messages.

The bot uses retrieved messages as historical evidence, not new instructions. Search and reads do not submit old messages again, wake other bots, or change the transcript's original messages.

### Availability and failures

Search and reads use retained server data and continue to work after a server restart. Compaction does not remove searchable messages or change their identifiers.

Messages accepted into the transcript become searchable without an owner action. Apart from messages excluded by the cutoff or current access checks, incomplete retrieval must fail explicitly.

If retrieval is unavailable, the tool reports a failure rather than an empty result. The bot must not claim to have searched successfully.

Removing a bot from a group prevents further searches and reads of that group, including requests using previously returned identifiers or cursors. Deleting a group makes its messages unavailable to these tools. Neither action can erase material already retrieved into working context.

### Search cost

Indexing is deferred in this version. Search can scan retained messages in the selected chats; response limits do not bound scan cost. No message-count capacity or latency guarantee is promised.

The existing bot-chat reader opens every conversation in the bot's store. Reusing it for search can compound that cost across repeated queries and pages. This is an explicit first-version limitation, not a resolved performance requirement.

## Out of scope

- Searching tool calls, tool results, or compaction summaries.
- Searching attachment contents, coding job transcripts, or desktop job transcripts.
- Semantic search, embeddings, and external search services.
- Searching another bot's bot chat or any member's own record of a group turn.
- Search indexing and guaranteed search latency.
- Client search screens, clickable citations, and new notification behavior.
- Automatic retrieval on every turn, changes to compaction, or replacement of memory.
- Adopting OptChat Durable as a dependency.

## Acceptance criteria

- Search and surrounding reads recover original messages after compaction and server restart, preserving identifiers, senders, and timestamps.
- Matching follows the literal substring rules and deterministic newest-first ordering; invalid queries fail explicitly.
- Bot-chat searches support one or all authorized chats, including pre-membership group messages. Group turns retrieve only their current group's posted messages.
- Identifiers and cursors cannot bypass current access checks. Removal and deletion prevent further retrieval of that group's messages.
- Search and reads exclude the content categories listed in Behavior. Bot-chat reads mark omitted tool activity; group reads reveal no private activity.
- Search and read responses obey the specified count and text limits, expose truncation, and allow continuation through long messages.
- Search pages and surrounding reads share the original cutoff, exclude later messages and newly joined groups, and paginate without skips or duplicates while access is unchanged.
- New searches find newly accepted messages without owner action. Retrieval failures are distinguishable from successful searches with no matches.
- Retrieval does not replay submissions or wake other bots. Existing group listing and paging remain available.

## API and contract

Bot owns the model tools and their access checks. Common history search and read tools serve bot chats and group chats, with scope derived from the calling context. The read tool supports bounded reads around stable message identifiers and pagination in both directions.

The existing `group_chats` tool continues to list current groups and page through their transcripts. The common history tools reuse its group membership rules; they do not add search to `group_chats`.

No new client endpoint or event is required by this feature. Any necessary public contract additions must remain compatible with contract major version 1. Generated contract definitions remain in bot.

## Clients

The owner asks questions and receives answers in existing bot chats and group chats. This feature requires no client-specific interface changes. Existing client support for those chats determines where it is available.

## Decisions

- Search messages first. Requests, facts, and decisions are the primary need; large, repetitive tool output would make results harder to use.
- Exclude compaction summaries. Results must lead to original evidence rather than summaries that may omit or distort details.
- Keep reads consistent with search. Surrounding context contains original messages, with explicit omissions for tool activity.
- Use case-insensitive literal substring search, newest first. It supports names, phrases, and identifiers without query syntax; stemming and typo tolerance are deferred.
- Use text search first. Semantic retrieval adds infrastructure and behavior that the initial need does not require.
- Enforce scope at retrieval time. Returned identifiers must not preserve access after group membership changes.
- Allow current members to retrieve pre-membership group history. This preserves existing group lookup behavior without introducing a separate history boundary.
- Limit group turns to their current group. Retrieval must not let a shared conversation pull material from private chats or other groups.
- Keep automatic compaction. Retrieval supplements working context without taking ownership of conversation submissions.
- Freeze search coverage at the start. New messages and memberships cannot shift paginated results, but current access checks still override the original coverage.
- Reuse the search cutoff for surrounding reads. One cutoff avoids separate read snapshots; current access checks make coverage-change reports unnecessary.
- Defer indexing explicitly. The first version accepts scan costs without promising a capacity or latency target.
- Use common history tools for both chat types. Preserve `group_chats` rather than adding a second search interface specific to groups.
- Bound query and response text. Limit queries to 500 code points, search pages to 20 matches with 500-code-point excerpts, and reads to 30 messages and 20,000 code points.

## Open questions

None.

The existing bot test `test/chat.test.ts`, “keeps the full transcript visible after compaction,” verifies original-message retention and passed during drafting. Search-specific restart and pagination guarantees remain implementation acceptance criteria.

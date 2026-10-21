# 0001: Group chats

- Status: Implemented
- Issue: [crumble-project/spec#2](https://github.com/crumble-project/spec/issues/2)
- Repositories: bot, apfelkern, desktop

## Problem

Bots can already message each other one-to-one, but the owner sees that work only as cards in each bot's own chat. Work that needs several bots happens out of view, and the owner has to piece it together. The owner cannot bring several bots into one conversation.

## Behavior

The owner creates a group chat, names it, and picks two to six bots as members. The owner can add and remove members later. A bot that joins gets a short summary of the earlier conversation, not the full history. A removed bot keeps what it saw but receives no new messages. A disabled member stays listed and is skipped until it is enabled again; a deleted member leaves the group, and its earlier messages keep its name. Group chats are listed separately from bots; each bot chat stays the private exchange between that bot and its owner.

Everyone in a group chat sees one shared transcript. Every message shows its sender.

- An owner message that mentions bots goes only to the mentioned bots.
- An owner message without a mention goes to every member. Each bot decides whether to answer, react, or stay silent.
- A bot message wakes only the bots it mentions.
- Replying to a message counts as mentioning its sender. Replies and attachments otherwise work as in a bot chat.

A bot may save memories from a group chat, but only to its own memory, not to shared memory. In its bot chat, a bot can look up its recent group chats when the owner asks about them; group messages are not added to its bot chat on their own.

The owner is notified when a bot mentions them and when the first bot answers one of their messages. Messages between bots and pauses do not notify.

Two limits keep bots from running away. After eight bot turns started by other bots since the owner's last message, the group pauses and shows that it is waiting for the owner. The owner's next message resumes it. The owner can also stop every running turn in the group at once.

## Out of scope

- Bots creating group chats. A later version may let a bot create a group that always includes the owner, with members limited to bots it may already message.
- Delegation and coding jobs started from a group turn.
- Group chats with more than one human.
- iOS and Android clients, which follow in a later specification.

## Acceptance criteria

- The owner can create, rename, and delete a group chat, and the group and its transcript survive server and client restarts.
- A message with mentions starts turns only for the mentioned bots; a message without mentions starts a turn for every member.
- A bot message without mentions starts no turns.
- Each bot runs at most one turn per group chat at a time; further mentions wait their turn.
- The group pauses once the bot-started turn budget is used up, and the owner's next message resumes it.
- Stopping the group ends every running turn in it, and no queued turn starts afterwards.
- A turn interrupted by a restart resumes or fails visibly, and never posts the same message twice.
- One bot's private working context and memory do not become visible to other members through the group chat.
- A bot saving a memory during a group turn can save only to its own memory, and the memory records the group it came from.
- Memories saved in a bot chat or scheduled task record their source too.
- Adding a member gives it a summary of earlier messages; removing one stops its turns, including queued ones.
- A disabled member starts no turns and the group shows it as disabled; deleting a member keeps its earlier messages attributed by name.
- A group cannot have fewer than two or more than six bots.
- Replying to a bot's message starts a turn for that bot.
- In its bot chat, a bot can answer what happened in its recent group chats.
- The owner is notified for mentions of the owner and for the first bot answer to each owner message, and for nothing else in a group.

## API and contract

Not designed yet. Expect new group chat resources, membership, messages, stop, and event stream payloads, and a model tool for looking up group chats. The server and API serve every client from the start. Additions should be compatible within contract major version 1.

## Clients

Desktop lists group chats in their own section and shows mentions, senders, disabled members, the paused state, and a stop control. iOS and Android follow later.

## Decisions

- **A group chat is separate from bot chats.** Copying group messages into each member's bot chat would mix several conversations into one transcript and keep N copies that can diverge. Each member instead gets its own working context for the group, kept with that bot, while the group transcript is stored once.
- **Only the owner creates group chats in this version.** It keeps the owner in control of their chat list and avoids rules for which bots a bot may add.
- **Bots wake each other only by mention.** This prevents most loops; the turn budget guarantees an end when bots keep mentioning each other.
- **No delegation from group turns.** Like the existing rule that a bot handling another bot's request cannot delegate, this keeps group work visible and prevents cycles.
- **New members get a summary, not the full history.** It keeps their working context small; the owner can still read the whole transcript.
- **Group memories are the bot's own.** Writing to shared memory from a group would let one conversation change every bot's context.
- **Bot chats look up group chats on request.** Copying group content into every member's bot chat would bloat its working context; without a lookup, the bot could not answer questions about group decisions.
- **Notifications only for what needs the owner.** Bot-to-bot traffic would otherwise flood the owner, and a pause is visible in the group.
- **Memories record their source.** The owner can trace a memory to the group, bot chat, or task it came from, which the parity research requires for memory.
- **A turn budget of eight.** A fixed server value, tuned once group chats are in use rather than exposed as a setting.
- **Two to six bots.** Matches the Hermes Agent group size; one bot is a bot chat.
- **Desktop first.** It is the flagship client. The API is designed for all clients so mobile needs no server changes.

## Open questions

None.

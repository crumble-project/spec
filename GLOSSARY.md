# Crumble

Crumble gives each bot an identity, ongoing responsibilities, and a continuous chat with its owner.

This is the canonical glossary for every Crumble repository. Repository glossaries link here instead of copying terms.

## Language

**Bot**:
An independently configured assistant with its own identity, memory, capabilities, and responsibilities.
_Avoid_: Persona, session

**Bot chat**:
The continuous direct-message exchange between a bot and its owner, including work the bot performs in the background.
_Avoid_: Conversation session, new chat

**Bot chat delivery**:
The progress of an owner's message from sending to confirmation in the bot chat's transcript, including failed sends and retries.
_Avoid_: Message execution, completed bot work

**Group chat**:
A conversation between the owner and several bots, with one shared transcript in which every message shows its sender. It is separate from each member's bot chat.
_Avoid_: Room, channel, group session

**Transcript**:
The complete visible history of a bot chat or group chat, including messages, replies, tool activity, and compaction events.
_Avoid_: Model context

**Working context**:
The selected recent messages, summaries, instructions, and recalled material available to the bot for its next response.
_Avoid_: Full history, transcript

**Compaction**:
Summarizing older working context while keeping the original transcript available to the owner.
_Avoid_: Deleting history, starting a new chat

**Reply**:
A new message linked to an earlier transcript message, recalling that message and bounded surrounding context for the bot.
_Avoid_: Fork, branch, session

**Shared**:
Available to every bot that opts in, as opposed to belonging to one bot. Memory, skills, and MCP servers are either shared or a bot's own.
_Avoid_: Global, public

**Coding job**:
Background work a bot hands to a separate agent that edits files and runs commands in the bot's workspace. The job's answer returns to the bot's chat.
_Avoid_: Subagent, session, sub-chat

**Workspace**:
A bot's persistent files for coding jobs, on a disk only that bot's jobs can reach. The machine running them starts and stops as needed.
_Avoid_: Sandbox, container, VM (in product language)

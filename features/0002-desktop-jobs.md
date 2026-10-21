# 0002: Desktop jobs

- Status: Accepted
- Issue: [crumble-project/spec#6](https://github.com/crumble-project/spec/issues/6)
- Repositories: bot, apfelkern, desktop

## Problem

Bots can only reach the web through fetch tools and MCP servers, and their workspace has no screen. A lot of work only happens in a browser or a desktop app: sites without an API, pages that need JavaScript, forms, logged-in accounts, and file formats that need a GUI program. Today the owner has to do that work themselves or find an integration for each site.

## Behavior

The owner can give a bot a bot desktop: its own desktop with Chromium and a small set of apps, inside the bot's workspace. Only bots the owner enables get one. The owner chooses the model that runs the bot's desktop jobs.

In its bot chat, the bot hands desktop work to a desktop job, the way it hands file and command work to a coding job. A desktop job is a separate agent that reads the bot desktop's windows and acts on them with mouse and keyboard. Its answer returns to the bot's chat, and the owner sees the job as a card, like a coding job. One desktop job works on a bot's desktop at a time, and further desktop work waits.

The bot desktop keeps its state between jobs. Open windows may close, but files and browser logins persist, so the owner can log the bot into a site once.

The owner can watch a bot desktop live from the Crumble desktop client and take control of it at any time. While the owner has control, the desktop job pauses, and only the owner's mouse and keyboard reach the bot desktop. When the owner hands control back, the job continues from a fresh look at the screen. Nothing the job planned before the owner took control runs afterwards. Watching alone never lets the owner's input through.

A desktop job stops and asks when it reaches something that is the owner's to decide or do: a login, a captcha, a payment, or a choice the task didn't settle. The owner is notified, then either answers in the bot chat or takes control, does the step, and hands back.

When a desktop job needs a program the bot desktop doesn't have, the bot installs it through a coding job. New network hosts follow the workspace's network rules.

## Out of scope

- Watching and taking control from iOS and Android, which follow in a later specification.
- Desktop jobs started from group chat turns, matching the rule for coding jobs.
- More than one bot desktop per bot, or a bot desktop shared between bots.
- Windows and macOS bot desktops.
- Audio, video calls, and screen recording.
- Keeping programs installed outside the workspace's files across image changes.

## Acceptance criteria

- The owner can enable and disable the bot desktop for a bot. A bot without it has no desktop job tool, and its workspace uses the image without a desktop.
- The owner can choose the model for a bot's desktop jobs, and the next desktop job uses it.
- A bot with a bot desktop can start a desktop job, send it follow-ups, and show its status, and the job's answer appears in the bot chat.
- A desktop job can open a URL, read the page, fill and submit a form, and report a value from the page, on a test page served by the test suite.
- A desktop job can operate a native GTK dialog.
- A desktop job cannot run shell commands, start jobs, delegate, schedule, or reach integrations.
- A second desktop job for the same bot waits until the first ends.
- The owner can watch a bot desktop live in the desktop client while a job works.
- While the owner only watches, their mouse and keyboard input does not reach the bot desktop.
- After the owner takes control, their pointer, keyboard, and clipboard input reach the bot desktop, and the job takes no action.
- A job action planned before the owner took control does not run after control returns; the job looks at the screen again first.
- Only the owner can watch or take control of a bot desktop, and a viewer link cannot be reused.
- Browser logins and files on the bot desktop survive a bot desktop restart and a server restart.
- Enabling the bot desktop for a bot that already has a workspace keeps the files in its workspace.
- A desktop job that needs the owner ends its turn with a question, not a guess, in a scripted test that hits a login page, and the owner is notified.
- A desktop job interrupted by a server restart resumes or fails visibly.
- If the owner keeps control when the server restarts or the client disconnects, the job stays paused until control is handed back.
- An idle bot desktop stops, and the next desktop job starts it again. A bot desktop the owner is watching or controlling does not count as idle.

## API and contract

Not designed yet. Expect, modeled on coding jobs:

- A desktop job model tool with start, send, and show actions.
- A server capability flag for bot desktops, like `coding`.
- Per-bot settings that enable the bot desktop and choose the desktop job model.
- Desktop job list and history endpoints, like `/v1/agents/{id}/coding-jobs`.
- An authenticated viewer stream for the bot desktop, endpoints to take control and hand back, and events when control changes.

All additions should be compatible within contract major version 1.

## Clients

Desktop jobs appear as cards in the bot chat like coding jobs, which clients already render.

The desktop client adds a view of the bot desktop, reached from the bot and from a desktop job's card, with "Take control" and "Hand back". It shows who has control. A notification that a job needs the owner opens this view. iOS and Android follow later.

## Decisions

Measured in the spike at `crumble-project/spikes/microsandbox/den`; numbers are in its `results/den-spike.md`.

- **The bot desktop runs in the bot's existing workspace.** One machine per bot keeps files, network rules, and lifecycle in one place. A separate machine would double the bot's resources and split its files.
- **A separate job type, not the coding job.** A desktop job gets desktop tools and no shell. Coding jobs keep the shell and no desktop. Each stays small and its tools fit its work.
- **The owner chooses the desktop job model.** Models differ a lot in how well they operate a screen and what that costs. A per-bot choice lets the owner trade quality for cost.
- **No limit on bot desktops per host.** Owner decision, 2026-10-21. Each one with Chromium uses about 330 MiB.
- **Two workspace images.** A base image for every bot with a workspace, and a desktop image on top that adds the bot desktop. The desktop adds about 1 GB, which bots without one shouldn't carry. Both come from one Dockerfile in bot. Image builds run outside the unit-test CI.
- **Openbox and tint2.** Their memory use is negligible next to Chromium; the whole bot desktop with Chromium and one page used about 330 MiB. Every window opens maximized without decorations, so the job sees content, not window chrome. Xfce idles at about 220 MiB.
- **Accessibility tree first, screenshots as fallback.** The desktop job reads windows as an accessibility tree and acts on numbered elements. After the first read it gets only what changed. In the spike's scripted tasks, this cost 2 to 9 times fewer tokens than screenshots, and it reads results back as text. Screenshots stay available for what the tree can't show.
- **cua-driver as the driver, behind one wrapper tool.** It reads the tree and delivers input on X11. It is MIT licensed, needs glibc, and is a pre-release, so its version is pinned in the image. Its own tool list is about 57,000 tokens, so the job gets one `computer_use` tool with an action field instead, ported from Hermes Agent. Its telemetry is turned off in the image.
- **Background input first, then foreground, without asking.** GTK apps need background accessibility actions, and Chromium needs foreground keyboard input. The bot owns its display, so foreground input disturbs no one.
- **Driving Chromium through CDP is not the main route.** cua-driver's CDP snapshot cost about as much as a screenshot and could not click a `<summary>` element.
- **No per-action approval.** The bot desktop sits inside the workspace's isolation and network rules. Approval stays where it is today: pushes, pull requests, and new network hosts.
- **Taking control is part of this version.** A desktop job that needs a login or a captcha is stuck without it. Owner decision, 2026-10-21.
- **The server filters viewer input and holds a control lease.** The viewer stream passes through the server, which drops the owner's input unless they hold control. Each change of control voids every job action planned before it. The spike's noVNC bridge passed all checks for this, including noVNC's clipboard and keyboard messages. The bot desktop exposes no network port of its own.
- **The desktop client shows the bot desktop with noVNC in a web view.** The bot desktop is only pixels, so a web view doesn't look less native there. Take control, Hand back, and the status are SwiftUI controls around it. It reuses the stream and input filter the spike proved, and works in a web view on iOS later. A native RFB client would add a third-party Swift library and re-prove the same behavior; revisit it only if the web view feels slow.
- **A paused job waits without a time limit.** It makes no model calls while it waits, and giving up would discard work while the owner is helping. The owner can stop the job from its card.
- **One desktop job per bot desktop at a time.** Two agents on one pointer and keyboard would fight over focus.
- **Programs are installed by coding jobs.** A desktop job has no shell. Typing commands into a terminal through simulated keys is slow and fragile.
- **Installed programs may be lost on image changes.** Only the workspace's files carry over. Owner decision, 2026-10-21. Programs every bot needs belong in the desktop image.
- **Persistent browser logins are acceptable.** Owner decision, 2026-10-21.

## Open questions

None.

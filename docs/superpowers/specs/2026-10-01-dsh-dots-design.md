# `dsh-dots` — Always-on personal agents for DeepSeek Harness

**Status:** design (approved for spec)
**Date:** 2026-10-01
**Reference:** OpenAI Dots (Sep 29 2026) and [composio-community/open-dot](https://github.com/composio-community/open-dot)

---

## 1. Problem

OpenAI Dots are "always-on" personal AI agents that keep working in the background on their own computers, waking on schedules and triggers, using a browser, and asking before risky actions. `open-dot` is an open-source single-user recreation of that idea as a Mac desktop app.

DeepSeek Harness (DSH) already provides the agent loop, tools, models, sessions, scheduling, goals (autonomous continuation), approval, credentials, and UI extension points. This plugin composes those existing services into the same "dot" experience, so a user can create persistent, always-on agents inside DSH — including driving a real browser with a live view they can take over.

## 2. Goals

- Let a user create, name, edit, and delete **dots** — persistent personal agents.
- A dot **works on its own**: it has a durable goal and continues across autonomous rounds until complete, paused, blocked, or cleared.
- A dot can **wake on a schedule** (cron / daily / weekly / one-shot / interval) and run a routine.
- A dot can **drive a real browser** (navigate, click, type, screenshot, extract), with a **live view** the user can watch and **take over / hand back**.
- **Risky actions ask first**: sensitive tools pause on an approval card and fail closed when no one can approve.
- A dot has **per-dot memory** (facts and reusable skills) injected into its context.
- The whole thing is manageable from a **"Dots" panel** in the DSH web UI.

## 3. Non-goals (v1)

- Webhook/event triggers (GitHub, email, etc.) — deferred to v2.
- Password vault (encrypted site credentials) — deferred to v2.
- Voice calls — out of scope.
- Cloud/E2B computers and Docker sandboxes — out of scope (local browser only).
- Open-model routing through OpenRouter — out of scope (use DSH's configured models).
- True 24/7 headless "cloud" always-on — dots run only while the DSH host is running, same as `open-dot`'s Mac app.

## 4. Architecture

Two packages, mirroring DSH's own host/client split:

- **`dsh-dots`** — host plugin. Dot registry/store, session runner, scheduler bridge, browser tool, approval integration, memory, credential vault (v2).
- **`dsh-client-ui-dots`** — web client plugin. "Dots" management panel, per-dot chat, schedule editor, browser live view + take-over, approval-rule editor.

The host plugin is a thin orchestration layer over DSH services (Approach 1 — "compose"). It does not reimplement an agent loop, scheduler, approval, or browser manager from scratch.

### Services composed

| Need | DSH service | Package |
|---|---|---|
| Dot definition persistence | storage | `dsh-storage` (+ `dsh-storage-json`) |
| Agent sessions | agents | `dsh-agent` |
| Autonomous "keep working" | goals | `dsh-goal` |
| Routines / schedules | schedule | `dsh-schedule` |
| Triggers (v2) | webhook | `dsh-webhook` |
| Approval gate | user approval | `dsh-user-approval` |
| Tool registry + ask policy | tools | `dsh-tools` |
| Browser (v1 local) | Playwright/Chrome + tools | plugin-owned |
| Secrets / vault (v2) | credentials | `dsh-credentials` |
| Management UI | slots | `dsh-client-ui-slots` |

## 5. Components

Each component is a single unit with one responsibility, a clear interface, and no knowledge of unrelated internals.

### 5.1 Dot registry & store (`ctx.dots`)

**Responsibility:** the source of truth for dot definitions.

**Dot record:**
```ts
interface Dot {
  id: string            // uuid
  name: string          // human label, trimmed, <= 120 chars
  goal: string          // durable objective (single, like dsh-goal)
  schedule?: ScheduleSpec   // optional; see §5.3
  browser: {            // browser profile binding
    profileDir: string  // Chrome user-data-dir for this dot
    viewport?: { width: number; height: number }
  }
  memory: DotMemory     // see §5.6
  approvalRules: ApprovalRule[]  // see §5.5
  createdAt: number
  updatedAt: number
}
```

**Interface:** `list()`, `get(id)`, `create(input)`, `update(id, patch)`, `remove(id)`. All writes are atomic and persisted via `dsh-storage`.

### 5.2 Dot session runner

**Responsibility:** materialize a dot as a live agent session and keep it working.

**Behavior:**
1. `start(dotId)` creates/resumes a dedicated agent session via `ctx.agents` (session id derived from the dot id, e.g. `dot-<id>`).
2. Attach the dot's `goal` through `dsh-goal` so autonomous rounds continue until the goal is `complete`/`paused`/`blocked`/`cleared`.
3. Inject the dot's memory + approval rules into the system prompt each turn (see §5.6).
4. Surface output in the dot's chat; report terminal states (completed / blocked + code).

**Why reusing `dsh-goal`:** it already provides durable objective state, round cap (default 256), resume-after-restart, and the block phase with a stable policy code. We do not rebuild it.

### 5.3 Scheduler bridge

**Responsibility:** map a dot's routine to `dsh-schedule` tasks.

**ScheduleSpec** maps 1:1 to `dsh-schedule` selectors: `after_seconds`, `at`, `every_seconds`, `daily`, `weekly`, `cron`. Each dot routine = one schedule task whose `prompt` is the routine instruction and whose session is the dot's session.

**Behavior:** on delivery, `dsh-schedule` sends the routine prompt as a follow-up message in the dot's session; the goal-driven loop then runs. Missed occurrences while the host is closed are skipped (dsh-schedule keeps only the latest missed occurrence).

### 5.4 Browser tool + live view

**Responsibility:** let a dot drive a real browser, and let the user watch/take over.

**Tool set** (registered via `ctx.tools.register(defineTool(...))`):
- `browser.navigate(url)` — open/refresh a page.
- `browser.screenshot()` — return a screenshot (and push it to the live view).
- `browser.extract(selector?)` — readable text/DOM of the page.
- `browser.click(selector|text)` — click an element.
- `browser.type(selector|text, value)` — type into a field.
- `browser.read()` — current URL + visible text (for take-over handoff context).
- `browser.take_over(reason)` — hand control to the user (pauses the dot; user resumes).
- `browser.hand_back()` — user returns control.

**Implementation:** a plugin-owned Playwright/Chromium driver keyed by dot (one Chrome user-data-dir per dot, so the dot stays logged in — mirrors open-dot's `computer/browser.ts`). The driver exposes these as typed tools; each `browser.*` tool returns a declared JSON result.

**Live view:** a client sidebar slot streams the current screenshot/DOM to the UI; `take_over` surfaces an interactive pane the user drives directly (clicks/keys forwarded to the same Playwright page), then `hand_back`.

### 5.5 Approval gate

**Responsibility:** pause sensitive actions for a human decision.

**Behavior:** risky tools are registered with the `ask` policy (`dsh-tools` enforces allow/deny/ask), which routes through `dsh-user-approval`. The user allows/denies from the existing approval card. With no terminal answerer, `dsh-user-approval` resolves `unavailable` and the action fails closed.

**ApprovalRule** (per dot) — e.g. "reply to email → always ask", "read files → allow". Applied as the dot's tool policy/ask classification.

**Reference:** open-dot's `agent/review.ts` ("a small model checks each risky action against your rules"). v1 implements rules as a declarative allow/ask list rather than a review model; a review model can be added later.

### 5.6 Memory

**Responsibility:** per-dot durable facts and reusable skills.

**Behavior:** `DotMemory` = `{ facts: string[], skills: Skill[] }` persisted in `dsh-storage`. The runner rebuilds the dot's system-prompt section each turn from memory + rules (mirrors open-dot's `agent/prompt.ts` "rebuilt every turn"). A `dot.remember(fact)` / `dot.learn(skill)` tool lets the agent persist new memory.

### 5.7 Credential vault (v2)

Site passwords stored via `dsh-credentials` records; the browser tool types them into the page so the model never sees the value (open-dot's `vault.ts`).

### 5.8 UI panel (`dsh-client-ui-dots`)

**Responsibility:** management surface.

- Sidebar entry → "Dots" list (name, goal, status: running / idle / blocked / complete).
- Create/edit dot form (name, goal, schedule, approval rules).
- Per-dot chat view.
- Browser live view with take-over controls.
- Schedule editor.

Implemented via `dsh-client-ui-slots` (register components into existing slots; a store seat per dot for live state).

## 6. Data flow (one dot run)

```
schedule fires | manual kick | (v2) webhook
        │  deliver routine prompt into dot's session
        ▼
dot session (goal-driven, autonomous rounds)
        │  agent plans → calls tools (incl. browser.*)
        ├─ risky tool ──▶ dsh-user-approval ──▶ approval card
        │                                        ├─ allow → execute
        │                                        └─ deny   → blocked (typed error)
        ▼
memory updates persist; browser live view streams
        ▼
goal completes / paused / blocked(code) / cleared
        │
        ▼
dot idles until next wake
```

## 7. Error handling

| Failure | Behavior |
|---|---|
| Browser unavailable / crash | `browser.*` returns typed error; dot may retry or request take-over |
| No approval answerer | `dsh-user-approval` fails closed → action denied |
| Schedule missed while host closed | skipped (dsh-schedule: latest missed occurrence only) |
| Provider limit / budget / needs human | `dsh-goal` `block` phase with stable policy code |
| Dot session create failure | surfaced in the Dots panel with a retry action |
| Conflicting dot ids | store enforces uniqueness; create rejects |

## 8. Testing

- **Unit:** dot store CRUD + validation; ScheduleSpec ↔ schedule-task mapping; browser tool arg validation; memory→prompt rendering.
- **Integration:** registered tools appear in the agent tool list; approval gate fails closed with no answerer; a scheduled routine wakes a dot and produces output; browser `navigate`+`extract` round-trip on a local fixture page.
- **Manual:** create a dot, schedule a daily routine, watch it run; take over the browser mid-run and hand back; verify a blocked goal surfaces its code.

## 9. Milestones

1. **M1 — Dot core:** registry/store, session runner, goal-driven autonomous run, memory injection. A dot can be created and runs to completion on its goal.
2. **M2 — Routines:** scheduler bridge; a dot wakes on a cron/daily schedule.
3. **M3 — Approval:** risky tools carry `ask` policy; approval card gates them; fail-closed verified.
4. **M4 — Browser:** Playwright driver + tools + live view + take-over/hand-back.
5. **M5 — UI:** `dsh-client-ui-dots` panel (list, create/edit, per-dot chat, live view, schedule editor).
6. **M6 — v2 (deferred):** webhook triggers, credential vault, multi-dot handoff, review model for rules.

## 10. Open questions (resolve during implementation, not blockers)

- Exact `dsh-client-ui-slots` slot names to occupy for the sidebar and settings (discover from the shipped `dsh-client-ui-*` packages).
- Whether a dot session should also expose the standard DSH tools (bash/fs/web) or a restricted subset — default: standard set plus `browser.*`, minus tools the dot's rules mark risky.
- Chrome binary discovery (use installed Chrome, fall back to Playwright's Chromium — mirror open-dot).

## 11. Decisions already made

- Runs while DSH host is open (parity with open-dot's Mac app).
- One dot = one session + one current goal (reuses DSH's goal model).
- Two packages (host + client UI), following DSH's own split.
- v1 approval is a declarative allow/ask list, not a review model.

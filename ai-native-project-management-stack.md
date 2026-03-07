# 3-GPT Stack for an AI-Native Project Manager

Project management is shifting from coordination to cognition. The operating advantage comes from embedding intelligence into daily execution so teams can sense changes early, decide quickly, and adapt continuously.

## GPT 1 — Signal Interpreter

### Purpose
Turn fragmented project noise into structured awareness by extracting decisions, risks, dependencies, blockers, and alignment gaps from meetings, tickets, chat threads, and status updates.

### Core shift
Stop chasing updates manually and start operating from a live decision-and-risk map.

### Where critical knowledge gets lost (typical failure points)
- Meeting decisions are spoken but not logged with owners and due dates.
- Ticket comments contain hidden blockers that never reach planning artifacts.
- Cross-team dependencies are implied but not explicitly tracked.
- Status updates report activity but not confidence, risk trend, or escalation need.
- Misalignment appears as wording differences across teams and documents.

### Inputs
- Meeting transcripts and recordings (Zoom/Meet notes).
- Jira/Linear tickets, comments, labels, and sprint changes.
- Slack/Teams channels and decision-heavy threads.
- Weekly status updates, docs, and roadmap notes.

### Outputs
- **Decision log:** what was decided, by whom, when, and impacted scope.
- **Risk register draft:** probability, impact, trigger signals, owner, mitigation.
- **Dependency map:** upstream/downstream handoffs and expected dates.
- **Misalignment alerts:** contradictions in scope, timeline, and ownership.
- **Daily PM brief:** “What changed? What needs a decision today?”

### Prompt contract (system behavior)
Use this as the GPT's core instruction set:

> You are the Signal Interpreter for project execution.
> Your job is to convert unstructured project communication into structured, decision-ready intelligence.
> Always extract:
> 1) Decisions made (with owner + date),
> 2) Risks (with probability/impact and rationale),
> 3) Dependencies (team, item, due date, status),
> 4) Misalignment signals (conflicting claims, unclear ownership, date inconsistencies),
> 5) Open questions requiring leadership input.
> Return output in JSON first, then a short human-readable summary.
> If confidence is low, mark fields with `confidence: low` and explain why.

### Suggested output schema (JSON)
```json
{
  "source": "meeting|ticket|chat|status_update",
  "date": "YYYY-MM-DD",
  "decisions": [
    {
      "decision": "",
      "owner": "",
      "deadline": "",
      "confidence": "high|medium|low"
    }
  ],
  "risks": [
    {
      "risk": "",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "owner": "",
      "mitigation": "",
      "confidence": "high|medium|low"
    }
  ],
  "dependencies": [
    {
      "from_team": "",
      "to_team": "",
      "dependency": "",
      "needed_by": "",
      "status": "on_track|at_risk|blocked"
    }
  ],
  "misalignment_flags": [
    {
      "type": "scope|timeline|ownership|priority",
      "description": "",
      "evidence": ""
    }
  ],
  "open_questions": [""],
  "pm_summary": ""
}
```

### Operating cadence
- Run after every major meeting and at end-of-day.
- Publish summaries to #project-leadership.
- Auto-create/refresh risk and dependency tickets.
- Weekly trend review: risk velocity, unresolved decisions, dependency aging.

### KPIs
- % of meetings with documented decisions within 2 hours.
- Mean time from risk signal to owner assignment.
- Dependency miss rate (planned vs actual handoff).
- # of unresolved misalignment flags older than 7 days.

---

## GPT 2 — Decision Copilot

### Purpose
Improve decision quality and speed by turning current project state into clear options, trade-offs, and recommendations.

### Core shift
From “status reporting” to “decision engineering.”

### What it does
- Builds decision briefs from Signal Interpreter outputs.
- Generates 2–4 viable options with cost, timeline, risk, and confidence.
- Surfaces assumptions, second-order effects, and reversibility.
- Recommends a default path and fallback trigger.

### Inputs
- Current decisions, risks, dependencies, scope constraints.
- Capacity/budget constraints.
- Strategic priorities and deadlines.

### Outputs
- One-page decision memo.
- Option matrix (impact, effort, risk, reversibility).
- Recommendation + “what would change my mind” conditions.
- Escalation package for leadership when needed.

### KPI focus
- Decision cycle time.
- % of decisions revisited due to missing assumptions.
- Stakeholder clarity score after decision meetings.

---

## GPT 3 — Adaptation Orchestrator

### Purpose
Turn decisions into reliable execution by continuously detecting drift and triggering corrective actions.

### Core shift
From static plans to adaptive control loops.

### What it does
- Monitors plan vs reality across milestones, scope, and throughput.
- Detects drift early (schedule slip, quality drops, dependency stalls).
- Proposes recovery plays with impact forecasts.
- Runs weekly retrospectives on what adaptation patterns worked.

### Inputs
- Delivery metrics (lead time, throughput, defect trend).
- Decision logs and dependency status.
- Team capacity changes and incident data.

### Outputs
- Drift alerts with root-cause hypotheses.
- Recovery playbooks (re-sequence, de-scope, reassign, escalate).
- Adaptive weekly plan with confidence bands.
- Learning loop report (“signals we missed / signals that predicted issues”).

### KPI focus
- Forecast accuracy.
- Recovery time from major deviation.
- % of high-risk items mitigated before impact.

---

## How the 3 GPTs work together
1. **Signal Interpreter** senses and structures reality.
2. **Decision Copilot** converts reality into high-quality choices.
3. **Adaptation Orchestrator** closes the loop by adjusting execution.

This stack creates a leadership system where intelligence is continuously available, rather than sporadically consulted.

---
name: playwright-agent-verification-0.36.0
description: Playwright verification results for v0.36.0 agent and component split changes. All pages green, 0 console errors across 5 page navigations.
type: project
---

# v0.36.0 Playwright Verification

**Date:** 2026-05-01
**Verification method:** playwright-cli against running Hono server on localhost:3210

## Verified Features

### Agent Chat (multi-turn)
- 14 agents rendered in directory grid with names, descriptions, tool counts
- Agent selection via combobox dropdown enables chat UI
- SSE streaming confirmed: "Analyzing..." indicator, Stop button during streaming
- Tool calls render during streaming (rm_analyze visible)
- Multi-turn: 2 consecutive messages displayed simultaneously, history preserved
- Export: markdown file downloaded with both user messages and `## Chat with studio-advisor` header
- Clear, Export, Stop buttons all functional

### Advisor Panels (Projects + Storygraph)
- Projects: "Ask Advisor" opens sg-story-advisor panel with Story Advisor heading, textbox, Ask button
- Storygraph: Advisor panel opens, question typed and sent, "Analyzing..." appears
- Textbox disabled during streaming (correct)
- "Hide Advisor" button works

### Component Splits (all verified via page rendering)
- PipelineWizard (339 lines): WizardStepper (7 steps + skip dropdown), WizardOverviewCards (3 metric cards), WizardSeriesBreakdown (desktop table + mobile accordion), WelcomeBanner
- AgentChat (479 lines): AgentDirectory (agent grid), ChatInput (textarea + send/abort + file attach), FilePickerModal, AgentCapabilityCard
- Projects (348 lines): BuildPanel (build progress steps), ReviewChecklist (collapsible episode readiness), ScaffoldEpisode (scaffold form with series selector)

### Onboarding Tour
- First visit: overlay with z-index 9999 renders, "1 / 5" step indicator present
- Escape key dismisses tour
- localStorage persists dismissed state

## Key Metrics
- Console errors: 0 across all 5 pages navigated (Wizard, AgentChat, Projects, Storygraph, Settings)
- Build: 425KB, 31 chunks
- Tests: 316 pass, 0 fail

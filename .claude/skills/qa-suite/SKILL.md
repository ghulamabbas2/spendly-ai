---
name: qa-suite
description: Run end-to-end QA for a feature against the running app using Maestro. Use whenever the user asks to run QA, test a feature end to end, verify a feature works, or run the QA scenarios — or says things like "run QA", "test this end to end", "QA the add-expense flow", or "run the Maestro flows". Reads docs/testing.md, then the QA Scenarios section from the feature's plan at ./plans/<branch>.md, drives each scenario against the running app, and reports pass/fail per scenario. Runs QA only — does not fix code, does not commit. On any failure, stops and hands back for a decision.
---

# QA Suite

Run this **against a built feature with the app already running** (see [`create-feature`](../create-feature/SKILL.md) and [`write-tests`](../write-tests/SKILL.md)). It drives the app end-to-end with Maestro and reports results. It does **not** fix code and does **not** commit.

## Workflow

1. **Read `docs/testing.md` first.** This is the source of truth for the Maestro layer — flow location (`.maestro/<feature>/`), naming, structure, and how flows map to QA Scenarios. Do not improvise a different layout.

2. **Load the QA Scenarios.** Determine the branch with `git branch --show-current`, then read `./plans/<branch>.md` and extract its **QA Scenarios** section. This is the authoritative list of what to verify — do not invent additional scenarios and do not skip listed ones. If no plan file exists, or it has no QA Scenarios section, stop and tell the user rather than guessing what to test.

3. **Check for existing flows.** Look in `.maestro/<feature>/` for a `.yaml` flow per scenario. If flows already exist for all scenarios, use them as-is. If flows are missing for some scenarios, write the missing ones following the conventions in `docs/testing.md` (one flow per scenario, kebab-case filename, `launchApp` with fresh state, asserts on visible UI). Do not modify existing flows beyond what's needed to make them runnable.

4. **Confirm the app is reachable.** Maestro drives a real Android emulator/device with the app already installed and running (`npm run android`) — Maestro does not build or launch the install itself. If no emulator/device is reachable, stop and tell the user rather than attempting to start one yourself.

5. **Run each scenario.** Execute `maestro test .maestro/<feature>/<flow>.yaml` per scenario (or the whole directory if convenient), one at a time so each result is attributable to its scenario.

6. **Stop on failure.** The moment a scenario fails, stop running further scenarios and report what's been observed so far — do not keep going, do not attempt a fix, and do not adjust the flow to work around the failure. Hand back to the user to decide next steps.

## Boundaries

- **QA only.** Do not modify implementation code (`src/`) to make a failing scenario pass. Do not modify a flow's assertions to make a failure disappear — if a flow itself is wrong (bad selector, wrong text), note that as a possible flow bug rather than silently loosening it.
- **New flows only when missing.** Only write a Maestro flow if the plan's scenario has no corresponding `.yaml` yet. Don't rewrite flows that already exist and work.
- **Do not commit.** Leave any newly written flow files in the working tree; do not stage, commit, branch, or push.
- **Stop at the first failure.** Do not continue through the remaining scenarios once one fails, and do not attempt to diagnose or fix the root cause yourself.

## When done

Report each scenario as **pass** or **fail** with a one-line note (what was verified, or what broke). If a failure stopped the run early, say so explicitly and list which scenarios were not yet run. Then stop and hand back — do not fix code, do not commit, and do not start any follow-on work.

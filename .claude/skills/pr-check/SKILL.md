---
name: pr-check
description: Review the current git diff or a pull request against the project checklist. Use when the user runs /pr-check.
disable-model-invocation: true
context: fork
allowed-tools: Read, Bash, Glob, Grep
---

## Current State

- Branch: !`git branch --show-current`
- Changed files: !`git diff --name-only HEAD~1 2>/dev/null || git diff --cached --name-only`
- Diff: !`git diff HEAD~1 2>/dev/null || git diff --cached`

Review the above changes against [checklist.md](checklist.md).

## Instructions

1. Read the full diff above
2. For each checklist item, mark ✅ (pass), ❌ (fail), or ➖ (not applicable)
3. For each ❌, provide the specific file:line and what needs to be fixed
4. Give an overall verdict at the end: **APPROVED** / **NEEDS CHANGES**

---
name: new-component
description: Scaffold a new React component with its test file following project conventions. Use when the user runs /new-component <ComponentName>.
disable-model-invocation: true
allowed-tools: Read, Write, Glob
---

Scaffold a new React component: $ARGUMENTS

## Steps

1. Parse `$ARGUMENTS` to get the component name (PascalCase)
2. Read [templates/component.tsx.template](templates/component.tsx.template)
3. Read [templates/component.test.tsx.template](templates/component.test.tsx.template)
4. Determine placement:
   - If name suggests a UI primitive → `src/components/ui/`
   - If name suggests a form element → `src/components/forms/`
   - Otherwise → `src/components/`
5. Create `src/components/<ComponentName>.tsx` by replacing:
   - `{{ComponentName}}` → PascalCase name (e.g., `MyCard`)
   - `{{component-name}}` → kebab-case name (e.g., `my-card`)
6. Create `tests/components/<ComponentName>.test.tsx` by replacing same placeholders
7. Report created file paths

## Naming Rules

- PascalCase for the component: `MyCard`
- kebab-case for CSS/test references: `my-card`
- File names match component name exactly

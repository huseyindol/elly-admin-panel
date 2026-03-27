Act as a Senior Frontend Architect and React Expert. I need you to build a "Schema-Driven Form Engine" using React, TypeScript, React Hook Form, and Zod.

**Tech Stack:**

- React 18+ (Next.js App Router context)
- TypeScript (Strict mode)
- React Hook Form (v7)
- Zod (for schema validation)
- Shadcn UI / Tailwind CSS (for UI components - assume these are available)

**Context:**
The backend sends a JSON schema defining a form. We need to render this form dynamically, generate Zod validation schemas on the fly, handle conditional visibility, and support different layouts (Wizard vs. Single Page).

**1. Type Definitions (`types/form.ts`)**
Define the TypeScript interfaces based on this backend contract:

- `FormSchema`: { id, title, config: { layout: 'wizard' | 'single' }, steps: Step[], fields: Field[] }
- `Field`: { id, type, label, required, validation?: { min, max, pattern }, condition?: ConditionRule, options?: Option[] }
- `ConditionRule`: { field, operator, value } - used to show/hide fields based on other field values.

**2. The Logic Core (`hooks/useFormSchema.ts` & `utils/zod-generator.ts`)**

- **Zod Generator:** Create a utility function `generateZodSchema(fields: Field[])` that iterates through the fields and constructs a Zod object dynamically.
  - Handle `required` (non-empty).
  - Handle `validation` rules (z.string().min(), z.number().max(), z.string().regex()).
  - _Crucial:_ If a field is hidden due to a condition, it should NOT block validation. (Hint: use Zod's `.optional()` or `superRefine` but the best approach is to let React Hook Form handle `shouldUnregister: true`).

- **Condition Logic:** Implement a helper to check visibility.
  - `isFieldVisible(field: Field, formValues: any): boolean`
  - Supports operators: EQUALS, NOT_EQUALS, GREATER_THAN.

**3. Component Architecture**

- **`FieldRenderer.tsx`:**
  - A component that takes a `field` definition and the `form` context.
  - Uses a mapping object (Registry) to render the correct component (`TextInput`, `Select`, `Checkbox`).
  - **Important:** It must use `useWatch` from React Hook Form to listen to the dependent field defined in `field.condition`. If the condition is NOT met, return `null` (don't render anything).

- **`DynamicForm.tsx` (The Container):**
  - Accepts `schema` (JSON) and `onSubmit` (function) as props.
  - Initializes `useForm` with the dynamically generated Zod schema (via `zodResolver`).
  - **Layout Handling:**
    - If `config.layout === 'wizard'`, render a multi-step interface with Next/Back buttons and a progress bar. Only show fields belonging to the current step.
    - If `config.layout === 'single'`, render all fields in a vertical stack.
  - **Form Submission:** Handle the `onSubmit` event.

**Output Instructions:**

- Provide the complete code for `types.ts`, `zod-generator.ts`, `FieldRenderer.tsx`, and `DynamicForm.tsx`.
- Use `react-hook-form`'s `FormProvider` to avoid prop drilling.
- Ensure strict TypeScript typing.
- Add comments explaining the "Conditional Logic" implementation specifically.

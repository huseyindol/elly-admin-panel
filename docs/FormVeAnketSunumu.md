Act as a Senior UI/UX Engineer and Tailwind CSS Expert. I need you to build the "Presentation Layer" (UI Components) for our Dynamic Form Engine.

**Tech Stack:**

- React (Functional Components)
- Tailwind CSS
- Lucide React (for icons)
- clsx / tailwind-merge (for class management)
- Framer Motion (optional, for smooth wizard transitions)

**Design System Requirements:**
The components must be "dumb" (stateless where possible) and reusable. They should focus on accessibility (a11y), responsive design, and error handling states.

**1. Base Input Components (`components/ui/`)**
Create the following atomic components. Each must accept a `label`, `error` (string), and standard HTML props.

- `Input.tsx`: A modern text input with a floating label or standard label support. Highlight red border on error.
- `Select.tsx`: A styled select box (native or custom).
- `CheckboxGroup.tsx` & `RadioGroup.tsx`: Stackable options with proper spacing.
- `FormError.tsx`: A small helper component to render validation error messages with an alert icon (red text, text-sm).

**2. Layout Components (`components/layout/`)**

- `WizardStepper.tsx`: A visual progress indicator.
  - Props: `currentStep` (number), `totalSteps` (number), `steps` (array of titles).
  - It should show completed steps in green/blue and current step in bold.
  - Mobile view: Show "Step 2 of 5" text. Desktop view: Show horizontal progress bar.
- `StepContainer.tsx`: A wrapper for the form content.
  - Use Framer Motion (or CSS transitions) to animate the entry of a new step (slide-in effect).

**3. Action Components**

- `Button.tsx`: A robust button component.
  - Variants: `primary` (solid color), `secondary` (outline), `ghost` (text only).
  - State: `isLoading` (show spinner), `disabled`.

**4. The "Master" Form Layout (`components/FormLayout.tsx`)**
Create a responsive container that centers the form on the screen.

- It should have a clean card shadow on desktop (`max-w-2xl`, `mx-auto`, `bg-white`, `rounded-xl`, `shadow-lg`).
- On mobile, it should be full width (`w-full`, `p-4`).

**Implementation Details:**

- Use `React.forwardRef` for Inputs so they work seamlessly with `react-hook-form`'s `...register` prop.
- Ensure all inputs have `aria-invalid` and `aria-describedby` attributes for accessibility when there is an error.
- Use `tailwind-merge` to allow overriding classes from the parent.

**Output:**
Provide the code for `Input.tsx`, `Select.tsx`, `WizardStepper.tsx`, `Button.tsx`, and `FormLayout.tsx`.

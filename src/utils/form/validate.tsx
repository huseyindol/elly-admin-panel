import z from 'zod'

// Validate form with Zod
export const validateForm = (
  schema: z.ZodSchema,
  formData: z.infer<typeof schema>,
  setErrors: (errors: Partial<z.infer<typeof schema>>) => void,
): boolean => {
  try {
    schema.parse(formData)
    setErrors({})
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Partial<z.infer<typeof schema>> = {}
      error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof z.infer<typeof schema>] =
            err.message as never
        }
      })
      setErrors(fieldErrors)
    }
    return false
  }
}

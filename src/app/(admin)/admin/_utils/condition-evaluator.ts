import type { ConditionOperator, Field } from '@/types/form'

/**
 * Evaluates if a field should be visible based on its condition rule.
 *
 * @param field - Field definition with optional condition
 * @param formValues - Current form values object
 * @returns true if field should be visible, false otherwise
 */
export function isFieldVisible(
  field: Field,
  formValues: Record<string, unknown>,
): boolean {
  if (!field.condition) {
    return true
  }

  const { field: dependentFieldId, operator, value } = field.condition
  const currentValue = formValues[dependentFieldId]

  return evaluateCondition(operator, currentValue, value)
}

/**
 * Evaluates a condition based on operator, current value, and expected value.
 * Operators: EQUALS, NOT_EQUALS, GT, LT (per API spec)
 *
 * Note: React Hook Form returns all values as strings, so we normalize
 * both sides to strings for equality checks and parse numbers for GT/LT.
 */
export function evaluateCondition(
  operator: ConditionOperator,
  currentValue: unknown,
  expectedValue: unknown,
): boolean {
  // Normalize both values to strings for comparison
  // This handles cases like form value "true" vs schema value true
  const currentStr = String(currentValue ?? '')
  const expectedStr = String(expectedValue ?? '')

  switch (operator) {
    case 'EQUALS':
      return currentStr === expectedStr

    case 'NOT_EQUALS':
      return currentStr !== expectedStr

    case 'GT': {
      const currentNum = Number(currentStr)
      const expectedNum = Number(expectedStr)
      if (!Number.isNaN(currentNum) && !Number.isNaN(expectedNum)) {
        return currentNum > expectedNum
      }
      return false
    }

    case 'LT': {
      const currentNum = Number(currentStr)
      const expectedNum = Number(expectedStr)
      if (!Number.isNaN(currentNum) && !Number.isNaN(expectedNum)) {
        return currentNum < expectedNum
      }
      return false
    }

    default:
      return true
  }
}

/**
 * Gets all visible field IDs for current form values.
 */
export function getVisibleFieldIds(
  fields: Field[],
  formValues: Record<string, unknown>,
): Set<string> {
  const visibleIds = new Set<string>()

  for (const field of fields) {
    if (isFieldVisible(field, formValues)) {
      visibleIds.add(field.id)
    }
  }

  return visibleIds
}

/**
 * Gets all fields that depend on a specific field.
 */
export function getDependentFields(fields: Field[], fieldId: string): Field[] {
  return fields.filter(field => field.condition?.field === fieldId)
}

/**
 * Compare two arrays of IDs to check if they have changed
 * Used for checking if banner/widget/post selections have changed
 */
export function hasIdArrayChanges(
  currentItems: { id: number }[],
  initialIds: number[],
): boolean {
  const currentIds = currentItems.map(item => item.id).sort((a, b) => a - b)
  const sortedInitialIds = [...initialIds].sort((a, b) => a - b)
  return JSON.stringify(currentIds) !== JSON.stringify(sortedInitialIds)
}

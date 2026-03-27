export type UserType = {
  id: number
  email: string
  firstName?: string | null
  lastName?: string | null
  password?: string | null
  createdAt: Date
  updatedAt: Date
}

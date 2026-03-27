import { z } from 'zod'

// Query Parameters for GET /api/users
export const UsersQueryParams = z.object({
  page: z.number().optional().describe('Page number for pagination'),
  limit: z.number().optional().describe('Number of users per page'),
  include_posts: z
    .boolean()
    .optional()
    .describe('Include user posts in response'),
  search: z.string().optional().describe('Search users by email or name'),
})

// Path Parameters for user by ID
export const UserParams = z.object({
  id: z.string().describe('User ID'),
})

// Request body for creating user
export const LoginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, { message: 'E-posta adresi gereklidir.' })
    .or(z.string().min(1, { message: 'Kullanıcı adı gereklidir.' }))
    .describe('E-posta adresi veya kullanıcı adı'),
  password: z
    .string()
    .min(1, { message: 'Şifre gereklidir.' })
    .min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  tenantId: z.string().optional().describe('Tenant ID (ör. tenant1, basedb)'),
})

// Request body for creating user
export const CreateUserBody = z.object({
  email: z.string().email().describe('User email address'),
  password: z.string().min(6).describe('User password'),
  firstName: z.string().optional().describe('User first name'),
  lastName: z.string().optional().describe('User last name'),
})

// Request body for updating user
export const UpdateUserBody = z.object({
  email: z.string().email().optional().describe('User email address'),
  firstName: z.string().optional().describe('User first name'),
  lastName: z.string().optional().describe('User last name'),
})

// User response schema (without password)
export const UserResponse = z.object({
  id: z.number().describe('User ID'),
  email: z.string().email().describe('User email address'),
  firstName: z.string().nullable().describe('User first name'),
  lastName: z.string().nullable().describe('User last name'),
  createdAt: z.date().describe('User creation date'),
  updatedAt: z.date().describe('User last update date'),
})

// Post schema for included posts
export const PostResponse = z.object({
  id: z.number().describe('Post ID'),
  title: z.string().describe('Post title'),
  content: z.string().nullable().describe('Post content'),
  published: z.boolean().describe('Whether the post is published'),
})

// Extended user response with posts
export const UserWithPostsResponse = UserResponse.extend({
  posts: z.array(PostResponse).optional().describe('User posts'),
})

// Users list response
export const UsersListResponse = z.object({
  users: z
    .array(UserResponse.or(UserWithPostsResponse))
    .describe('List of users'),
  pagination: z
    .object({
      page: z.number().describe('Current page number'),
      limit: z.number().describe('Items per page'),
      total: z.number().describe('Total number of users'),
      pages: z.number().describe('Total number of pages'),
    })
    .describe('Pagination information'),
})

// Success response for user creation/update
export const UserSuccessResponse = z.object({
  user: UserResponse,
  message: z.string().describe('Success message'),
})

// Delete success response
export const DeleteSuccessResponse = z.object({
  message: z.string().describe('Success message'),
})

// Login success response schema
export const LoginResponse = z.object({
  token: z.string().describe('JWT access token'),
  refreshToken: z.string().describe('JWT refresh token'),
  type: z.string().describe('Token type (Bearer)'),
  userId: z.number().describe('User ID'),
  username: z.string().describe('Username'),
  email: z.string().email().describe('User email'),
  userCode: z.string().describe('User code (firstName + lastName initials)'),
  expiredDate: z.number().describe('Access token expiry timestamp (ms)'),
})

// Export types for use in components
export type LoginInput = z.input<typeof LoginSchema>
export type UsersQueryParamsType = z.infer<typeof UsersQueryParams>
export type UserParamsType = z.infer<typeof UserParams>
export type CreateUserBodyType = z.infer<typeof CreateUserBody>
export type UpdateUserBodyType = z.infer<typeof UpdateUserBody>
export type UserResponseType = z.infer<typeof UserResponse>
export type UserWithPostsResponseType = z.infer<typeof UserWithPostsResponse>
export type UsersListResponseType = z.infer<typeof UsersListResponse>
export type UserSuccessResponseType = z.infer<typeof UserSuccessResponse>
export type DeleteSuccessResponseType = z.infer<typeof DeleteSuccessResponse>

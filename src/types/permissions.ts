/** Login veya /me/permissions response'undan gelen izin verisi */
export interface UserPermissions {
  roles: string[]
  permissions: string[]
  permissionsByModule?: Record<string, string[]>
}

/** Backend'deki modül isimleri — birebir eşleşmeli */
export const MODULES = {
  POSTS: 'posts',
  PAGES: 'pages',
  COMPONENTS: 'components',
  WIDGETS: 'widgets',
  BANNERS: 'banners',
  ASSETS: 'assets',
  COMMENTS: 'comments',
  FORMS: 'forms',
  RATINGS: 'ratings',
  CONTENTS: 'contents',
  BASIC_INFOS: 'basic_infos',
  MAIL: 'mail',
  EMAILS: 'emails',
  EMAIL_TEMPLATES: 'email_templates',
  CACHE: 'cache',
  TENANTS: 'tenants',
  USERS: 'users',
  ROLES: 'roles',
  RABBIT: 'rabbit',
} as const

export type ModuleKey = keyof typeof MODULES
export type ModuleValue = (typeof MODULES)[ModuleKey]
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'send'
  | 'retry'
  | 'submit'

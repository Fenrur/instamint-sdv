export const languageTypeArray = [
  "en",
  "fr",
  "es"
] as const

export type LanguageType = typeof languageTypeArray[number]

export const userRoleArray = [
  "user",
  "admin"
] as const

export type UserRole = typeof userRoleArray[number]

export const profileVisibilityTypeArray = [
  "public",
  "private"
] as const

export type ProfileVisibilityType = typeof profileVisibilityTypeArray[number]

export const notificationTypeArray = [
  "follow_requests",
  "follow_requests_accepted"
] as const

export type NotificationType = typeof notificationTypeArray[number]
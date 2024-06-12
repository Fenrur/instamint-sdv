import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core"
import {relations} from "drizzle-orm"
import {
  languageTypeArray,
  notificationTypeArray,
  profileVisibilityTypeArray,
  userRoleArray
} from "@/domain/types"

export const LanguageTypeEnum = pgEnum("LanguageType", languageTypeArray)

export const UserRoleEnum = pgEnum("UserRole", userRoleArray)

export const ProfileVisibilityTypeEnum = pgEnum("ProfileVisibilityType", profileVisibilityTypeArray)

export const NotificationTypeEnum = pgEnum("NotificationType", notificationTypeArray)

export const ProfileTable = pgTable("Profile", {
  id: serial("id").notNull().primaryKey(),
  username: varchar("username", {length: 16}).notNull().unique(),
  createdAt: timestamp("createdAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
  bio: varchar("bio", {length: 255}).notNull().default(""),
  link: varchar("link", {length: 255}),
  avatarUrl: varchar("avatarUrl", {length: 255}).notNull(),
  canBeSearched: boolean("canBeSearched").notNull().default(true),
  visibilityType: ProfileVisibilityTypeEnum("visibilityType").notNull().default("public"),
  location: text("location"),
  displayName: varchar("displayName", {length: 40}).notNull()
})

export const profileRelations = relations(ProfileTable, ({ many }) => ({
  followers: many(FollowTable, {
    relationName: "followerUserFk"
  }),
  following: many(FollowTable, {
    relationName: "followedUserFk"
  }),
  requesters: many(RequestFollowTable, {
    relationName: "requesterUserFk"
  }),
}))

export const UserTable = pgTable("User", {
  id: serial("id").notNull().primaryKey(),
  email: varchar("email", {length: 255}).notNull().unique(),
  uid: uuid("uid").notNull().unique().defaultRandom(),
  hashedPassword: varchar("hashedPassword", {length: 255}).notNull(),
  isActivated: boolean("isActivated").notNull().default(false),
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
  twoFactorSecret: varchar("twoFactorSecret", {length: 255}),
  phoneNumber: varchar("phoneNumber", {length: 20}),
  languageType: LanguageTypeEnum("languageType").notNull().default("en"),
  role: UserRoleEnum("role").notNull().default("user"),
  profileId: integer("profileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}),
  enabledNotificationTypes: NotificationTypeEnum("enabledNotificationTypes").array().notNull().default(["follow_requests", "follow_requests_accepted"]),
})

export const userRelations = relations(UserTable, ({one}) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.profileId],
    references: [ProfileTable.id],
  }),
}))

export const ReportProfileTable = pgTable("ReportProfile", {
  reporterProfileId: integer("reporterProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}).primaryKey(),
  reportedProfileId: integer("reportedProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}).primaryKey(),
  reason: varchar("reason", {length: 1000}),
  reportAt: timestamp("reportAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
})

export const ViewProfileTable = pgTable("ViewProfile", {
  id: serial("id").notNull().primaryKey(),
  viewerProfileId: integer("viewerProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}),
  viewedProfileId: integer("viewedProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}),
  viewAt: timestamp("viewAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
})

export const ScheduleDeletionUserTable = pgTable("ScheduleDeletionUser", {
  id: serial("id").notNull().primaryKey(),
  userId: integer("userId").notNull().unique().references(() => UserTable.id, {onDelete: "cascade"}),
  scheduleAt: timestamp("scheduleAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
  byUserId: integer("byUserId").notNull().references(() => UserTable.id, {onDelete: "cascade"}),
  reason: varchar("reason", {length: 1000})
})

export const FollowTable = pgTable("Follow", {
  followerProfileId: integer("followerProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}),
  followedProfileId: integer("followedProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}),
  followAt: timestamp("followAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
}, (table) => {
  return {
    pk: primaryKey({name: "Follow_pkey", columns: [table.followerProfileId, table.followedProfileId]})
  }
})

export const followRelations = relations(FollowTable, ({one}) => ({
  follower: one(ProfileTable, {
    fields: [FollowTable.followerProfileId],
    references: [ProfileTable.id],
  }),
  followed: one(ProfileTable, {
    fields: [FollowTable.followedProfileId],
    references: [ProfileTable.id],
  }),
}))

export const PasswordResetTable = pgTable("PasswordReset", {
  id: serial("id").notNull().primaryKey(),
  resetId: uuid("resetId").notNull().unique().defaultRandom(),
  userId: integer("userId").notNull().references(() => UserTable.id, {onDelete: "cascade"}),
  createdAt: timestamp("createdAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
  expireAt: timestamp("expireAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
  active: boolean("active").notNull(),
})

export const RequestFollowTable = pgTable("RequestFollow", {
  requesterProfileId: integer("requesterProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}).primaryKey(),
  requestedProfileId: integer("requestedProfileId").notNull().references(() => ProfileTable.id, {onDelete: "cascade"}).primaryKey(),
  requestAt: timestamp("requestAt", {withTimezone: false, mode: "string", precision: 3}).notNull(),
  isIgnored: boolean("isIgnored").notNull().default(false),
})

export const requestFollowRelations = relations(RequestFollowTable, ({one}) => ({
  requester: one(ProfileTable, {
    fields: [RequestFollowTable.requesterProfileId],
    references: [ProfileTable.id],
  }),
}))
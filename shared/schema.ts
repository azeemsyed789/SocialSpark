import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  billingPlan: varchar("billing_plan").notNull().default("free"), // free, pro, agency
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization members
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull().default("viewer"), // owner, admin, publisher, approver, viewer
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Platform enum
export const platformEnum = pgEnum("platform", [
  "tiktok",
  "instagram", 
  "youtube",
  "twitter",
  "linkedin",
  "reddit",
  "discord"
]);

// Social media accounts
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  platform: platformEnum("platform").notNull(),
  handle: varchar("handle").notNull(),
  tokensEncrypted: text("tokens_encrypted"),
  proxyId: varchar("proxy_id"),
  status: varchar("status").notNull().default("active"), // active, inactive, error
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: varchar("health_status").default("unknown"), // healthy, caution, error, unknown
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  features: varchar("features", { length: 255 }), // Comma-separated list of enabled features/services
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  name: varchar("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status").notNull().default("draft"), // draft, active, paused, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content types enum
export const contentTypeEnum = pgEnum("content_type", [
  "text",
  "image", 
  "video",
  "carousel"
]);

// Calendar slots for scheduling
export const calendarSlots = pgTable("calendar_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  tagline: text("tagline"),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, posted, failed
  variantGroupId: varchar("variant_group_id"), // for A/B testing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets storage
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  url: text("url").notNull(),
  type: varchar("type").notNull(), // image, video, audio
  filename: varchar("filename").notNull(),
  size: integer("size"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post jobs for queue processing
export const postJobs = pgTable("post_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calendarSlotId: varchar("calendar_slot_id").notNull().references(() => calendarSlots.id),
  assetId: varchar("asset_id").references(() => assets.id),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  providerPostId: varchar("provider_post_id"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  scheduledAt: timestamp("scheduled_at").notNull(),
  processedAt: timestamp("processed_at"),
  content: text("content"), // NEW: post content
  mediaUrls: text("media_urls").array(), // NEW: media URLs (array of strings)
  createdAt: timestamp("created_at").defaultNow(),
});

// A/B Tests
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  name: varchar("name").notNull(),
  parameter: varchar("parameter").notNull(), // caption, image, cta, schedule
  variantGroupId: varchar("variant_group_id").notNull(),
  winnerId: varchar("winner_id"),
  status: varchar("status").notNull().default("running"), // running, completed, paused
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Metrics tracking
export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postJobId: varchar("post_job_id").notNull().references(() => postJobs.id),
  platform: platformEnum("platform").notNull(),
  impressions: integer("impressions").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  watchTime: integer("watch_time").default(0), // in seconds
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 4 }),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 4 }),
  collectedAt: timestamp("collected_at").defaultNow(),
});

// Templates
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id), // null for global templates
  name: varchar("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  hashtags: text("hashtags").array(),
  scheduleHints: jsonb("schedule_hints"),
  category: varchar("category"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Proxies
export const proxies = pgTable("proxies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull(),
  ip: varchar("ip").notNull(),
  port: integer("port").notNull(),
  username: varchar("username"),
  password: varchar("password"),
  lastUsed: timestamp("last_used"),
  health: varchar("health").default("unknown"), // healthy, unhealthy, unknown
  createdAt: timestamp("created_at").defaultNow(),
});

// Drafts for Studio
export const drafts = pgTable("drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: varchar("title"),
  content: text("content"),
  mediaUrls: text("media_urls").array(),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedOrganizations: many(organizations),
  organizationMemberships: many(organizationMembers),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  members: many(organizationMembers),
  accounts: many(accounts),
  campaigns: many(campaigns),
  assets: many(assets),
  templates: many(templates),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMembers.orgId], references: [organizations.id] }),
  user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, { fields: [accounts.orgId], references: [organizations.id] }),
  calendarSlots: many(calendarSlots),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, { fields: [campaigns.orgId], references: [organizations.id] }),
  calendarSlots: many(calendarSlots),
  abTests: many(abTests),
}));

export const calendarSlotsRelations = relations(calendarSlots, ({ one, many }) => ({
  campaign: one(campaigns, { fields: [calendarSlots.campaignId], references: [campaigns.id] }),
  account: one(accounts, { fields: [calendarSlots.accountId], references: [accounts.id] }),
  postJobs: many(postJobs),
}));

export const postJobsRelations = relations(postJobs, ({ one, many }) => ({
  calendarSlot: one(calendarSlots, { fields: [postJobs.calendarSlotId], references: [calendarSlots.id] }),
  asset: one(assets, { fields: [postJobs.assetId], references: [assets.id] }),
  metrics: many(metrics),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  postJob: one(postJobs, { fields: [metrics.postJobId], references: [postJobs.id] }),
}));

export const abTestsRelations = relations(abTests, ({ one }) => ({
  campaign: one(campaigns, { fields: [abTests.campaignId], references: [campaigns.id] }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  organization: one(organizations, { fields: [templates.orgId], references: [organizations.id] }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  organization: one(organizations, { fields: [assets.orgId], references: [organizations.id] }),
  postJobs: many(postJobs),
}));

export const draftsRelations = relations(drafts, ({ one }) => ({
  organization: one(organizations, { fields: [drafts.orgId], references: [organizations.id] }),
  author: one(users, { fields: [drafts.authorId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true }).extend({ features: z.string().optional() });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCalendarSlotSchema = createInsertSchema(calendarSlots).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true });
export const insertPostJobSchema = createInsertSchema(postJobs).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDraftSchema = createInsertSchema(drafts).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Account = typeof accounts.$inferSelect & { features?: string };
export type InsertAccount = z.infer<typeof insertAccountSchema> & { features?: string };
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CalendarSlot = typeof calendarSlots.$inferSelect;
export type InsertCalendarSlot = z.infer<typeof insertCalendarSlotSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type PostJob = typeof postJobs.$inferSelect;
export type InsertPostJob = z.infer<typeof insertPostJobSchema>;
export type Metric = typeof metrics.$inferSelect;
export type ABTest = typeof abTests.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Proxy = typeof proxies.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;

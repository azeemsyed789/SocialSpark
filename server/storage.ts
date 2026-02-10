import {
  users,
  organizations,
  organizationMembers,
  accounts,
  campaigns,
  calendarSlots,
  assets,
  postJobs,
  metrics,
  abTests,
  templates,
  proxies,
  drafts,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Account,
  type InsertAccount,
  type Campaign,
  type InsertCampaign,
  type CalendarSlot,
  type InsertCalendarSlot,
  type Asset,
  type InsertAsset,
  type PostJob,
  type InsertPostJob,
  type Metric,
  type ABTest,
  type Template,
  type InsertTemplate,
  type Proxy,
  type Draft,
  type InsertDraft,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizationByUserId(userId: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  
  // Account operations
  createAccount(account: InsertAccount): Promise<Account>;
  getAccountsByOrg(orgId: string): Promise<Account[]>;
  updateAccountHealth(accountId: string, health: string): Promise<void>;
  updateAccount(accountId: string, data: Partial<Account>): Promise<Account>;
  deleteAccount(accountId: string): Promise<void>;
  
  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByOrg(orgId: string): Promise<Campaign[]>;
  
  // Calendar operations
  createCalendarSlot(slot: InsertCalendarSlot): Promise<CalendarSlot>;
  getCalendarSlotsByOrg(orgId: string, startDate?: Date, endDate?: Date): Promise<CalendarSlot[]>;
  updateCalendarSlotStatus(slotId: string, status: string): Promise<void>;
  
  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAssetsByOrg(orgId: string): Promise<Asset[]>;
  
  // Post job operations
  createPostJob(job: InsertPostJob): Promise<PostJob>;
  getPendingPostJobs(): Promise<PostJob[]>;
  getPostJobsByOrg(orgId: string): Promise<PostJob[]>;
  updatePostJobStatus(jobId: string, status: string, error?: string): Promise<void>;
  updatePostJob(jobId: string, data: Partial<PostJob>): Promise<void>;
  
  // Metrics operations
  recordMetrics(metrics: Omit<Metric, 'id' | 'collectedAt'>): Promise<Metric>;
  getMetricsByOrg(orgId: string, days?: number): Promise<any>;
  
  // Template operations
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplatesByOrg(orgId: string): Promise<Template[]>;
  getPublicTemplates(): Promise<Template[]>;
  
  // A/B Test operations
  getActiveABTests(orgId: string): Promise<ABTest[]>;
  
  // Analytics operations
  getDashboardMetrics(orgId: string): Promise<any>;
  getRecentActivity(orgId: string, limit?: number): Promise<any[]>;
  
  // Draft operations
  createDraft(draft: InsertDraft): Promise<Draft>;
  getDraftsByOrg(orgId: string): Promise<Draft[]>;
  updateDraft(draftId: string, data: Partial<Draft>): Promise<Draft>;
  deleteDraft(draftId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    
    // Add owner as organization member
    await db.insert(organizationMembers).values({
      orgId: org.id,
      userId: orgData.ownerId,
      role: "owner",
    });
    
    return org;
  }

  async getOrganizationByUserId(userId: string): Promise<Organization | undefined> {
    const [result] = await db
      .select({ organization: organizations })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .limit(1);
    
    return result?.organization;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const results = await db
      .select({ organization: organizations })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
      .where(eq(organizationMembers.userId, userId));
    
    return results.map(r => r.organization);
  }

  // Account operations
  async createAccount(accountData: InsertAccount): Promise<Account> {
    // Ensure orgId is set correctly for organization linkage
    const features = typeof accountData.features === 'string' ? accountData.features : (accountData.features ?? '');
    const orgId = accountData.orgId;
    const [account] = await db.insert(accounts).values({ ...accountData, orgId, features }).returning();
    return { ...account, features: account.features ?? '' };
  }

  async getAccountsByOrg(orgId: string): Promise<Account[]> {
    const rawAccounts = await db.select().from(accounts).where(eq(accounts.orgId, orgId));
    return rawAccounts.map(acc => ({ ...acc, features: acc.features ?? '' }));
  }

  async updateAccountHealth(accountId: string, health: string): Promise<void> {
    await db
      .update(accounts)
      .set({ healthStatus: health, lastHealthCheck: new Date() })
      .where(eq(accounts.id, accountId));
  }

  async updateAccount(accountId: string, data: Partial<Account>): Promise<Account> {
    const features = typeof data.features === 'string' ? data.features : (data.features ?? '');
    const [account] = await db
      .update(accounts)
      .set({ ...data, features })
      .where(eq(accounts.id, accountId))
      .returning();
    return { ...account, features: account.features ?? '' };
  }

  async deleteAccount(accountId: string): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, accountId));
  }

  // Campaign operations
  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async getCampaignsByOrg(orgId: string): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.orgId, orgId));
  }

  // Calendar operations
  async createCalendarSlot(slotData: InsertCalendarSlot): Promise<CalendarSlot> {
    const [slot] = await db.insert(calendarSlots).values(slotData).returning();
    return slot;
  }

  async getCalendarSlotsByOrg(orgId: string, startDate?: Date, endDate?: Date): Promise<CalendarSlot[]> {
    let query = db
      .select({
        slot: calendarSlots,
        campaign: campaigns,
        account: accounts,
      })
      .from(calendarSlots)
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .innerJoin(accounts, eq(calendarSlots.accountId, accounts.id));

    const conditions = [eq(campaigns.orgId, orgId)];
    if (startDate) {
      conditions.push(gte(calendarSlots.scheduledAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(calendarSlots.scheduledAt, endDate));
    }
    const results = await db
      .select({
        slot: calendarSlots,
        campaign: campaigns,
        account: accounts,
      })
      .from(calendarSlots)
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .innerJoin(accounts, eq(calendarSlots.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(calendarSlots.scheduledAt);
    return results.map(r => ({ ...r.slot, campaign: r.campaign, account: r.account })) as any;
  }

  async updateCalendarSlotStatus(slotId: string, status: string): Promise<void> {
    await db
      .update(calendarSlots)
      .set({ status, updatedAt: new Date() })
      .where(eq(calendarSlots.id, slotId));
  }

  // Asset operations
  async createAsset(assetData: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(assetData).returning();
    return asset;
  }

  async getAssetsByOrg(orgId: string): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.orgId, orgId));
  }

  // Post job operations
  async createPostJob(jobData: InsertPostJob): Promise<PostJob> {
    const [job] = await db.insert(postJobs).values(jobData).returning();
    return job;
  }

  async getPendingPostJobs(): Promise<PostJob[]> {
    return await db
      .select()
      .from(postJobs)
      .where(eq(postJobs.status, "pending"))
      .orderBy(postJobs.scheduledAt);
  }

  async getPostJobsByOrg(orgId: string): Promise<PostJob[]> {
    const results = await db
      .select({ postJob: postJobs })
      .from(postJobs)
      .innerJoin(calendarSlots, eq(postJobs.calendarSlotId, calendarSlots.id))
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .where(eq(campaigns.orgId, orgId))
      .orderBy(postJobs.scheduledAt);
    return results.map(r => r.postJob);
  }

  async updatePostJobStatus(jobId: string, status: string, error?: string): Promise<void> {
    const updateData: any = { status, processedAt: new Date() };
    if (error) updateData.error = error;
    
    await db
      .update(postJobs)
      .set(updateData)
      .where(eq(postJobs.id, jobId));
  }

  async updatePostJob(jobId: string, data: Partial<PostJob>): Promise<void> {
    await db.update(postJobs)
      .set(data)
      .where(eq(postJobs.id, jobId));
  }

  // Metrics operations
  async recordMetrics(metricsData: Omit<Metric, 'id' | 'collectedAt'>): Promise<Metric> {
    const [metric] = await db.insert(metrics).values(metricsData as any).returning();
    return metric;
  }

  async getMetricsByOrg(orgId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        totalImpressions: sql<number>`sum(${metrics.impressions})`,
        totalLikes: sql<number>`sum(${metrics.likes})`,
        totalComments: sql<number>`sum(${metrics.comments})`,
        totalShares: sql<number>`sum(${metrics.shares})`,
        avgEngagementRate: sql<number>`avg(${metrics.engagementRate})`,
        platform: metrics.platform,
      })
      .from(metrics)
      .innerJoin(postJobs, eq(metrics.postJobId, postJobs.id))
      .innerJoin(calendarSlots, eq(postJobs.calendarSlotId, calendarSlots.id))
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .where(and(eq(campaigns.orgId, orgId), gte(metrics.collectedAt, startDate)))
      .groupBy(metrics.platform);

    return results;
  }

  // Template operations
  async createTemplate(templateData: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(templateData).returning();
    return template;
  }

  async getTemplatesByOrg(orgId: string): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.orgId, orgId));
  }

  async getPublicTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.isPublic, true));
  }

  // A/B Test operations
  async getActiveABTests(orgId: string): Promise<ABTest[]> {
    return await db
      .select()
      .from(abTests)
      .innerJoin(campaigns, eq(abTests.campaignId, campaigns.id))
      .where(and(eq(campaigns.orgId, orgId), eq(abTests.status, "running")))
      .then(results => results.map(r => r.ab_tests));
  }

  // Analytics operations
  async getDashboardMetrics(orgId: string): Promise<any> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get daily posts count
    const dailyPosts = await db
      .select({ count: sql<number>`count(*)` })
      .from(calendarSlots)
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .where(and(
        eq(campaigns.orgId, orgId),
        gte(calendarSlots.scheduledAt, yesterday),
        lte(calendarSlots.scheduledAt, today)
      ));

    // Get engagement rate
    const engagement = await db
      .select({ avgEngagement: sql<number>`avg(${metrics.engagementRate})` })
      .from(metrics)
      .innerJoin(postJobs, eq(metrics.postJobId, postJobs.id))
      .innerJoin(calendarSlots, eq(postJobs.calendarSlotId, calendarSlots.id))
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .where(eq(campaigns.orgId, orgId));

    // Get active accounts count
    const activeAccounts = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts)
      .where(and(eq(accounts.orgId, orgId), eq(accounts.status, "active")));

    return {
      dailyPosts: dailyPosts[0]?.count || 0,
      engagementRate: engagement[0]?.avgEngagement || 0,
      marketFitScore: 87, // Placeholder for now
      activeAccounts: activeAccounts[0]?.count || 0,
    };
  }

  async getRecentActivity(orgId: string, limit: number = 10): Promise<any[]> {
    const activities = await db
      .select({
        id: postJobs.id,
        status: postJobs.status,
        platform: accounts.platform,
        handle: accounts.handle,
        tagline: calendarSlots.tagline,
        processedAt: postJobs.processedAt,
        error: postJobs.error,
      })
      .from(postJobs)
      .innerJoin(calendarSlots, eq(postJobs.calendarSlotId, calendarSlots.id))
      .innerJoin(accounts, eq(calendarSlots.accountId, accounts.id))
      .innerJoin(campaigns, eq(calendarSlots.campaignId, campaigns.id))
      .where(eq(campaigns.orgId, orgId))
      .orderBy(desc(postJobs.processedAt))
      .limit(limit);

    return activities;
  }

  // Draft operations
  async createDraft(draftData: InsertDraft): Promise<Draft> {
    const [draft] = await db.insert(drafts).values(draftData).returning();
    return draft;
  }

  async getDraftsByOrg(orgId: string): Promise<Draft[]> {
    return db.select().from(drafts).where(eq(drafts.orgId, orgId)).orderBy(desc(drafts.updatedAt));
  }

  async updateDraft(draftId: string, data: Partial<Draft>): Promise<Draft> {
    const [draft] = await db.update(drafts).set({ ...data, updatedAt: new Date() }).where(eq(drafts.id, draftId)).returning();
    return draft;
  }

  async deleteDraft(draftId: string): Promise<void> {
    await db.delete(drafts).where(eq(drafts.id, draftId));
  }
}

export const storage = new DatabaseStorage();

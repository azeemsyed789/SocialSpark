import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  generateContent, 
  analyzeSentiment, 
  generateWeeklySummary 
} from "./services/gemini";
import {
  schedulePost,
  scheduleHealthCheck,
  initializeQueue
} from "./services/queue";
import {
  getDashboardMetrics,
  getPlatformMetrics,
  calculateMarketFitScore,
  generateAIWeeklySummary,
  getABTestResults,
  getContentPerformanceAnalysis
} from "./services/analytics";
import { secureOauthRouter } from './routes/oauth-secure';
import { oauthRouter } from './routes/oauth';
import { 
  insertAccountSchema,
  insertCampaignSchema,
  insertCalendarSlotSchema,
  insertAssetSchema,
  insertTemplateSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize auth middleware
  await setupAuth(app);

  // Initialize job queues
  await initializeQueue();

  // Secure OAuth routes
  app.use('/api/oauth-secure', secureOauthRouter);

  // OAuth routes
  app.use('/api/oauth', oauthRouter);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's organization
      const organization = await storage.getOrganizationByUserId(userId);
      
      res.json({ ...user, organization });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orgData = { ...req.body, ownerId: userId };
      
      const organization = await storage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const metrics = await getDashboardMetrics(organization.id);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(organization.id, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Account management routes
  app.get('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('[DEBUG] /api/accounts userId:', userId);
      const organization = await storage.getOrganizationByUserId(userId);
      console.log('[DEBUG] /api/accounts organization:', organization);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const accounts = await storage.getAccountsByOrg(organization.id);
      console.log('[DEBUG] /api/accounts accounts:', accounts);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      let {
        platform,
        handle,
        status,
        tokensEncrypted,
        proxyId,
        lastHealthCheck,
        healthStatus,
        features
      } = req.body;
      const accountData: any = {
        orgId: organization.id,
        platform,
        handle,
        status: status === null ? undefined : status,
        tokensEncrypted: tokensEncrypted === null ? undefined : tokensEncrypted,
        proxyId: proxyId === null ? undefined : proxyId,
        lastHealthCheck: lastHealthCheck === null ? undefined : lastHealthCheck,
        healthStatus: healthStatus === null ? undefined : healthStatus,
        features: typeof features === 'string' ? features : undefined
      };
      const parsedAccountData = insertAccountSchema.parse(accountData);
      if (typeof parsedAccountData.features !== 'string') {
        delete parsedAccountData.features;
      }
      const account = await storage.createAccount(parsedAccountData);
      
      // Schedule health checks for the new account
      await scheduleHealthCheck(account.id);
      
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const campaigns = await storage.getCampaignsByOrg(organization.id);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        orgId: organization.id
      });
      
      const campaign = await storage.createCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Calendar routes
  app.get('/api/calendar/slots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const slots = await storage.getCalendarSlotsByOrg(organization.id, startDate, endDate);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching calendar slots:", error);
      res.status(500).json({ message: "Failed to fetch calendar slots" });
    }
  });

  app.post('/api/calendar/slots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const slotData = insertCalendarSlotSchema.parse(req.body);
      const slot = await storage.createCalendarSlot(slotData);
      
      // Create and schedule post job
      const postJobData = {
        calendarSlotId: slot.id,
        scheduledAt: slot.scheduledAt,
        status: "pending" as const,
      };
      
      await schedulePost(postJobData);
      
      res.json(slot);
    } catch (error) {
      console.error("Error creating calendar slot:", error);
      res.status(500).json({ message: "Failed to create calendar slot" });
    }
  });

  // Content generation routes (Studio)
  app.post('/api/studio/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { platform, contentType, tagline, includeHashtags, includeFOMO, tone } = req.body;
      
      const content = await generateContent({
        platform,
        contentType,
        tagline,
        includeHashtags,
        includeFOMO,
        tone,
      });
      
      res.json(content);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.post('/api/studio/sentiment', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const sentiment = await analyzeSentiment(text);
      res.json(sentiment);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({ message: "Failed to analyze sentiment" });
    }
  });

  // Asset management routes
  app.get('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const assets = await storage.getAssetsByOrg(organization.id);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post('/api/assets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const assetData = insertAssetSchema.parse({
        ...req.body,
        orgId: organization.id
      });
      
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  // Template routes
  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const [orgTemplates, publicTemplates] = await Promise.all([
        storage.getTemplatesByOrg(organization.id),
        storage.getPublicTemplates()
      ]);
      
      res.json([...orgTemplates, ...publicTemplates]);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const templateData = insertTemplateSchema.parse({
        ...req.body,
        orgId: organization.id
      });
      
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/overview', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const platformMetrics = await getPlatformMetrics(organization.id, days);
      res.json(platformMetrics);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get('/api/analytics/market-fit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const marketFit = await calculateMarketFitScore(organization.id);
      res.json(marketFit);
    } catch (error) {
      console.error("Error calculating market fit score:", error);
      res.status(500).json({ message: "Failed to calculate market fit score" });
    }
  });

  app.get('/api/analytics/weekly-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const summary = await generateAIWeeklySummary(organization.id);
      res.json({ summary });
    } catch (error) {
      console.error("Error generating weekly summary:", error);
      res.status(500).json({ message: "Failed to generate weekly summary" });
    }
  });

  app.get('/api/analytics/ab-tests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const abTests = await getABTestResults(organization.id);
      res.json(abTests);
    } catch (error) {
      console.error("Error fetching A/B test results:", error);
      res.status(500).json({ message: "Failed to fetch A/B test results" });
    }
  });

  app.get('/api/analytics/content-performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const analysis = await getContentPerformanceAnalysis(organization.id);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching content performance analysis:", error);
      res.status(500).json({ message: "Failed to fetch content performance analysis" });
    }
  });

  // Queue management routes
  app.get('/api/queue/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const jobs = await storage.getPostJobsByOrg(organization.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching queue jobs:", error);
      res.status(500).json({ message: "Failed to fetch queue jobs" });
    }
  });

  app.put('/api/queue/jobs/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Accept content and mediaUrls in the body
      const { scheduledAt, content, mediaUrls } = req.body;
      const updateData: any = {};
      if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
      if (typeof content === 'string') updateData.content = content;
      if (Array.isArray(mediaUrls)) updateData.mediaUrls = mediaUrls;
      await storage.updatePostJob(req.params.id, updateData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating queue job:", error);
      res.status(500).json({ message: "Failed to update queue job" });
    }
  });

  // Webhook routes (for external integrations)
  app.post('/api/webhooks/buffer', async (req, res) => {
    try {
      // Handle Buffer webhook for Instagram/LinkedIn posting results
      const { status, post_id, error } = req.body;
      
      // Find the corresponding post job and update status
      // This would require storing external provider IDs
      
      console.log("Buffer webhook received:", req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Buffer webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.post('/api/webhooks/make', async (req, res) => {
    try {
      // Handle Make.com webhook for various automation results
      console.log("Make.com webhook received:", req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing Make.com webhook:", error);
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Studio Drafts API
  app.get('/api/studio/drafts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      if (!organization) return res.status(404).json({ message: "Organization not found" });
      const drafts = await storage.getDraftsByOrg(organization.id);
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ message: "Failed to fetch drafts" });
    }
  });

  app.post('/api/studio/drafts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organization = await storage.getOrganizationByUserId(userId);
      if (!organization) return res.status(404).json({ message: "Organization not found" });
      const draftData = { ...req.body, orgId: organization.id, authorId: userId };
      const draft = await storage.createDraft(draftData);
      res.json(draft);
    } catch (error) {
      console.error("Error creating draft:", error);
      res.status(500).json({ message: "Failed to create draft" });
    }
  });

  app.put('/api/studio/drafts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const draft = await storage.updateDraft(req.params.id, req.body);
      res.json(draft);
    } catch (error) {
      console.error("Error updating draft:", error);
      res.status(500).json({ message: "Failed to update draft" });
    }
  });

  app.delete('/api/studio/drafts/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDraft(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting draft:", error);
      res.status(500).json({ message: "Failed to delete draft" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

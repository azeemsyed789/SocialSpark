import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { storage } from "../storage";
import { PostJob } from "@shared/schema";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Create job queues
export const postQueue = new Queue("postQueue", { connection: redis });
export const analyticsQueue = new Queue("analyticsQueue", { connection: redis });
export const healthCheckQueue = new Queue("healthCheckQueue", { connection: redis });

// Post processing worker
export const postWorker = new Worker(
  "postQueue",
  async (job: Job) => {
    const { postJobId } = job.data;
    
    try {
      await processPostJob(postJobId);
      console.log(`Successfully processed post job: ${postJobId}`);
    } catch (error) {
      console.error(`Failed to process post job ${postJobId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Analytics worker
export const analyticsWorker = new Worker(
  "analyticsQueue", 
  async (job: Job) => {
    const { postJobId } = job.data;
    
    try {
      await collectMetrics(postJobId);
      console.log(`Successfully collected metrics for: ${postJobId}`);
    } catch (error) {
      console.error(`Failed to collect metrics for ${postJobId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Health check worker
export const healthCheckWorker = new Worker(
  "healthCheckQueue",
  async (job: Job) => {
    const { accountId } = job.data;
    
    try {
      await checkAccountHealth(accountId);
      console.log(`Health check completed for account: ${accountId}`);
    } catch (error) {
      console.error(`Health check failed for account ${accountId}:`, error);
      throw error;
    }
  },
  { connection: redis }
);

// Job processing functions
async function processPostJob(postJobId: string): Promise<void> {
  // In a real implementation, this would:
  // 1. Get the post job details
  // 2. Get the associated calendar slot and account
  // 3. Use the appropriate platform API to publish content
  // 4. Update the job status based on success/failure
  
  try {
    await storage.updatePostJobStatus(postJobId, "processing");
    
    // Simulate posting to platform (replace with actual API calls)
    const success = await simulatePostToPlattform(postJobId);
    
    if (success) {
      await storage.updatePostJobStatus(postJobId, "completed");
      
      // Schedule metrics collection for later
      await analyticsQueue.add(
        "collectMetrics",
        { postJobId },
        { delay: 30 * 60 * 1000 } // Collect metrics after 30 minutes
      );
    } else {
      await storage.updatePostJobStatus(postJobId, "failed", "Platform API error");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await storage.updatePostJobStatus(postJobId, "failed", errorMessage);
    throw error;
  }
}

async function simulatePostToPlattform(postJobId: string): Promise<boolean> {
  // This is a placeholder for actual platform posting logic
  // In production, this would integrate with:
  // - TikTok API
  // - Instagram Basic Display API (via Buffer/Make)
  // - YouTube Data API
  // - Twitter API v2
  // - LinkedIn API
  // - Reddit API
  // - Discord Bot API
  
  // For now, simulate a 90% success rate
  return Math.random() > 0.1;
}

async function collectMetrics(postJobId: string): Promise<void> {
  // In a real implementation, this would:
  // 1. Get post details from the job
  // 2. Query platform APIs for engagement metrics
  // 3. Store metrics in the database
  
  try {
    // Simulate collecting metrics
    const metrics = {
      postJobId,
      platform: "tiktok" as const,
      impressions: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 20),
      saves: Math.floor(Math.random() * 30),
      watchTime: Math.floor(Math.random() * 3000),
      clickThroughRate: (Math.random() * 0.1).toString(),
      engagementRate: Math.random() * 0.15,
    };
    
    await storage.recordMetrics(metrics);
  } catch (error) {
    console.error("Failed to collect metrics:", error);
    throw error;
  }
}

async function checkAccountHealth(accountId: string): Promise<void> {
  // In a real implementation, this would:
  // 1. Test API connectivity
  // 2. Check rate limits
  // 3. Verify account status
  // 4. Update health status in database
  
  try {
    // Simulate health check
    const healthStatus = Math.random() > 0.8 ? "error" : Math.random() > 0.9 ? "caution" : "healthy";
    await storage.updateAccountHealth(accountId, healthStatus);
  } catch (error) {
    await storage.updateAccountHealth(accountId, "error");
    throw error;
  }
}

// Queue management functions
export async function schedulePost(postJobData: any): Promise<void> {
  const job = await storage.createPostJob(postJobData);
  
  await postQueue.add(
    "processPost",
    { postJobId: job.id },
    {
      delay: new Date(postJobData.scheduledAt).getTime() - Date.now(),
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );
}

export async function scheduleHealthCheck(accountId: string): Promise<void> {
  await healthCheckQueue.add(
    "healthCheck",
    { accountId },
    {
      repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
      attempts: 2,
    }
  );
}

// Initialize recurring jobs
export async function initializeQueue(): Promise<void> {
  console.log("Initializing job queues...");
  
  // Schedule regular health checks for all active accounts
  // This would typically be done on startup
  
  console.log("Job queues initialized successfully");
}

// Error handlers
postWorker.on("failed", (job, err) => {
  console.error(`Post job ${job?.id} failed:`, err);
});

analyticsWorker.on("failed", (job, err) => {
  console.error(`Analytics job ${job?.id} failed:`, err);
});

healthCheckWorker.on("failed", (job, err) => {
  console.error(`Health check job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Gracefully shutting down workers...");
  await postWorker.close();
  await analyticsWorker.close();
  await healthCheckWorker.close();
  await redis.quit();
  process.exit(0);
});

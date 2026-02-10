import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { 
  generateAuthUrl, 
  generateOAuthState, 
  validateOAuthState, 
  exchangeCodeForTokens, 
  getUserInfo, 
  encryptTokens,
  oauthConfigs,
  decryptTokens
} from '../services/oauth';
import { storage } from '../storage';
import { google } from "googleapis";

const router = Router();

// Add Google Calendar OAuth scopes for calendar integration
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly"
];

// Get available OAuth platforms
router.get('/platforms', isAuthenticated, (req, res) => {
  const platforms = Object.keys(oauthConfigs).map(platform => ({
    id: platform,
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    available: !!oauthConfigs[platform].clientId
  }));
  
  res.json(platforms);
});

// Initiate OAuth flow for a platform
router.get('/connect/:platform', isAuthenticated, async (req: any, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user && req.user.claims ? req.user.claims.sub : undefined;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });
    
    if (!oauthConfigs[platform]) {
      return res.status(400).json({ message: 'Unsupported platform' });
    }
    
    if (!oauthConfigs[platform].clientId) {
      return res.status(400).json({ 
        message: `${platform} OAuth is not configured. Please add the required environment variables.` 
      });
    }
    
    const state = generateOAuthState(platform, userId);
    const authUrl = generateAuthUrl(platform, state);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate OAuth flow' });
  }
});

// OAuth callback handler
router.get('/:platform/callback', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error } = req.query;
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=oauth_cancelled`);
    }
    
    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=missing_params`);
    }
    
    // Validate state to prevent CSRF attacks
    const stateData = validateOAuthState(state as string);
    if (!stateData || stateData.platform !== platform) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=invalid_state`);
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(platform, code as string);
    
    // Get user info from the platform
    const userInfo = await getUserInfo(platform, tokens.accessToken);
    
    // Get user's organization
    const organization = await storage.getOrganizationByUserId(stateData.userId);
    if (!organization) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=no_organization`);
    }
    
    // Check if account already exists
    const existingAccounts = await storage.getAccountsByOrg(organization.id);
    const existingAccount = existingAccounts.find(
      acc => acc.platform === platform && acc.handle === `@${userInfo.username}`
    );
    
    if (existingAccount) {
      // Update existing account with new tokens
      await storage.updateAccount(existingAccount.id, {
        tokensEncrypted: encryptTokens(tokens),
        status: 'active',
        healthStatus: 'healthy',
        lastHealthCheck: new Date(),
        features: existingAccount.features || '', // ensure features is always a string
      });
    } else {
      // Create new account
      await storage.createAccount({
        orgId: organization.id,
        platform: platform as any,
        handle: `@${userInfo.username}`,
        tokensEncrypted: encryptTokens(tokens),
        status: 'active',
        healthStatus: 'healthy',
        features: '', // ensure features is always a string
      });
    }
    
    // Redirect back to calendar page with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/calendar?success=connected&platform=${platform}&username=${userInfo.username}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=connection_failed`);
  }
});

// Disconnect/remove OAuth account
router.delete('/disconnect/:accountId', isAuthenticated, async (req: any, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.claims.sub;
    
    // Verify user owns this account
    const organization = await storage.getOrganizationByUserId(userId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    
    const accounts = await storage.getAccountsByOrg(organization.id);
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Remove the account
    await storage.deleteAccount(accountId);
    
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Account disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect account' });
  }
});

// Endpoint to fetch Google Calendar events for authenticated user
router.get("/calendar/events", isAuthenticated, async (req, res) => {
  const user = req.user as any;
  if (!user || !user.claims || !user.claims.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = user.claims.sub;
  const organization = await storage.getOrganizationByUserId(userId);
  if (!organization) {
    return res.status(404).json({ error: "Organization not found" });
  }
  const accounts = await storage.getAccountsByOrg(organization.id);
  const googleAccount = accounts.find(acc => acc.platform === "youtube"); // Google Calendar uses YouTube OAuth
  if (!googleAccount || !googleAccount.tokensEncrypted) {
    return res.status(401).json({ error: "Google account not connected" });
  }
  // Decrypt tokens here
  const tokens = decryptTokens(googleAccount.tokensEncrypted);
  const accessToken = tokens.accessToken;
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  try {
    const events = await calendar.events.list({
      calendarId: "primary",
      maxResults: 20,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: new Date().toISOString(),
    });
    res.json(events.data.items || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

export { router as oauthRouter };
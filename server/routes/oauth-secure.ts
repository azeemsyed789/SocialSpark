import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { 
  generateAuthUrl, 
  validateOAuthState, 
  exchangeCodeForTokens, 
  getUserInfo, 
  encryptTokens,
  getAvailablePlatforms 
} from '../services/oauth-secure';
import { storage } from '../storage';

export const secureOauthRouter = Router();

// Get available platforms (public endpoint)
secureOauthRouter.get('/platforms', async (req: any, res) => {
  try {
    const platforms = getAvailablePlatforms();
    res.json(platforms);
  } catch (error) {
    console.error('Error getting platforms:', error);
    res.status(500).json({ error: 'Failed to get platforms' });
  }
});

// Initiate OAuth flow
secureOauthRouter.get('/connect/:platform', isAuthenticated, async (req: any, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.claims.sub;
    
    const { authUrl, state } = generateAuthUrl(platform, userId);
    
    // Store state in session for additional security
    req.session.oauthState = state;
    
    res.json({ authUrl, state });
  } catch (error) {
    console.error(`Error initiating OAuth for ${req.params.platform}:`, error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'OAuth initiation failed' });
  }
});

// OAuth callback handler
secureOauthRouter.get('/callback/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error } = req.query;
    
    // Check for OAuth errors
    if (error) {
      console.error(`OAuth error for ${platform}:`, error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=oauth_cancelled`);
    }
    
    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=invalid_params`);
    }
    
    // Validate OAuth state
    const flowData = validateOAuthState(state as string);
    if (!flowData) {
      console.error(`Invalid OAuth state for ${platform}:`, state);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=invalid_state`);
    }
    
    // Exchange code for tokens using stored code verifier
    const tokens = await exchangeCodeForTokens(platform, code as string, flowData.codeVerifier);
    
    // Get user info
    const userInfo = await getUserInfo(platform, tokens.accessToken);
    
    // Encrypt and store tokens
    const encryptedTokens = encryptTokens(tokens);
    
    // Get or create organization for user
    const organization = await storage.getOrganizationByUserId(flowData.userId);
    if (!organization) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5000'}/accounts?error=no_organization`);
    }
    
    // Create account record
    const account = await storage.createAccount({
      platform: platform as 'youtube' | 'linkedin' | 'discord',
      handle: userInfo.username,
      orgId: organization.id,
      status: 'active',
      healthStatus: 'healthy',
      tokensEncrypted: encryptedTokens,
      platformUserId: userInfo.id,
      email: userInfo.email
    });
    
    console.log(`Successfully connected ${platform} account for user ${flowData.userId}: @${userInfo.username}`);
    
    // Redirect with success - using postMessage for popup communication
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    // Secure success response data (XSS-safe)
    const successData = {
      type: 'oauth_success',
      platform: platform,
      username: userInfo.username,
      accountId: account.id
    };
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Success</title>
        <meta http-equiv="Content-Security-Policy" content="script-src 'unsafe-inline'; object-src 'none';">
        <script>
          // Send success message to parent window (XSS-safe with JSON.stringify)
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(successData)}, ${JSON.stringify(frontendUrl)});
            window.close();
          } else {
            // Fallback redirect (safely encoded)
            window.location.href = ${JSON.stringify(`${frontendUrl}/accounts?success=connected`)};
          }
        </script>
      </head>
      <body>
        <h2>Account Connected Successfully!</h2>
        <p>Your account has been connected.</p>
        <p>This window will close automatically...</p>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = ${JSON.stringify(`${frontendUrl}/accounts`)};
            }
          }, 2000);
        </script>
      </body>
      </html>
    `;
    
    res.send(successHtml);
    
  } catch (error) {
    console.error(`OAuth callback error for ${req.params.platform}:`, error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    // Secure error response data (XSS-safe)
    const errorData = {
      type: 'oauth_error',
      platform: req.params.platform,
      error: 'connection_failed'
    };
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <meta http-equiv="Content-Security-Policy" content="script-src 'unsafe-inline'; object-src 'none';">
        <script>
          // Send error message to parent window (XSS-safe with JSON.stringify)
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(errorData)}, ${JSON.stringify(frontendUrl)});
            window.close();
          } else {
            // Fallback redirect (safely encoded)
            window.location.href = ${JSON.stringify(`${frontendUrl}/accounts?error=connection_failed`)};
          }
        </script>
      </head>
      <body>
        <h2>Connection Failed</h2>
        <p>Failed to connect your account.</p>
        <p>This window will close automatically...</p>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = ${JSON.stringify(`${frontendUrl}/accounts`)};
            }
          }, 2000);
        </script>
      </body>
      </html>
    `;
    
    res.send(errorHtml);
  }
});

// Disconnect account
secureOauthRouter.delete('/disconnect/:accountId', isAuthenticated, async (req: any, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.claims.sub;
    
    // Get user's organization first
    const organization = await storage.getOrganizationByUserId(userId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Find account in user's organization
    const accounts = await storage.getAccountsByOrg(organization.id);
    const account = accounts.find((acc: any) => acc.id === accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // TODO: Revoke tokens with platform APIs before deletion
    // This is a minor improvement for later
    
    await storage.deleteAccount(accountId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// Get account status
secureOauthRouter.get('/status/:accountId', isAuthenticated, async (req: any, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.claims.sub;
    
    // Get user's organization first
    const organization = await storage.getOrganizationByUserId(userId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Find account in user's organization
    const accounts = await storage.getAccountsByOrg(organization.id);
    const account = accounts.find((acc: any) => acc.id === accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({
      platform: account.platform,
      handle: account.handle,
      status: account.status,
      healthStatus: account.healthStatus,
      lastHealthCheck: account.lastHealthCheck
    });
  } catch (error) {
    console.error('Error getting account status:', error);
    res.status(500).json({ error: 'Failed to get account status' });
  }
});
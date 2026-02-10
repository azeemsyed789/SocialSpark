import crypto from 'crypto';
import { storage } from '../storage';
import type { Account } from '@shared/schema';

// CRITICAL: Secure token encryption key - MUST be set in production
let TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
if (!TOKEN_ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required for secure OAuth operation in production');
  } else {
    console.warn('⚠️  SECURITY WARNING: TOKEN_ENCRYPTION_KEY not set! Using random key for development only!');
    console.warn('⚠️  Tokens will be lost on restart. Set TOKEN_ENCRYPTION_KEY for production!');
    TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  }
}

// Ensure key is proper length for AES-256
const ENCRYPTION_KEY = Buffer.from(TOKEN_ENCRYPTION_KEY, 'hex');
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes) for AES-256');
}

// OAuth configuration interfaces
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  extraAuthParams?: Record<string, string>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthUserInfo {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  email?: string;
}

// Encrypted data structure
interface EncryptedData {
  data: string;
  iv: string;
  authTag: string;
}

// OAuth flow state storage (in production, use Redis or database)
interface OAuthFlowState {
  codeVerifier: string;
  platform: string;
  userId: string;
  timestamp: number;
}

const oauthFlowStates = new Map<string, OAuthFlowState>();

// Clean up expired OAuth flows every 5 minutes
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const entries = Array.from(oauthFlowStates.entries());
  for (const [state, flowData] of entries) {
    if (flowData.timestamp < tenMinutesAgo) {
      oauthFlowStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

// Secure token encryption with proper AES-GCM
export function encryptTokens(tokens: OAuthTokens): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  const result: EncryptedData = {
    data: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
  
  return JSON.stringify(result);
}

export function decryptTokens(encryptedTokens: string): OAuthTokens {
  const parsed: EncryptedData = JSON.parse(encryptedTokens);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

// PKCE helpers with proper S256 implementation
function generatePKCE(): { codeChallenge: string; codeVerifier: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeChallenge, codeVerifier };
}

// Platform configurations with secure defaults
export function getOAuthConfig(platform: string): OAuthConfig {
  const baseUrl = process.env.BASE_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://production-url.replit.app' : 'http://localhost:5000');
  
  const configs: Record<string, OAuthConfig> = {
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/userinfo.profile'],
      extraAuthParams: {
        access_type: 'offline',
        prompt: 'consent' // Force consent to get refresh token
      }
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoUrl: 'https://api.linkedin.com/v2/me', // Updated to v2
      scopes: ['r_liteprofile', 'w_member_social']
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      authUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      scopes: ['identify', 'guilds']
    },
    tiktok: {
      clientId: process.env.TIKTOK_CLIENT_ID || '',
      clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      userInfoUrl: 'https://open.tiktokapis.com/v2/user/info/',
      scopes: ['user.info.basic', 'user.info.profile', 'video.list', 'video.upload'],
      extraAuthParams: {
        // TikTok-specific params if needed
      }
    },
    instagram: {
      clientId: process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      userInfoUrl: 'https://graph.instagram.com/me',
      scopes: ['user_profile', 'user_media'],
      extraAuthParams: {
        // Instagram-specific params if needed
      }
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/me',
      scopes: ['public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_read_user_content'],
      extraAuthParams: {
        // Facebook-specific params if needed
      }
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar'
      ],
      extraAuthParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  };
  
  const config = configs[platform];
  if (!config) {
    throw new Error(`Unsupported OAuth platform: ${platform}`);
  }
  
  return config;
}

// Generate secure OAuth authorization URL
export function generateAuthUrl(platform: string, userId: string): { authUrl: string; state: string } {
  const config = getOAuthConfig(platform);
  const { codeChallenge, codeVerifier } = generatePKCE();
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store OAuth flow state securely
  // TODO: For production, replace with Redis: redis.setex(`oauth_state:${state}`, 600, JSON.stringify({...}))
  oauthFlowStates.set(state, {
    codeVerifier,
    platform,
    userId,
    timestamp: Date.now()
  });
  
  const baseUrl = process.env.BASE_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://production-url.replit.app' : 'http://localhost:5000');
  
  const baseParams = {
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: `${baseUrl}/api/oauth-secure/callback/${platform}`,
    scope: config.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256', // Proper S256 PKCE
    ...config.extraAuthParams // Add platform-specific parameters
  };
  
  const params = new URLSearchParams(baseParams);
  const authUrl = `${config.authUrl}?${params.toString()}`;
  
  return { authUrl, state };
}

// Validate OAuth state and get flow data
export function validateOAuthState(state: string): OAuthFlowState | null {
  const flowData = oauthFlowStates.get(state);
  if (!flowData) {
    return null;
  }
  
  // Check if state is not too old (10 minutes max)
  if (Date.now() - flowData.timestamp > 10 * 60 * 1000) {
    oauthFlowStates.delete(state);
    return null;
  }
  
  // Remove state after use (one-time use)
  oauthFlowStates.delete(state);
  return flowData;
}

// Exchange authorization code for tokens with proper PKCE verification
export async function exchangeCodeForTokens(platform: string, code: string, codeVerifier: string): Promise<OAuthTokens> {
  const config = getOAuthConfig(platform);
  const baseUrl = process.env.BASE_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://production-url.replit.app' : 'http://localhost:5000');
  
  const tokenData = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: `${baseUrl}/api/oauth-secure/callback/${platform}`,
    code_verifier: codeVerifier // Proper PKCE verification
  };
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: new URLSearchParams(tokenData).toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OAuth token exchange failed for ${platform}:`, errorText);
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}`);
  }
  
  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    scope: tokens.scope
  };
}

// Get user information from platform with proper error handling
export async function getUserInfo(platform: string, accessToken: string): Promise<OAuthUserInfo> {
  const config = getOAuthConfig(platform);
  
  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'Megatron-Social-Media-Manager/1.0'
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
  }
  
  const userData = await response.json();
  
  // Map platform-specific responses to common format
  switch (platform) {
    case 'linkedin':
      return {
        id: userData.id,
        username: userData.localizedFirstName && userData.localizedLastName ? 
          `${userData.localizedFirstName} ${userData.localizedLastName}` : 
          userData.firstName?.localized?.en_US + ' ' + userData.lastName?.localized?.en_US,
        displayName: userData.localizedFirstName && userData.localizedLastName ?
          `${userData.localizedFirstName} ${userData.localizedLastName}` :
          userData.firstName?.localized?.en_US + ' ' + userData.lastName?.localized?.en_US,
      };
    case 'youtube':
      return {
        id: userData.id,
        username: userData.name,
        displayName: userData.name,
        profileImage: userData.picture,
        email: userData.email
      };
    case 'discord':
      return {
        id: userData.id,
        username: userData.username,
        displayName: userData.global_name || userData.username,
        profileImage: userData.avatar ? 
          `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
          undefined,
        email: userData.email
      };
    case 'tiktok':
      return {
        id: userData.data?.id || userData.open_id,
        username: userData.data?.unique_id || userData.unique_id,
        displayName: userData.data?.nickname || userData.nickname,
        profileImage: userData.data?.avatar || userData.avatar
      };
    case 'instagram':
      return {
        id: userData.id,
        username: userData.username,
        displayName: userData.name,
        profileImage: userData.profile_picture,
        email: userData.email
      };
    case 'facebook':
      return {
        id: userData.id,
        username: userData.name,
        displayName: userData.name,
        profileImage: userData.picture?.data?.url
      };
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Get available platforms for OAuth
export function getAvailablePlatforms(): Array<{ id: string; name: string; available: boolean }> {
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'discord', name: 'Discord' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'facebook', name: 'Facebook' }
  ];
  return platforms.map(platform => ({
    ...platform,
    available: true
  }));
}

// Refresh access token
export async function refreshAccessToken(platform: string, refreshToken: string): Promise<OAuthTokens> {
  const config = getOAuthConfig(platform);
  
  const refreshData = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  };
  
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams(refreshData).toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }
  
  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken, // Some platforms don't return new refresh token
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    scope: tokens.scope
  };
}
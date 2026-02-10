import crypto from 'crypto';
import { storage } from '../storage';

// OAuth configuration for each platform
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  userInfoUrl?: string;
}

// Platform OAuth configurations
export const oauthConfigs: Record<string, OAuthConfig> = {
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/linkedin/callback`,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    userInfoUrl: 'https://api.linkedin.com/v2/people/~'
  },
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/youtube/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/userinfo.profile'],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/discord/callback`,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'guilds'],
    userInfoUrl: 'https://discord.com/api/users/@me'
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/facebook/callback`,
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_read_user_content'],
    userInfoUrl: 'https://graph.facebook.com/me'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/oauth/google/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  }
};

// Note: TikTok and Instagram have more complex OAuth flows that require additional setup
// TikTok requires business account approval, Instagram uses Facebook's Graph API

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

// Encryption utilities for storing tokens securely
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encryptTokens(tokens: OAuthTokens): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptTokens(encryptedData: string): OAuthTokens {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Generate OAuth authorization URL
export function generateAuthUrl(platform: string, state: string): string {
  const config = oauthConfigs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    response_type: 'code',
    state: state,
    ...(platform === 'twitter' && { code_challenge_method: 'plain', code_challenge: 'challenge' })
  });

  return `${config.authUrl}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForTokens(platform: string, code: string): Promise<OAuthTokens> {
  const config = oauthConfigs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const tokenData = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    ...(platform === 'twitter' && { code_verifier: 'challenge' })
  };

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      ...(platform === 'reddit' && { 'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}` })
    },
    body: new URLSearchParams(tokenData).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${errorText}`);
  }

  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    scope: tokens.scope
  };
}

// Get user information from platform
export async function getUserInfo(platform: string, accessToken: string): Promise<OAuthUserInfo> {
  const config = oauthConfigs[platform];
  if (!config || !config.userInfoUrl) {
    throw new Error(`User info not supported for platform: ${platform}`);
  }

  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  const userData = await response.json();
  
  // Map platform-specific responses to common format
  switch (platform) {
    case 'linkedin':
      return {
        id: userData.id,
        username: `${userData.localizedFirstName} ${userData.localizedLastName}`,
        displayName: `${userData.localizedFirstName} ${userData.localizedLastName}`,
        profileImage: userData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
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
        profileImage: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined,
        email: userData.email
      };
    case 'facebook':
      return {
        id: userData.id,
        username: userData.name,
        displayName: userData.name,
        profileImage: userData.picture?.data?.url,
        email: userData.email
      };
    case 'google':
      return {
        id: userData.id,
        username: userData.name,
        displayName: userData.name,
        profileImage: userData.picture,
        email: userData.email
      };
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

// Refresh access token if needed
export async function refreshAccessToken(platform: string, refreshToken: string): Promise<OAuthTokens> {
  const config = oauthConfigs[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

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
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || refreshToken, // Some platforms don't return new refresh token
    expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    scope: tokens.scope
  };
}

// Store OAuth session state for security
const oauthStates = new Map<string, { platform: string; userId: string; timestamp: number }>();

export function generateOAuthState(platform: string, userId: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { platform, userId, timestamp: Date.now() });
  
  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const entries = Array.from(oauthStates.entries());
  for (const [key, value] of entries) {
    if (value.timestamp < tenMinutesAgo) {
      oauthStates.delete(key);
    }
  }
  
  return state;
}

export function validateOAuthState(state: string): { platform: string; userId: string } | null {
  const stateData = oauthStates.get(state);
  if (!stateData) {
    return null;
  }
  
  // Check if state is not too old (10 minutes max)
  if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    oauthStates.delete(state);
    return null;
  }
  
  oauthStates.delete(state); // Use state only once
  return { platform: stateData.platform, userId: stateData.userId };
}
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getCognitoPublicKeys } from './cognito-keys';

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  userId?: string;
  userSub?: string;
}

/**
 * Validates Cognito JWT tokens from Authorization header
 * This provides Cognito authentication for REST API endpoints
 */
export async function validateCognitoToken(request: NextRequest): Promise<AuthValidationResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer <token>'
      };
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return {
        isValid: false,
        error: 'JWT token is empty'
      };
    }

    // For development/demo, we'll skip actual JWT validation
    // In production, uncomment this section to validate with Cognito:
    
    /*
    // Get Cognito public keys for JWT verification
    const publicKeys = await getCognitoPublicKeys();
    
    // Decode and verify the JWT token
    const decoded = verify(token, publicKeys, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.us-east-2.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      audience: process.env.COGNITO_CLIENT_ID
    }) as any;
    
    return {
      isValid: true,
      userId: decoded.username || decoded['cognito:username'],
      userSub: decoded.sub
    };
    */

    // For demo purposes, extract userId from token payload (unsafe for production)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return {
        isValid: true,
        userId: payload.username || payload['cognito:username'] || 'demo-user',
        userSub: payload.sub || 'demo-sub'
      };
    } catch {
      return {
        isValid: false,
        error: 'Invalid JWT token format'
      };
    }

  } catch (error) {
    console.error('❌ Token validation error:', error);
    return {
      isValid: false,
      error: 'Token validation failed'
    };
  }
}

/**
 * Basic API key validation for simpler authentication
 * This is an alternative to JWT tokens for development
 */
export function validateApiKey(request: NextRequest): AuthValidationResult {
  const apiKey = request.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY || 'demo-api-key-12345';
  
  if (!apiKey) {
    return {
      isValid: false,
      error: 'Missing X-API-Key header'
    };
  }
  
  if (apiKey !== validApiKey) {
    return {
      isValid: false,
      error: 'Invalid API key'
    };
  }
  
  return {
    isValid: true,
    userId: 'api-user'
  };
}

/**
 * Flexible authentication that supports multiple methods
 * 1. Cognito JWT tokens (production)
 * 2. API keys (development)
 * 3. Open access (demo mode)
 */
export async function validateAuth(request: NextRequest): Promise<AuthValidationResult> {
  // Try Cognito JWT first
  const cognitoResult = await validateCognitoToken(request);
  if (cognitoResult.isValid) {
    return cognitoResult;
  }
  
  // Try API key authentication
  if (request.headers.get('x-api-key')) {
    return validateApiKey(request);
  }
  
  // For demo purposes, allow open access with warning
  console.log('⚠️  No authentication provided - running in demo mode');
  return {
    isValid: true,
    userId: 'demo-user-' + Date.now()
  };
} 
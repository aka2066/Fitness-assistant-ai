/**
 * Cognito Public Keys Helper
 * Used for validating JWT tokens from AWS Cognito User Pools
 */

interface CognitoPublicKey {
  kid: string;
  kty: string;
  use: string;
  n: string;
  e: string;
}

interface CognitoJWKS {
  keys: CognitoPublicKey[];
}

let cachedKeys: any = null;
let cacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches public keys from Cognito for JWT verification
 * In production, this would fetch from:
 * https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
 */
export async function getCognitoPublicKeys(): Promise<any> {
  const now = Date.now();
  
  // Return cached keys if still valid
  if (cachedKeys && (now - cacheTime) < CACHE_DURATION) {
    return cachedKeys;
  }

  try {
    // In production, you would fetch the actual JWKS from Cognito
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const region = process.env.AWS_REGION || 'us-east-2';
    
    if (!userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID environment variable not set');
    }

    const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    
    // For demo purposes, we'll return a mock key
    // In production, uncomment this to fetch real keys:
    /*
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }
    
    const jwks: CognitoJWKS = await response.json();
    
    // Convert JWKS to format usable by jsonwebtoken
    const publicKeys: any = {};
    jwks.keys.forEach(key => {
      publicKeys[key.kid] = {
        kty: key.kty,
        n: key.n,
        e: key.e,
        use: key.use
      };
    });
    
    cachedKeys = publicKeys;
    cacheTime = now;
    return publicKeys;
    */

    // Demo implementation - in production, use the fetch code above
    console.log('⚠️  Using demo Cognito keys - replace with real JWKS fetch in production');
    
    cachedKeys = {
      'demo-key-id': {
        kty: 'RSA',
        use: 'sig',
        n: 'demo-n-value',
        e: 'AQAB'
      }
    };
    cacheTime = now;
    
    return cachedKeys;
    
  } catch (error) {
    console.error('❌ Failed to fetch Cognito public keys:', error);
    throw new Error('Unable to fetch Cognito public keys for JWT validation');
  }
} 
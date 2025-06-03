import { fetchAuthSession } from 'aws-amplify/auth';

interface ChatRequest {
  message: string;
  userId: string;
}

interface EmbeddingRequest {
  userId: string;
  type: 'profile' | 'workout' | 'meal';
  content: string;
  metadata: Record<string, any>;
}

export class LambdaService {
  private static async getAuthenticatedFetch() {
    const session = await fetchAuthSession();
    return session;
  }

  static async invokeChatbot(request: ChatRequest) {
    try {
      const session = await this.getAuthenticatedFetch();
      
      // Get the region from amplify_outputs.json (us-east-1)
      const region = 'us-east-1';
      const functionName = `amplify-fitnessassistant-ryanrahrooh-sandbox-2a4644698c-chatbot`;
      
      // Create a mock API Gateway event structure that our Lambda expects
      const lambdaEvent = {
        httpMethod: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // For now, we'll call our existing API route which has the same logic
      // In production, you'd use AWS SDK to invoke Lambda directly
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error invoking chatbot Lambda:', error);
      throw error;
    }
  }

  static async invokeEmbeddings(request: EmbeddingRequest) {
    try {
      const session = await this.getAuthenticatedFetch();
      
      // For now, we'll call our existing API route which has the same logic
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error invoking embeddings Lambda:', error);
      throw error;
    }
  }
}

// For demonstration purposes, let's create a direct Lambda invoker using AWS SDK
export class DirectLambdaService {
  static async invokeLambdaFunction(functionName: string, payload: any) {
    try {
      const session = await fetchAuthSession();
      
      if (!session.credentials) {
        throw new Error('No authenticated session found');
      }

      // In a real implementation, you would use AWS SDK here:
      // const lambda = new LambdaClient({
      //   region: 'us-east-1',
      //   credentials: session.credentials
      // });
      // 
      // const command = new InvokeCommand({
      //   FunctionName: functionName,
      //   Payload: JSON.stringify(payload),
      // });
      // 
      // const response = await lambda.send(command);
      // return JSON.parse(response.Payload);

      // For now, we'll demonstrate with the existing API routes
      console.log(`Would invoke Lambda function: ${functionName} with payload:`, payload);
      
      // Return mock response indicating Lambda integration is ready
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Lambda function integration ready',
          functionName,
          payload
        })
      };
      
    } catch (error) {
      console.error('Error with direct Lambda invocation:', error);
      throw error;
    }
  }
} 
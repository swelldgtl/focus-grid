import { Handler } from '@netlify/functions';
import { getClientConfig } from '../../client/lib/database';

export const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get client ID from query params or environment
    const clientId = event.queryStringParameters?.clientId || process.env.CLIENT_ID;
    
    if (!clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Client ID is required'
        }),
      };
    }

    const config = await getClientConfig(clientId);
    
    if (!config) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Client not found'
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(config),
    };

  } catch (error) {
    console.error('Config API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

import { Handler } from '@netlify/functions';
import { testConnection, getClients, createClient, AVAILABLE_FEATURES } from '../../client/lib/database';

export const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Test basic database connection
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Database connection failed',
          details: connectionTest.error
        }),
      };
    }

    // If GET request, return database info and existing clients
    if (event.httpMethod === 'GET') {
      const clients = await getClients();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Database connection successful',
          connectionTime: connectionTest.data?.[0]?.current_time,
          clientsCount: clients.length,
          clients: clients,
          availableFeatures: Object.values(AVAILABLE_FEATURES),
        }),
      };
    }

    // If POST request, create a demo client (for testing)
    if (event.httpMethod === 'POST') {
      const { name, slug } = JSON.parse(event.body || '{}');
      
      if (!name || !slug) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Name and slug are required'
          }),
        };
      }

      const client = await createClient({ name, slug });
      
      if (!client) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to create client'
          }),
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Client created successfully',
          client: client
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed'
      }),
    };

  } catch (error) {
    console.error('Database test error:', error);
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

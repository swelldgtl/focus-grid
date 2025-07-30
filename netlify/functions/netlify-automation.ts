import { Handler } from "@netlify/functions";
import { NetlifyAPI } from "netlify";

// Initialize Netlify API client
const netlify = new NetlifyAPI(process.env.NETLIFY_ACCESS_TOKEN!);

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Verify token is available
  if (!process.env.NETLIFY_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Netlify access token not configured" }),
    };
  }

  try {
    const { action, ...data } = JSON.parse(event.body || "{}");

    switch (action) {
      case "create-project":
        return await createNetlifyProject(data);
      case "set-env-vars":
        return await setEnvironmentVariables(data);
      case "deploy":
        return await deployProject(data);
      case "delete-project":
        return await deleteNetlifyProject(data);
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid action" }),
        };
    }
  } catch (error) {
    console.error("Netlify automation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

async function createNetlifyProject(data: {
  clientId: string;
  clientName: string;
  subdomain: string;
  databaseUrl: string;
}) {
  try {
    console.log("Creating Netlify site for:", data.subdomain);

    // Create the site
    const site = await netlify.createSite({
      body: {
        name: data.subdomain,
        custom_domain: `${data.subdomain}.swellfocusgrid.com`,
      },
    });

    console.log("Created site:", site.id, site.url);

    // Get the account ID from the site info
    const accountId = site.account_slug;

    // Set environment variables using the correct API method
    const envVars = {
      CLIENT_ID: data.clientId,
      DATABASE_URL: data.databaseUrl,
      NEXT_PUBLIC_CLIENT_NAME: data.clientName,
      NEXT_PUBLIC_CLIENT_SUBDOMAIN: data.subdomain,
    };

    // Set each environment variable
    for (const [key, value] of Object.entries(envVars)) {
      try {
        await netlify.createOrUpdateVariable({
          accountId: accountId,
          siteId: site.id,
          key: key,
          value: value,
        });
        console.log(`Set environment variable ${key} for site ${site.id}`);
      } catch (envError) {
        console.warn(`Failed to set environment variable ${key}:`, envError);
        // Continue with other variables even if one fails
      }
    }

    console.log("Environment variables set for site:", site.id);

    // Trigger a deployment
    try {
      await netlify.createSiteBuild({
        siteId: site.id,
      });
      console.log("Deployment triggered for site:", site.id);
    } catch (deployError) {
      console.warn("Site created but deployment failed:", deployError);
      // Continue - the site is created even if deployment fails
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        projectId: site.id,
        siteId: site.id,
        primaryUrl: `https://${data.subdomain}.swellfocusgrid.com`,
        branchUrl: site.url,
      }),
    };
  } catch (error) {
    console.error("Error creating Netlify site:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create project",
      }),
    };
  }
}

async function setEnvironmentVariables(data: {
  siteId: string;
  variables: Record<string, string>;
}) {
  try {
    console.log("Setting environment variables for site:", data.siteId);

    // Get site info to get account ID
    const site = await netlify.getSite({ siteId: data.siteId });
    const accountId = site.account_slug;

    // Set each environment variable
    for (const [key, value] of Object.entries(data.variables)) {
      await netlify.createOrUpdateVariable({
        accountId: accountId,
        siteId: data.siteId,
        key: key,
        value: value,
      });
    }

    console.log("Environment variables updated for site:", data.siteId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error setting environment variables:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to set environment variables",
      }),
    };
  }
}

async function deployProject(data: { siteId: string }) {
  try {
    console.log("Deploying project:", data.siteId);

    // Trigger a new build/deployment
    await netlify.createSiteBuild({
      siteId: data.siteId,
    });

    console.log("Deployment triggered for site:", data.siteId);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error deploying project:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to deploy project",
      }),
    };
  }
}

async function deleteNetlifyProject(data: { subdomain: string }) {
  try {
    console.log("Deleting Netlify project for subdomain:", data.subdomain);

    // Find the site by name/subdomain
    const sites = await netlify.listSites();
    const siteToDelete = sites.find(
      (site) =>
        site.name === data.subdomain ||
        site.custom_domain === `${data.subdomain}.swellfocusgrid.com`,
    );

    if (!siteToDelete) {
      console.warn("Site not found for subdomain:", data.subdomain);
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "Site not found",
        }),
      };
    }

    // Delete the site
    await netlify.deleteSite({ siteId: siteToDelete.id });
    console.log("Deleted site:", siteToDelete.id);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Error deleting Netlify project:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete Netlify project",
      }),
    };
  }
}

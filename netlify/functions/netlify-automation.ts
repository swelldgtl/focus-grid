import { Handler } from "@netlify/functions";

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
      case "check-domain":
        return await checkDomainAvailability(data);
      case "test-env":
        return await testEnvironmentVariables();
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

    // Step 1: Create basic site with minimal configuration
    const createSiteResponse = await fetch(
      "https://api.netlify.com/api/v1/sites",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          name: data.subdomain,
        }),
      },
    );

    if (!createSiteResponse.ok) {
      const errorText = await createSiteResponse.text();

      // Handle rate limiting specifically
      if (createSiteResponse.status === 429) {
        throw new Error(
          "Netlify API rate limit exceeded. Please wait a few minutes before creating another client.",
        );
      }

      throw new Error(
        `Failed to create site: ${createSiteResponse.status} ${errorText}`,
      );
    }

    const site = await createSiteResponse.json();
    console.log("Created basic site:", site.id, site.url);

    // Step 2: Set environment variables
    const envVars = {
      CLIENT_ID: data.clientId,
      DATABASE_URL: data.databaseUrl,
      NEXT_PUBLIC_CLIENT_NAME: data.clientName,
      NEXT_PUBLIC_CLIENT_SUBDOMAIN: data.subdomain,
    };

    console.log("Setting environment variables...");
    for (const [key, value] of Object.entries(envVars)) {
      try {
        const envResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${site.id}/env/${key}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              key: key,
              values: [{ value: value, context: "all" }],
            }),
          },
        );

        if (envResponse.ok) {
          console.log(`✅ Set environment variable: ${key}`);
        }
      } catch (envError) {
        console.warn(`Error setting environment variable ${key}:`, envError);
      }
    }

    // Step 3: Set custom domain
    try {
      const customDomain = `${data.subdomain}.swellfocusgrid.com`;
      const domainResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            custom_domain: customDomain,
            force_ssl: true,
          }),
        },
      );

      if (domainResponse.ok) {
        console.log(`✅ Custom domain set: ${customDomain}`);
      }
    } catch (domainError) {
      console.warn("Custom domain setup failed:", domainError);
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        projectId: site.id,
        siteId: site.id,
        primaryUrl: `https://${data.subdomain}.swellfocusgrid.com`,
        branchUrl: site.url,
        needsDeployment: true,
        message:
          "Site created successfully. Click 'Deploy' to connect repository and start deployment.",
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

    for (const [key, value] of Object.entries(data.variables)) {
      const envResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${data.siteId}/env/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            key: key,
            values: [{ value: value, context: "all" }],
          }),
        },
      );

      if (!envResponse.ok) {
        const errorText = await envResponse.text();
        console.warn(`Failed to set environment variable ${key}: ${errorText}`);
      }
    }

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
    console.log("Setting up deployment for site:", data.siteId);

    // Step 1: Configure GitHub repository connection
    console.log("Connecting GitHub repository...");
    const repoUpdateResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${data.siteId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          repo: {
            provider: "github",
            repo: `https://github.com/${process.env.GITHUB_REPO || "swelldgtl/focus-grid"}.git`,
            branch: "main",
            private: false,
          },
          build_settings: {
            cmd: "npm run build:client",
            publish_dir: "dist/spa",
          },
        }),
      },
    );

    if (!repoUpdateResponse.ok) {
      const repoError = await repoUpdateResponse.text();
      throw new Error(`Repository connection failed: ${repoError}`);
    }

    console.log("✅ Repository connected successfully");

    // Step 2: Trigger deployment
    console.log("Triggering deployment...");
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${data.siteId}/builds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          clear_cache: true,
        }),
      },
    );

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      throw new Error(`Deploy failed: ${deployResponse.status} ${errorText}`);
    }

    const deployResult = await deployResponse.json();
    console.log("✅ Deployment triggered:", deployResult.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deployId: deployResult.id,
        message: "Repository connected and deployment started successfully.",
      }),
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

async function testEnvironmentVariables() {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        hasNetlifyToken: !!process.env.NETLIFY_ACCESS_TOKEN,
        tokenLength: process.env.NETLIFY_ACCESS_TOKEN?.length || 0,
        hasGithubRepo: !!process.env.GITHUB_REPO,
        githubRepo: process.env.GITHUB_REPO,
        nodeEnv: process.env.NODE_ENV,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

async function checkDomainAvailability(data: { subdomain: string }) {
  try {
    console.log("Testing subdomain availability:", data.subdomain);

    const testSiteResponse = await fetch(
      "https://api.netlify.com/api/v1/sites",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          name: data.subdomain,
        }),
      },
    );

    if (testSiteResponse.ok) {
      const createdSite = await testSiteResponse.json();

      // Delete the test site immediately
      const deleteResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${createdSite.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
        },
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          available: true,
          subdomain: data.subdomain,
        }),
      };
    } else {
      const errorText = await testSiteResponse.text();
      const isUniquenessError =
        testSiteResponse.status === 422 && errorText.includes("must be unique");

      if (isUniquenessError) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            available: false,
            subdomain: data.subdomain,
            reason: "Name already taken",
          }),
        };
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({
            available: null,
            error: `Unable to test domain availability: ${errorText}`,
          }),
        };
      }
    }
  } catch (error) {
    console.error("Error testing domain availability:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        available: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

async function deleteNetlifyProject(data: { subdomain: string }) {
  try {
    console.log("Deleting Netlify project for subdomain:", data.subdomain);

    const listResponse = await fetch("https://api.netlify.com/api/v1/sites", {
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list sites: ${listResponse.status}`);
    }

    const sites = await listResponse.json();
    const siteToDelete = sites.find((site: any) => {
      const targetDomain = `${data.subdomain}.swellfocusgrid.com`;
      return (
        site.name === data.subdomain ||
        site.custom_domain === targetDomain ||
        site.url?.includes(data.subdomain)
      );
    });

    if (!siteToDelete) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "Site not found",
        }),
      };
    }

    const deleteResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteToDelete.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
      },
    );

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Delete failed: ${deleteResponse.status} ${errorText}`);
    }

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

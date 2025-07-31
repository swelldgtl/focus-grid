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

  // Debug environment variables (in production)
  console.log("Environment check:", {
    hasNetlifyToken: !!process.env.NETLIFY_ACCESS_TOKEN,
    hasGithubRepo: !!process.env.GITHUB_REPO,
    githubRepo: process.env.GITHUB_REPO,
  });

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
      case "setup-deployment":
        return await setupDeployment(data);
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

    // Create the site using REST API
    // Use the exact subdomain as the site name - no fallbacks
    const friendlySiteName = data.subdomain;

    console.log(`Creating site with exact name: ${friendlySiteName}`);

    // Create site without repo connection first to avoid authentication issues
    const createSiteResponse = await fetch(
      "https://api.netlify.com/api/v1/sites",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          name: friendlySiteName,
          // Don't connect repo during creation to avoid auth issues
        }),
      },
    );

    if (!createSiteResponse.ok) {
      const errorText = await createSiteResponse.text();
      throw new Error(
        `Failed to create site: ${createSiteResponse.status} ${errorText}`,
      );
    }

    const site = await createSiteResponse.json();
    console.log("Created site:", site.id, site.url);

    // Set custom domain after site creation using the correct API
    try {
      const customDomain = `${data.subdomain}.swellfocusgrid.com`;

      // Update site settings to include custom domain
      const updateSiteResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            custom_domain: customDomain,
            force_ssl: true, // Enable HTTPS
          }),
        },
      );

      if (updateSiteResponse.ok) {
        console.log(`Added custom domain: ${customDomain} with HTTPS`);
      } else {
        const domainError = await updateSiteResponse.text();
        console.warn(`Failed to set custom domain: ${domainError}`);
      }
    } catch (domainError) {
      console.warn("Custom domain setup failed:", domainError);
      // Continue - site creation succeeded even if custom domain failed
    }

    // Set environment variables using REST API
    const envVars = {
      CLIENT_ID: data.clientId,
      DATABASE_URL: data.databaseUrl,
      NEXT_PUBLIC_CLIENT_NAME: data.clientName,
      NEXT_PUBLIC_CLIENT_SUBDOMAIN: data.subdomain,
    };

    // Set each environment variable
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
              values: [
                {
                  value: value,
                  context: "all",
                },
              ],
            }),
          },
        );

        if (envResponse.ok) {
          console.log(`Set environment variable ${key} for site ${site.id}`);
        } else {
          const errorText = await envResponse.text();
          console.warn(
            `Failed to set environment variable ${key}: ${errorText}`,
          );
        }
      } catch (envError) {
        console.warn(`Failed to set environment variable ${key}:`, envError);
        // Continue with other variables even if one fails
      }
    }

    console.log("Environment variables set for site:", site.id);

    // Try to set up repository connection if GITHUB_REPO is configured
    if (process.env.GITHUB_REPO) {
      try {
        console.log("Setting up repository connection...");

        const repoSetupResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${site.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              repo: {
                provider: "github",
                repo: process.env.GITHUB_REPO,
                branch: "main",
                dir: "/",
                cmd: "npm run build",
                publish_dir: "dist/spa",
              },
              build_settings: {
                cmd: "npm run build",
                publish_dir: "dist/spa",
              }
            }),
          }
        );

        if (repoSetupResponse.ok) {
          console.log("Repository connection configured successfully");

          // Try to trigger deployment
          try {
            const deployResponse = await fetch(
              `https://api.netlify.com/api/v1/sites/${site.id}/builds`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
                },
                body: JSON.stringify({}),
              }
            );

            if (deployResponse.ok) {
              console.log("Deployment triggered successfully");
            } else {
              console.warn("Repository connected but deployment trigger failed");
            }
          } catch (deployError) {
            console.warn("Repository connected but deployment failed:", deployError);
          }
        } else {
          const repoError = await repoSetupResponse.text();
          console.warn("Failed to connect repository:", repoError);
        }
      } catch (repoError) {
        console.warn("Repository setup failed:", repoError);
        // Continue - site is created even if repo setup fails
      }
    } else {
      console.log("No GITHUB_REPO configured - site created without repository connection");
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

    // Set each environment variable using REST API
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
            values: [
              {
                value: value,
                context: "all",
              },
            ],
          }),
        },
      );

      if (!envResponse.ok) {
        const errorText = await envResponse.text();
        console.warn(`Failed to set environment variable ${key}: ${errorText}`);
      }
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

    // Trigger a new build/deployment using REST API
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${data.siteId}/builds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({}),
      },
    );

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      throw new Error(`Deploy failed: ${deployResponse.status} ${errorText}`);
    }

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

async function setupDeployment(data: { siteId: string; repoUrl?: string }) {
  try {
    console.log("Setting up deployment for site:", data.siteId);

    const repoUrl = data.repoUrl || process.env.GITHUB_REPO;
    if (!repoUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "No repository URL provided",
        }),
      };
    }

    // Update site with repository connection
    const updateResponse = await fetch(
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
            repo: repoUrl,
            branch: "main",
            dir: "/",
            cmd: "npm run build",
            publish_dir: "dist/spa",
          },
          build_settings: {
            cmd: "npm run build",
            publish_dir: "dist/spa",
          }
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: `Failed to setup repository: ${errorText}`,
        }),
      };
    }

    // Trigger deployment
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${data.siteId}/builds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({}),
      }
    );

    const deploySuccess = deployResponse.ok;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        repoSetup: true,
        deploymentTriggered: deploySuccess,
        siteId: data.siteId,
      }),
    };
  } catch (error) {
    console.error("Error setting up deployment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}

async function checkDomainAvailability(data: { subdomain: string }) {
  try {
    console.log("=== TESTING GLOBAL SITE NAME AVAILABILITY ===");
    console.log("Testing subdomain:", data.subdomain);

    // The only way to check global availability is to attempt site creation
    // We'll try to create a site and see if it fails with uniqueness error
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
          // Don't set up repo or other configs for test
        }),
      },
    );

    console.log("Test site creation response status:", testSiteResponse.status);

    if (testSiteResponse.ok) {
      // Site was created successfully, meaning the name is available
      const createdSite = await testSiteResponse.json();
      console.log("Test site created successfully with ID:", createdSite.id);

      // Delete the test site immediately since we only wanted to test availability
      console.log("Deleting test site...");
      const deleteResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${createdSite.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
        },
      );

      if (deleteResponse.ok) {
        console.log("Test site deleted successfully");
      } else {
        console.warn(
          "Failed to delete test site - you may need to delete manually",
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          available: true,
          subdomain: data.subdomain,
          method: "test-creation",
        }),
      };
    } else {
      // Site creation failed - check if it's due to name uniqueness
      const errorText = await testSiteResponse.text();
      console.log("Site creation failed with:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Check if the error is specifically about subdomain uniqueness
      const isUniquenessError =
        testSiteResponse.status === 422 &&
        (errorText.includes("must be unique") ||
          errorText.includes("subdomain") ||
          errorData.errors?.subdomain);

      if (isUniquenessError) {
        console.log("Subdomain is not available (uniqueness constraint)");
        return {
          statusCode: 200,
          body: JSON.stringify({
            available: false,
            subdomain: data.subdomain,
            method: "test-creation",
            reason: "Name already taken globally",
          }),
        };
      } else {
        // Some other error (permissions, API issues, etc.)
        console.error("Unexpected error during site creation test:", errorData);
        return {
          statusCode: 500,
          body: JSON.stringify({
            available: null,
            error: `Unable to test domain availability: ${errorData.message || errorText}`,
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

    // List sites to find the one to delete
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
      // Try multiple ways to find the site
      const targetDomain = `${data.subdomain}.swellfocusgrid.com`;
      return (
        site.name === data.subdomain || // Exact subdomain match (new format)
        site.name === `${data.subdomain}-focusgrid` || // Old format with suffix
        site.custom_domain === targetDomain || // Custom domain match
        site.url?.includes(data.subdomain) || // URL contains subdomain
        site.ssl_url?.includes(data.subdomain) || // SSL URL contains subdomain
        (site.domain_aliases && site.domain_aliases.includes(targetDomain)) // Domain alias match
      );
    });

    console.log(`Looking for site with subdomain: ${data.subdomain}`);
    console.log(`Found ${sites.length} total sites`);
    if (siteToDelete) {
      console.log(
        `Found site to delete: ${siteToDelete.name} (ID: ${siteToDelete.id})`,
      );
    } else {
      console.log(
        `Available sites: ${sites.map((s: any) => s.name).join(", ")}`,
      );
    }

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

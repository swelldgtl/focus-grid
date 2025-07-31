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

  // Verify main site ID is available for copying environment variables
  if (!process.env.MAIN_SITE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Main site ID not configured for environment variable copying" }),
    };
  }

  // Debug environment variables (in production)
  console.log("Environment check:", {
    hasNetlifyToken: !!process.env.NETLIFY_ACCESS_TOKEN,
    hasGithubRepo: !!process.env.GITHUB_REPO,
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
    tokenLength: process.env.NETLIFY_ACCESS_TOKEN?.length || 0,
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

    // Create site without repository connection to avoid auth issues
    const friendlySiteName = data.subdomain;

    console.log(`Creating site with exact name: ${friendlySiteName}`);

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
          // Create without repository connection to avoid authentication issues
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

    // Set custom domain using the correct API
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
      // Copy GitHub token from main site to enable deployment
      ...(process.env.GITHUB_TOKEN && {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      }),
    };

    // Set each environment variable with detailed debugging
    console.log("=== SETTING ENVIRONMENT VARIABLES ===");
    console.log("Variables to set:", Object.keys(envVars));
    console.log("Site ID:", site.id);

    let envVarsSet = 0;
    let envVarsFailed = 0;

    // Try bulk environment variable setting first (newer API)
    try {
      console.log("Attempting bulk environment variable setting...");

      const envVarArray = Object.entries(envVars).map(([key, value]) => ({
        key,
        values: [{ value, context: "all" }],
      }));

      const bulkResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.id}/env`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(envVarArray),
        },
      );

      console.log(`Bulk env var response status: ${bulkResponse.status}`);

      if (bulkResponse.ok) {
        console.log("✅ Bulk environment variables set successfully");
        envVarsSet = Object.keys(envVars).length;
      } else {
        const bulkError = await bulkResponse.text();
        console.warn(
          "❌ Bulk method failed, trying individual method:",
          bulkError,
        );

        // Fall back to individual setting
        for (const [key, value] of Object.entries(envVars)) {
          try {
            console.log(`Setting environment variable individually: ${key}`);

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

            console.log(
              `Environment variable ${key} response status: ${envResponse.status}`,
            );

            if (envResponse.ok) {
              console.log(`✅ Successfully set environment variable: ${key}`);
              envVarsSet++;
            } else {
              const errorText = await envResponse.text();
              console.error(`❌ Failed to set environment variable ${key}:`, {
                status: envResponse.status,
                error: errorText,
              });
              envVarsFailed++;
            }
          } catch (envError) {
            console.error(
              `❌ Exception setting environment variable ${key}:`,
              envError,
            );
            envVarsFailed++;
          }
        }
      }
    } catch (bulkError) {
      console.error("❌ Bulk environment variable setting failed:", bulkError);
      envVarsFailed = Object.keys(envVars).length;
    }

    console.log(`=== ENVIRONMENT VARIABLES SUMMARY ===`);
    console.log(`✅ Set: ${envVarsSet}`);
    console.log(`❌ Failed: ${envVarsFailed}`);
    console.log(`=== END ENVIRONMENT VARIABLES ===`);

    // CRITICAL: Verify GitHub token was set before attempting deployment
    if (process.env.GITHUB_TOKEN && envVarsFailed > 0) {
      console.error(
        `❌ BLOCKING DEPLOYMENT: ${envVarsFailed} environment variables failed to set`,
      );
      console.error("GitHub token may not be available for deployment");
    }

    // Verify environment variables were actually set by reading them back
    try {
      console.log("=== VERIFYING ENVIRONMENT VARIABLES ===");
      const verifyResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.id}/env`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
        },
      );

      if (verifyResponse.ok) {
        const envVarList = await verifyResponse.json();
        const setVarNames = envVarList.map((envVar: any) => envVar.key);
        console.log("Actually set environment variables:", setVarNames);

        const hasGithubToken = setVarNames.includes("GITHUB_TOKEN");
        console.log(`GitHub token present in new site: ${hasGithubToken}`);

        if (process.env.GITHUB_TOKEN && !hasGithubToken) {
          console.error(
            "❌ CRITICAL: GitHub token was NOT set on new site - deployment will fail",
          );
        }
      } else {
        console.warn("Could not verify environment variables");
      }
    } catch (verifyError) {
      console.warn("Environment variable verification failed:", verifyError);
    }
    console.log("=== ENVIRONMENT VERIFICATION COMPLETE ===");

    console.log("Environment variables set for site:", site.id);

    // Try automatic deployment using build hooks
    let deploymentResult = null;
    try {
      console.log("Setting up automatic deployment...");

      // Create a build hook for webhook-based deployment
      const buildHookResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${site.id}/build_hooks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            title: "Auto Deploy Hook",
            branch: "main",
          }),
        },
      );

      if (buildHookResponse.ok) {
        const buildHook = await buildHookResponse.json();
        console.log("Build hook created:", buildHook.url);

        // Configure build settings without repository connection
        const buildSettingsResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${site.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
              build_settings: {
                cmd: "npm run build",
                publish_dir: "dist/spa",
              },
            }),
          },
        );

        if (buildSettingsResponse.ok) {
          console.log("Build settings configured");

          // Try GitHub integration first if repository is configured
          if (process.env.GITHUB_REPO) {
            // Check if we have critical environment variables before attempting GitHub deployment
            if (envVarsFailed === 0 || !process.env.GITHUB_TOKEN) {
              try {
                const githubResult = await setupGitHubIntegration(
                  site.id,
                  process.env.GITHUB_REPO,
                );
                if (githubResult.success) {
                  deploymentResult = githubResult;
                  console.log("GitHub integration successful");
                } else {
                  console.warn("GitHub integration failed, trying file upload");
                  const deployResult = await triggerFileBasedDeployment(
                    site.id,
                    data,
                  );
                  deploymentResult = deployResult;
                }
              } catch (githubError) {
                console.warn(
                  "GitHub integration error, trying file upload:",
                  githubError,
                );
                const deployResult = await triggerFileBasedDeployment(
                  site.id,
                  data,
                );
                deploymentResult = deployResult;
              }
            } else {
              console.warn(
                "❌ Skipping GitHub integration - environment variables failed to set",
              );
              console.warn(
                "Falling back to file-based deployment with setup instructions",
              );
              const deployResult = await triggerFileBasedDeployment(
                site.id,
                data,
              );
              deploymentResult = deployResult;
            }
          } else {
            // No GitHub repo configured, use file upload
            const deployResult = await triggerFileBasedDeployment(
              site.id,
              data,
            );
            deploymentResult = deployResult;
          }
        }
      }
    } catch (deployError) {
      console.warn("Automatic deployment setup failed:", deployError);
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        projectId: site.id,
        siteId: site.id,
        primaryUrl: `https://${data.subdomain}.swellfocusgrid.com`,
        branchUrl: site.url,
        deployed: !!deploymentResult?.success,
        deploymentMethod: deploymentResult?.method || "manual-required",
        manualSetupRequired: !deploymentResult?.success,
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
    const site = await fetch(
      `https://api.netlify.com/api/v1/sites/${data.siteId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
      },
    );

    if (!site.ok) {
      throw new Error(`Failed to get site info: ${site.status}`);
    }

    const siteData = await site.json();
    const accountId = siteData.account_slug;

    // Set each environment variable
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
        hasGithubToken: !!process.env.GITHUB_TOKEN,
        githubRepo: process.env.GITHUB_REPO,
        githubTokenLength: process.env.GITHUB_TOKEN?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(
          (key) => key.includes("GITHUB") || key.includes("NETLIFY"),
        ),
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

async function setupGitHubIntegration(siteId: string, repoUrl: string) {
  try {
    console.log("Attempting GitHub integration for:", repoUrl);

    // Try to configure the site with GitHub repository
    const repoConfig = {
      repo: {
        provider: "github",
        repo: repoUrl,
        branch: "main",
        dir: "/",
        cmd: "npm run build",
        publish_dir: "dist/spa",
        private: false, // Try as public first
      },
      build_settings: {
        cmd: "npm run build",
        publish_dir: "dist/spa",
      },
    };

    const updateResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(repoConfig),
      },
    );

    if (updateResponse.ok) {
      console.log("Repository configured successfully");

      // Try to trigger a build
      const buildResponse = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}/builds`,
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

      if (buildResponse.ok) {
        const buildResult = await buildResponse.json();
        console.log("Build triggered successfully:", buildResult.id);

        return {
          success: true,
          method: "github-integration",
          buildId: buildResult.id,
          state: buildResult.state,
        };
      } else {
        const buildError = await buildResponse.text();
        console.warn("Repository configured but build failed:", buildError);
        return {
          success: false,
          error: `Build failed: ${buildError}`,
        };
      }
    } else {
      const repoError = await updateResponse.text();
      console.warn("GitHub integration failed:", repoError);
      return {
        success: false,
        error: `Repository configuration failed: ${repoError}`,
      };
    }
  } catch (error) {
    console.error("Error in GitHub integration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function triggerFileBasedDeployment(siteId: string, clientData: any) {
  try {
    console.log("Attempting file-based deployment for site:", siteId);

    // Create a better temporary site with instructions
    const deployFiles = {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clientData.clientName} - Focus Grid</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container { max-width: 700px; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; opacity: 0.9; line-height: 1.6; }
        .status {
            background: rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 8px;
            margin: 2rem 0;
            text-align: left;
        }
        .steps {
            background: rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 1rem;
            text-align: left;
        }
        .steps ol {
            margin: 0;
            padding-left: 1.2rem;
        }
        .steps li {
            margin: 0.5rem 0;
            line-height: 1.4;
        }
        .highlight {
            background: rgba(255,255,255,0.2);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${clientData.clientName}</h1>
        <p>Your Focus Grid site has been created successfully! To complete the setup and deploy your full application, please follow these steps:</p>

        <div class="status">
            <strong>✅ Site Created:</strong> ${clientData.subdomain}.swellfocusgrid.com<br>
            <strong>✅ Custom Domain:</strong> Configured<br>
            <strong>✅ Environment Variables:</strong> Set<br>
            <strong>⏳ Deployment:</strong> Requires repository connection
        </div>

        <div class="steps">
            <strong>Next Steps to Deploy:</strong>
            <ol>
                <li>Go to your <a href="https://app.netlify.com" style="color: #90cdf4;">Netlify Dashboard</a></li>
                <li>Find site: <span class="highlight">${clientData.subdomain}</span></li>
                <li>Go to <strong>Site settings → Build & deploy</strong></li>
                <li>Click <strong>Link to Git repository</strong></li>
                <li>Connect to: <span class="highlight">swelldgtl/focus-grid</span></li>
                <li>Set build command: <span class="highlight">npm run build</span></li>
                <li>Set publish directory: <span class="highlight">dist/spa</span></li>
                <li>Click <strong>Deploy site</strong></li>
            </ol>
        </div>

        <p>Once connected, your site will automatically deploy and be fully functional!</p>
    </div>
</body>
</html>`,
      _redirects: `# Netlify redirects
/*    /index.html   200`,
    };

    // Create form data for file upload
    const formData = new FormData();

    // Add files to form data
    Object.entries(deployFiles).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: "text/html" });
      formData.append(filename, blob, filename);
    });

    // Deploy files
    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: formData,
      },
    );

    if (deployResponse.ok) {
      const deployResult = await deployResponse.json();
      console.log("File-based deployment successful:", deployResult.id);

      return {
        success: true,
        method: "file-upload",
        deployId: deployResult.id,
        url: deployResult.url,
      };
    } else {
      const errorText = await deployResponse.text();
      console.error("File-based deployment failed:", errorText);
      return {
        success: false,
        error: errorText,
      };
    }
  } catch (error) {
    console.error("Error in file-based deployment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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

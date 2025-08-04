// Test script to verify feature persistence
const testFeatures = async () => {
  try {
    console.log("Testing feature persistence...");

    // Test database connection
    const dbResponse = await fetch("/.netlify/functions/api/database-test");
    const dbData = await dbResponse.json();
    console.log("Available features:", dbData.availableFeatures);

    // Test getting clients
    const clientsResponse = await fetch("/.netlify/functions/api/clients");
    const clientsData = await clientsResponse.json();
    console.log(
      "Clients with features:",
      clientsData.clients.map((c) => ({
        name: c.name,
        features: c.features,
      })),
    );
  } catch (error) {
    console.error("Test failed:", error);
  }
};

// Run in browser console
if (typeof window !== "undefined") {
  testFeatures();
}

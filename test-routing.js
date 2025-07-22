#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Testing Admin vs Client Routing Setup\n");

// Check if directories exist
const adminDir = path.join("dist", "admin");
const clientDir = path.join("dist", "client");

console.log(`✅ Admin directory exists: ${fs.existsSync(adminDir)}`);
console.log(`✅ Client directory exists: ${fs.existsSync(clientDir)}`);

// Check index.html files
const adminIndex = path.join(adminDir, "index.html");
const clientIndex = path.join(clientDir, "index.html");

if (fs.existsSync(adminIndex) && fs.existsSync(clientIndex)) {
  const adminContent = fs.readFileSync(adminIndex, "utf8");
  const clientContent = fs.readFileSync(clientIndex, "utf8");

  console.log("\n📄 Admin index.html title:");
  const adminTitle = adminContent.match(/<title>(.*?)<\/title>/);
  console.log(`   ${adminTitle ? adminTitle[1] : "No title found"}`);

  console.log("\n📄 Client index.html title:");
  const clientTitle = clientContent.match(/<title>(.*?)<\/title>/);
  console.log(`   ${clientTitle ? clientTitle[1] : "No title found"}`);

  console.log(
    "\n🎯 Content is different:",
    adminContent !== clientContent ? "✅ YES" : "❌ NO",
  );

  // Check asset files
  const adminAssets = fs.existsSync(path.join(adminDir, "assets"));
  const clientAssets = fs.existsSync(path.join(clientDir, "assets"));

  console.log(`\n📦 Admin assets exist: ${adminAssets ? "✅" : "❌"}`);
  console.log(`📦 Client assets exist: ${clientAssets ? "✅" : "❌"}`);

  if (adminAssets && clientAssets) {
    const adminAssetFiles = fs.readdirSync(path.join(adminDir, "assets"));
    const clientAssetFiles = fs.readdirSync(path.join(clientDir, "assets"));

    console.log("\n📁 Admin assets:", adminAssetFiles);
    console.log("📁 Client assets:", clientAssetFiles);
  }
} else {
  console.log("\n❌ One or both index.html files are missing");
}

console.log("\n🌐 Netlify redirect configuration:");
if (fs.existsSync("netlify.toml")) {
  const netlifyConfig = fs.readFileSync("netlify.toml", "utf8");
  const redirects = netlifyConfig.match(/\[\[redirects\]\][\s\S]*?(?=\[\[|$)/g);
  redirects?.forEach((redirect, i) => {
    console.log(`\nRedirect ${i + 1}:`);
    console.log(redirect.trim());
  });
} else {
  console.log("❌ netlify.toml not found");
}

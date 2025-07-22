#!/usr/bin/env node

// Build verification script
const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying build structure...");

const distPath = path.join(__dirname, "dist");
const clientPath = path.join(distPath, "client");
const adminPath = path.join(distPath, "admin");

// Check if build directories exist
const checks = [
  { path: distPath, name: "dist" },
  { path: clientPath, name: "dist/client" },
  { path: adminPath, name: "dist/admin" },
  { path: path.join(clientPath, "index.html"), name: "client/index.html" },
  { path: path.join(adminPath, "index.html"), name: "admin/index.html" },
];

let allGood = true;

checks.forEach((check) => {
  if (fs.existsSync(check.path)) {
    console.log(`✅ ${check.name} - exists`);
  } else {
    console.log(`❌ ${check.name} - missing`);
    allGood = false;
  }
});

if (allGood) {
  console.log("\n🎉 Build structure looks good!");
  console.log("📁 Client app will be served from: /client/");
  console.log("👑 Admin app will be served from: /admin/");
} else {
  console.log("\n⚠️  Some build artifacts are missing");
  console.log("Run: npm run build:smart");
}

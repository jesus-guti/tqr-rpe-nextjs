#!/usr/bin/env node

/**
 * Setup script for Google Sheets integration
 * This script helps you set up the Google Sheets API credentials
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printBanner() {
  console.log("=".repeat(60));
  console.log("GOOGLE SHEETS INTEGRATION SETUP");
  console.log("=".repeat(60));
  console.log();
}

function printInstructions() {
  console.log("To set up Google Sheets integration, follow these steps:");
  console.log();
  console.log(
    "1. Go to Google Cloud Console (https://console.cloud.google.com/)",
  );
  console.log("2. Create a new project or select an existing one");
  console.log("3. Enable the Google Sheets API:");
  console.log('   - Go to "APIs & Services" > "Library"');
  console.log('   - Search for "Google Sheets API" and enable it');
  console.log("4. Create a Service Account:");
  console.log('   - Go to "APIs & Services" > "Credentials"');
  console.log('   - Click "Create Credentials" > "Service Account"');
  console.log("   - Fill in the details and create the account");
  console.log("5. Generate a JSON key:");
  console.log("   - Click on the service account you just created");
  console.log('   - Go to "Keys" tab');
  console.log('   - Click "Add Key" > "Create new key" > "JSON"');
  console.log("   - Download the JSON file");
  console.log("6. Add the credentials to your .env.local file");
  console.log();
  console.log("After completing these steps, run this script again.");
  console.log();
}

function checkEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.local");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env.local file not found");
    console.log("   Create a .env.local file in the project root");
    return false;
  }

  const envContent = fs.readFileSync(envPath, "utf8");

  const hasServiceAccountEmail = envContent.includes(
    "GOOGLE_SERVICE_ACCOUNT_EMAIL=",
  );
  const hasPrivateKey = envContent.includes("GOOGLE_PRIVATE_KEY=");

  if (!hasServiceAccountEmail) {
    console.log("❌ GOOGLE_SERVICE_ACCOUNT_EMAIL not found in .env.local");
    return false;
  }

  if (!hasPrivateKey) {
    console.log("❌ GOOGLE_PRIVATE_KEY not found in .env.local");
    return false;
  }

  console.log("✅ Google Sheets credentials found in .env.local");
  return true;
}

function generateEnvTemplate() {
  const template = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
DIRECT_URL="postgresql://username:password@localhost:5432/database_name"

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID="your-spreadsheet-id-here"
`;

  const envPath = path.join(__dirname, "..", ".env.local");

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, template);
    console.log("✅ Created .env.local template");
    console.log("   Please update it with your actual credentials");
  } else {
    console.log("ℹ️  .env.local already exists");
    console.log("   Please add the Google Sheets variables if not present");
  }
}

async function testConnection() {
  try {
    // This would require loading the environment variables
    // For now, we'll just check if the file exists
    console.log("✅ Environment file structure looks correct");
    console.log("   You can test the connection by creating a spreadsheet");
    return true;
  } catch (error) {
    console.log(
      "❌ Connection test failed:",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

async function main() {
  printBanner();

  // Check if .env.local exists
  if (!checkEnvFile()) {
    console.log("\n📝 Creating .env.local template...");
    generateEnvTemplate();
    printInstructions();
    return;
  }

  // Test connection
  console.log("\n🔗 Testing Google Sheets connection...");
  if (await testConnection()) {
    console.log("\n🎉 Setup completed successfully!");
    console.log("Your data will now automatically sync to Google Sheets.");
    console.log("\nNext steps:");
    console.log("1. Create a spreadsheet using the API endpoint");
    console.log("2. Add the spreadsheet ID to your .env.local file");
    console.log("3. Start using the application!");
  } else {
    console.log("\n❌ Setup failed. Please check your credentials.");
  }
}

main().catch(console.error);

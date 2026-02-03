import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from .env.deploy
dotenv.config({ path: path.join(__dirname, "../.env.deploy") });

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    const config = {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASS,
        secure: false // Set to true if Axxess supports FTPS
    };

    try {
        console.log("🚀 Connecting to FTP server...");
        await client.access(config);

        const localPath = path.join(__dirname, "../dist");
        const remotePath = process.env.FTP_REMOTE_PATH;

        if (!fs.existsSync(localPath)) {
            throw new Error("❌ 'dist' folder not found. Run 'npm run build' first.");
        }

        console.log(`📂 Remote Path from Env: ${remotePath}`);

        // Try to navigate to root explicitly
        try {
            await client.cd("/");
            console.log(`📍 Navigated to Root. Current PWD: ${await client.pwd()}`);
        } catch (e) {
            console.log("⚠️ Could not CD to /, assuming restricted root.");
        }

        // Split the path and navigate one by one to ensure we are where we think we are
        // Remove 'public_html/' trailing slash and split
        const pathSegments = remotePath.split('/').filter(p => p && p.length > 0);

        for (const segment of pathSegments) {
            try {
                await client.cd(segment);
                console.log(`✅ Entering directory: ${segment}`);
            } catch (err) {
                console.log(`⚠️ Directory '${segment}' not found, trying to create...`);
                await client.ensureDir(segment);
                console.log(`✅ Created and entered: ${segment}`);
            }
        }

        console.log(`🎯 Target directory reached: ${await client.pwd()}`);

        console.log(`📤 Uploading files from 'dist' to current remote directory...`);
        await client.uploadFromDir(localPath);

        console.log("✅ Deployment complete!");
    } catch (err) {
        console.error("❌ Deployment failed:", err);
    } finally {
        client.close();
    }
}

deploy();

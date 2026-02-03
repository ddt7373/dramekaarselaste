import * as ftp from "basic-ftp";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.deploy") });

async function debugFtp() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: false
        });

        console.log("--- DEBUG INFO ---");
        console.log("1. Initial PWD:", await client.pwd());

        console.log("2. Content of Initial Directory:");
        let list = await client.list();
        list.forEach(f => console.log(` - ${f.name} (${f.type})`));

        console.log("\n3. Attempting cd /");
        await client.cd("/");
        console.log("   PWD after cd /:", await client.pwd());

        console.log("4. Content of Root:");
        list = await client.list();
        list.forEach(f => console.log(` - ${f.name} (${f.type})`));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.close();
    }
}

debugFtp();

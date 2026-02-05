import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "oauth_debug.log");

export function logOAuth(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ""}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

import fs from "fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db.json");

const defaultDb = {
  templates: [],
  rules: [],     
  scans: [], 
  stats: {
    totalFoldersScanned: 0,
    lastScanDate: "None",
    recentScans: [],
  },
};

// GET database
export async function getDbData() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
}

export async function saveDbData(db: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}


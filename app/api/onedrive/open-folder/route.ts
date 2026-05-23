import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { graphRequest } from "@/lib/onedrive";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { folderId } = await req.json();

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
    }

    // Get folder info from OneDrive
    const folderInfo = await graphRequest(session.accessToken, `${process.env.GRAPH_BASE || "https://graph.microsoft.com/v1.0"}/me/drive/items/${folderId}`);

    if (!folderInfo) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Try to construct local OneDrive path
    // OneDrive typically syncs to: C:\Users\[username]\OneDrive
    const username = os.userInfo().username;
    const oneDrivePath = path.join("C:\\Users", username, "OneDrive");

    // Build the relative path from the folder info
    const parentPath = folderInfo.parentReference?.path || "";
    let localFolderPath = oneDrivePath;

    if (parentPath && parentPath.includes("/drive/root:")) {
      const relativePath = parentPath.replace("/drive/root:", "").replace(/\//g, "\\");
      localFolderPath = path.join(oneDrivePath, relativePath);
    }

    // Open the folder in Windows Explorer
    if (process.platform === "win32") {
      await execAsync(`start explorer.exe "${localFolderPath}"`);
    } else if (process.platform === "darwin") {
      await execAsync(`open "${localFolderPath}"`);
    } else {
      await execAsync(`xdg-open "${localFolderPath}"`);
    }

    return NextResponse.json({ success: true, path: localFolderPath });
  } catch (err: any) {
    console.error("Error opening folder:", err);
    return NextResponse.json({ success: false, error: "Unable to open local file explorer." }, { status: 500 });
  }
}

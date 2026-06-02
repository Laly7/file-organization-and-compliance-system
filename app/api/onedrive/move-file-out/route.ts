import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { graphRequest, moveFile } from "@/lib/onedrive";

const OUT_OF_SCOPE_FOLDER = "Moved Files (Compliance)";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const token = session?.accessToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, scanFolderId } = await req.json();

    if (!fileId || !scanFolderId) {
      return NextResponse.json({ error: "Missing fileId or scanFolderId" }, { status: 400 });
    }

    const folderInfo = await graphRequest(
      token,
      `https://graph.microsoft.com/v1.0/me/drive/items/${scanFolderId}`
    );

    let targetFolderId = folderInfo.parentReference?.id;
    let targetFolderName = "parent folder";

    if (!targetFolderId) {
      const rootChildren = await graphRequest(
        token,
        "https://graph.microsoft.com/v1.0/me/drive/root/children"
      );

      let targetFolder = (rootChildren.value || []).find(
        (item: any) => item.folder && item.name === OUT_OF_SCOPE_FOLDER
      );

      if (!targetFolder) {
        targetFolder = await graphRequest(
          token,
          "https://graph.microsoft.com/v1.0/me/drive/root/children",
          {
            method: "POST",
            body: JSON.stringify({
              name: OUT_OF_SCOPE_FOLDER,
              folder: {},
              "@microsoft.graph.conflictBehavior": "rename"
            })
          }
        );
      }

      targetFolderId = targetFolder.id;
      targetFolderName = targetFolder.name;
    }

    const file = await moveFile(token, fileId, targetFolderId);

    return NextResponse.json({
      success: true,
      file,
      movedToFolderId: targetFolderId,
      movedToFolderName: targetFolderName
    });
  } catch (err: any) {
    console.error("Move file out error:", err);
    return NextResponse.json({ error: err.message || "Unable to move file." }, { status: 500 });
  }
}

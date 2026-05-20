const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphRequest(token: string, url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error?.message || `Graph error (${res.status})`);
  }

  return data;
}

export async function getDriveChildren(token: string, folderId?: string) {
  const url = folderId
    ? `${GRAPH_BASE}/me/drive/items/${folderId}/children`
    : `${GRAPH_BASE}/me/drive/root/children`;

  const data = await graphRequest(token, url);

  return (data.value || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    file: !!item.file,
    folder: !!item.folder,
    path: item.parentReference?.path || "", 
    parentId: item.parentReference?.id,
    webUrl: item.webUrl
  }));
}

export async function getDriveFilesRecursively(token: string, folderId: string): Promise<any[]> {
  const items = await getDriveChildren(token, folderId);
  let allFiles: any[] = [];

  for (const item of items) {
    if (item.file) {
      allFiles.push({
        id: item.id,
        name: item.name,
        path: item.path,
        webUrl: item.webUrl,
        isFolder: false
      });
    } else if (item.folder) {
      allFiles.push({
        id: item.id,
        name: item.name,
        path: item.path,
        webUrl: item.webUrl,
        isFolder: true
      });
      try {
        const subFolderFiles = await getDriveFilesRecursively(token, item.id);
        allFiles.push(...subFolderFiles);
      } catch (err) {
        console.error(`Failed to recurse into folder ${item.name} (${item.id}):`, err);
      }
    }
  }

  return allFiles;
}

export async function findFolderIdByName(
  token: string,
  folderName: string
): Promise<string | null> {
  const items = await getDriveChildren(token);

  const folder = items.find(
    (item: any) => item.folder && item.name === folderName
  );

  return folder?.id || null;
}

export async function renameFile(token: string, itemId: string, newName: string) {
  return graphRequest(token, `${GRAPH_BASE}/me/drive/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: newName })
  });
}

export async function moveFile(token: string, itemId: string, targetFolderId: string) {
  return graphRequest(token, `${GRAPH_BASE}/me/drive/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({
      parentReference: { id: targetFolderId }
    })
  });
}

export async function copyFile(token: string, itemId: string, targetFolderId: string) {
  return graphRequest(token, `${GRAPH_BASE}/me/drive/items/${itemId}/copy`, {
    method: "POST",
    body: JSON.stringify({
      parentReference: { id: targetFolderId }
    })
  });
}
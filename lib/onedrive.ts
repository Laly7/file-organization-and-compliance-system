const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function graphRequest(token: string, url: string, options?: RequestInit, timeout = 30000, retries = 2) {
  // Centralized Graph fetch with timeout and simple retry logic to reduce
  // transient network/connectivity issues.
  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      // Build headers ensuring Authorization is present and JSON content-type
      const providedHeaders = (options?.headers || {}) as Record<string, string>;
      const headerKeys = Object.keys(providedHeaders).map(k => k.toLowerCase());
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...providedHeaders
      };

      // If a body is present and no content-type was provided, assume JSON
      if (options?.body && !headerKeys.includes("content-type")) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers
      });

      clearTimeout(id);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = data?.error?.message || `Graph error (${res.status})`;
        throw new Error(errMsg);
      }

      return data;
    } catch (err: any) {
      clearTimeout(id);
      lastErr = err;

      // If it's an abort due to timeout or a network/connect error, retry.
      const isAbort = err?.name === 'AbortError' || err?.code === 'UND_ERR_CONNECT_TIMEOUT' || err?.type === 'system';

      if (attempt < retries && isAbort) {
        // Exponential backoff before retrying
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      // No more retries or non-retriable error
      throw err;
    }
  }

  throw lastErr;
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
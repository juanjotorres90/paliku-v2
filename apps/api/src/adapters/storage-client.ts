export interface StorageClient {
  upload(
    bucket: string,
    path: string,
    file: File,
    accessToken: string,
  ): Promise<{ url: string }>;
}

export function createStorageClient(
  supabaseUrl: string,
  anonKey: string,
): StorageClient {
  const supabaseOrigin = new URL(supabaseUrl).origin;

  async function upload(
    bucket: string,
    path: string,
    file: File,
    accessToken: string,
  ): Promise<{ url: string }> {
    const uploadUrl = new URL(
      `/storage/v1/object/${bucket}/${path}`,
      supabaseOrigin,
    );

    const response = await fetch(uploadUrl.toString(), {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${text}`);
    }

    const publicUrl = new URL(
      `/storage/v1/object/public/${bucket}/${path}`,
      supabaseOrigin,
    ).toString();

    return { url: publicUrl };
  }

  return { upload };
}

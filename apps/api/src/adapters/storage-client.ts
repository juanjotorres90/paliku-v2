import {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
} from "../domain/errors";

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
      const message = `Upload failed: ${response.status} - ${text}`;

      // Map HTTP status codes to typed errors
      switch (response.status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new ForbiddenError(message);
        case 413:
          throw new PayloadTooLargeError(message);
        default:
          throw new Error(message);
      }
    }

    const publicUrl = new URL(
      `/storage/v1/object/public/${bucket}/${path}`,
      supabaseOrigin,
    ).toString();

    return { url: publicUrl };
  }

  return { upload };
}

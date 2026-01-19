export interface RandomBytesFn {
  (size: number): Buffer;
}

export interface CreateHashFn {
  (algorithm: string): {
    update(data: Buffer): {
      digest(): Buffer;
    };
  };
}

export interface PKCEHelpers {
  randomBytes: RandomBytesFn;
  createHash: CreateHashFn;
}

export function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateCodeChallenge(helpers: PKCEHelpers): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = base64urlEncode(helpers.randomBytes(32));
  const codeChallenge = base64urlEncode(
    helpers.createHash("sha256").update(Buffer.from(codeVerifier)).digest(),
  );
  return { codeVerifier, codeChallenge };
}

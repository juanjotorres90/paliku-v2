import { randomBytes, createHash } from "node:crypto";
import type { PKCEHelpers } from "../domain/pkce";

export function createPKCEHelpers(): PKCEHelpers {
  return {
    randomBytes: (size: number) => randomBytes(size),
    createHash: (algorithm: string) => {
      const hash = createHash(algorithm);
      const wrapper = {
        update(data: Buffer) {
          hash.update(data);
          return wrapper;
        },
        digest() {
          return hash.digest() as Buffer;
        },
      };
      return wrapper;
    },
  };
}

import { randomBytes } from "node:crypto";

const USER_TOKEN_BYTES = 18;

export function generateUserToken() {
  return randomBytes(USER_TOKEN_BYTES).toString("base64url");
}

export async function generateUniqueUserToken(
  tokenExists: (token: string) => Promise<boolean>,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateUserToken();

    if (!(await tokenExists(token))) {
      return token;
    }
  }

  throw new Error("Could not generate a unique user token.");
}

export function isLegacySeedToken(token: string) {
  return /^test-user-\d{2}$/.test(token);
}

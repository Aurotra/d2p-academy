import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ISSUER = "d2p-academy";
const AUDIENCE = "d2p-presentation-file";
const EXPIRY = "2h";

function getSecret(): Uint8Array {
  const secret =
    process.env.PRESENTATION_FILE_JWT_SECRET?.trim() ||
    process.env.STUDENT_JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "PRESENTATION_FILE_JWT_SECRET veya STUDENT_JWT_SECRET eksik/kısa (min 32 karakter).",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface PresentationFileTokenPayload extends JWTPayload {
  sub: string;
  pid: string;
  iid: string;
}

export async function signPresentationFileToken(input: {
  presentationId: string;
  instructorId: string;
}): Promise<string> {
  return new SignJWT({
    pid: input.presentationId,
    iid: input.instructorId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.presentationId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyPresentationFileToken(
  token: string,
): Promise<PresentationFileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.pid !== "string" ||
      typeof payload.iid !== "string"
    ) {
      return null;
    }
    return payload as PresentationFileTokenPayload;
  } catch {
    return null;
  }
}

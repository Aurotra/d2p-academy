import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = "d2p_student_session";
const ISSUER = "d2p-academy";
const AUDIENCE = "d2p-student";
const EXPIRY = "8h";

function getSecret(): Uint8Array {
  const secret = process.env.STUDENT_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "STUDENT_JWT_SECRET env değişkeni eksik veya çok kısa (min 32 karakter). " +
        "Supabase JWT secret'ıyla aynı değeri kullanmayın.",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface StudentSessionPayload extends JWTPayload {
  sub: string;
  role: "student";
  username: string;
  parentId: string;
  /** student_session_version — şifre sıfırlamada artar */
  sv: number;
}

export async function signStudentSession(params: {
  studentId: string;
  username: string;
  parentId: string;
  sessionVersion: number;
}): Promise<string> {
  return new SignJWT({
    role: "student",
    username: params.username,
    parentId: params.parentId,
    sv: params.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.studentId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyStudentSession(token: string): Promise<StudentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (payload.role !== "student" || typeof payload.sub !== "string") {
      return null;
    }
    if (typeof payload.username !== "string" || typeof payload.parentId !== "string") {
      return null;
    }
    if (typeof payload.sv !== "number") {
      return null;
    }
    return payload as StudentSessionPayload;
  } catch {
    return null;
  }
}

export const STUDENT_SESSION_COOKIE = COOKIE_NAME;

export const studentCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
};

// @vitest-environment node
import { vi, test, expect, beforeEach } from "vitest";
import { SignJWT } from "jose";

// Must be mocked before importing auth.ts (which has "server-only" at the top)
vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Dynamic import so mocks are registered first
const { createSession, getSession, deleteSession, verifySession } = await import(
  "@/lib/auth"
);

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createSession ────────────────────────────────────────────────────────────

test("createSession sets a cookie with the auth-token name", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [cookieName] = mockCookieStore.set.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("createSession cookie is httpOnly, sameSite lax, path /", async () => {
  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession cookie expires roughly 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expiresMs = options.expires.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession stores a JWT that contains userId and email", async () => {
  await createSession("user-42", "alice@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { jwtVerify } = await import("jose");
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("alice@example.com");
});

// ─── getSession ───────────────────────────────────────────────────────────────

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({
    userId: "user-1",
    email: "user@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-1");
  expect(session!.email).toBe("user@example.com");
});

test("getSession returns null for an invalid/tampered token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken(
    { userId: "user-1", email: "user@example.com" },
    "-1s"
  );
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

// ─── deleteSession ────────────────────────────────────────────────────────────

test("deleteSession deletes the auth-token cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledOnce();
  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// ─── verifySession ────────────────────────────────────────────────────────────

function makeRequest(cookieValue?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === "auth-token" && cookieValue
          ? { value: cookieValue }
          : undefined,
    },
  } as never;
}

test("verifySession returns null when request has no auth-token cookie", async () => {
  const session = await verifySession(makeRequest());
  expect(session).toBeNull();
});

test("verifySession returns the session payload for a valid token", async () => {
  const token = await makeToken({
    userId: "user-7",
    email: "bob@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const session = await verifySession(makeRequest(token));
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-7");
  expect(session!.email).toBe("bob@example.com");
});

test("verifySession returns null for an invalid token", async () => {
  const session = await verifySession(makeRequest("garbage.token.value"));
  expect(session).toBeNull();
});

test("verifySession returns null for an expired token", async () => {
  const token = await makeToken(
    { userId: "user-1", email: "user@example.com" },
    "-1s"
  );

  const session = await verifySession(makeRequest(token));
  expect(session).toBeNull();
});

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'aml_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
    const secret = process.env.ACCESS_TOKEN || 'fallback-secret-key';
    return secret;
}

async function hmacSign(payload: string): Promise<string> {
    const secret = getSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
    const expected = await hmacSign(payload);
    return expected === signature;
}

export async function createSession(email: string): Promise<string> {
    const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
    const payload = JSON.stringify({ email, expiresAt });
    const signature = await hmacSign(payload);
    const token = btoa(payload) + '.' + signature;
    return token;
}

export async function verifySession(token: string): Promise<{ email: string } | null> {
    try {
        const [encodedPayload, signature] = token.split('.');
        if (!encodedPayload || !signature) return null;

        const payload = atob(encodedPayload);
        const isValid = await hmacVerify(payload, signature);
        if (!isValid) return null;

        const data = JSON.parse(payload);
        if (Date.now() > data.expiresAt) return null;

        return { email: data.email };
    } catch {
        return null;
    }
}

export async function setSessionCookie(email: string): Promise<void> {
    const token = await createSession(email);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });
}

export async function getSessionFromCookie(): Promise<{ email: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySession(token);
}

export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

export function validateCredentials(email: string, password: string): boolean {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables');
        return false;
    }

    return email === adminEmail && password === adminPassword;
}

import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { parse as parseCookie, serialize as serializeCookie } from 'cookie'

const COOKIE_NAME = 'brainlink_token'
const SESSION_DAYS = 14
const BCRYPT_ROUNDS = 12

function secret() {
  return process.env.AUTH_JWT_SECRET || 'dev-brainlink-change-me'
}

function useSecureCookie() {
  return process.env.NODE_ENV === 'production'
}

export async function hashPassword(raw) {
  return bcrypt.hash(raw, BCRYPT_ROUNDS)
}

export async function verifyPassword(raw, hash) {
  return bcrypt.compare(raw, hash)
}

export function createSignedToken(payload) {
  return jwt.sign(payload, secret(), {
    expiresIn: `${SESSION_DAYS}d`,
    jwtid: randomUUID(),
  })
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}

export function getTokenFromHeaders(headers) {
  const raw = headers?.cookie || headers?.Cookie
  if (!raw) return null
  const parsed = parseCookie(raw)
  return parsed[COOKIE_NAME] || null
}

export function sessionCookie(token) {
  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookie() {
  return serializeCookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}


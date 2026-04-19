import crypto from 'crypto';
import { db } from './db.js';

const JWT_SECRET = crypto.randomBytes(32).toString('hex');
const JWT_ALGORITHM = 'HS256';
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, cost: 16384, blockSize: 8, parallelization: 1 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  try {
    const [saltHex, keyHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
    const storedKey = Buffer.from(keyHex, 'hex');
    return crypto.timingSafeEqual(derivedKey, storedKey);
  } catch (err) {
    return false;
  }
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

export function generateToken(payload, expiresIn = '7d') {
  const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '7d' ? 7 * 24 * 60 * 60 : expiresIn);
  
  const tokenPayload = { ...payload, iat: now, exp };
  
  const headerEncoded = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(Buffer.from(JSON.stringify(tokenPayload)));
  
  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
  const signatureEncoded = base64UrlEncode(signature);
  
  return `${data}.${signatureEncoded}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const data = `${headerEncoded}.${payloadEncoded}`;
    
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
    const signature = base64UrlDecode(signatureEncoded);
    
    if (!crypto.timingSafeEqual(expectedSignature, signature)) return null;
    
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString());
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) return null;
    
    return payload;
  } catch (err) {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
}

export function registerUser(email, password, name) {
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }
    
    const passwordHash = hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run(email, passwordHash, name);
    
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken({ userId: user.id, email: user.email });
    
    return { success: true, data: { user, token } };
  } catch (err) {
    console.error('Register error:', err);
    return { success: false, error: 'Registration failed' };
  }
}

export function loginUser(email, password) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    const userData = { id: user.id, email: user.email, name: user.name, created_at: user.created_at };
    const token = generateToken({ userId: user.id, email: user.email });
    
    return { success: true, data: { user: userData, token } };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Login failed' };
  }
}

export function getUserById(userId) {
  try {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  } catch (err) {
    console.error('Get user error:', err);
    return { success: false, error: 'Failed to fetch user' };
  }
}
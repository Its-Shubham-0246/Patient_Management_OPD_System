import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env } from '../config/environment.js';

export interface TokenPayload {
  userId: string;
  role: string;
  clinicId: string;
  fullName: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m'
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
};


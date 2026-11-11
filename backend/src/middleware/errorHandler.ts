import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/environment.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let details = err.details || undefined;

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    errorCode = 'INVALID_IDENTIFIER';
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
    errorCode = 'DUPLICATE_RECORD';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  // Zod Validation Error
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed on request payload';
    errorCode = 'VALIDATION_ERROR';
    details = err.errors;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
    errorCode = 'TOKEN_EXPIRED';
  }

  if (env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.url} -> ${statusCode} - ${message}`);
    if (err.stack) console.error(err.stack);
  }

  return sendError(res, message, statusCode, errorCode, details);
};


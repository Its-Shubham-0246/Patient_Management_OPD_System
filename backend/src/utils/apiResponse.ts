import { Response } from 'express';

export interface MetaData {
  page?: number;
  limit?: number;
  totalRecords?: number;
  totalPages?: number;
  [key: string]: any;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: MetaData
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_SERVER_ERROR',
  details?: any
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {})
    }
  });
};


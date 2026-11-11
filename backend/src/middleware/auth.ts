import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { User, IUser } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please refresh your token or log in again.', 401));
      }
      return next(new AppError('Invalid authentication token.', 401));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (user.status === 'LOCKED' && user.isLocked()) {
      return next(new AppError('Account is temporarily locked due to multiple failed logins. Please try again later.', 423));
    }

    if (user.status === 'INACTIVE') {
      return next(new AppError('Account has been deactivated. Please contact clinic administration.', 403));
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this clinical resource.`,
          403
        )
      );
    }

    next();
  };
};


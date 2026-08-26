import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: string;
      refreshAuth?: {
        userId: string;
        jti: string;
      };
    }
  }
}

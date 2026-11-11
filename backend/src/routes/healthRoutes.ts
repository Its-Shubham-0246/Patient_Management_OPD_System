import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDatabaseStatus();
  const memory = process.memoryUsage();

  const healthData = {
    service: 'Smart OPD Backend API',
    status: db.isConnected ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: db,
    memory: {
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      rssMB: Math.round(memory.rss / 1024 / 1024)
    },
    nodeVersion: process.version
  };

  const statusCode = db.isConnected ? 200 : 200; // Return 200 with DEGRADED status in dev so container/probes don't crash
  return sendSuccess(res, healthData, statusCode);
});

export default router;

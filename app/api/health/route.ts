// Health check endpoint for system status

import { NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis/client';
import { stateManager } from '@/lib/state/manager';

export async function GET() {
  try {
    // Check Redis connection
    const redisHealthy = await redisClient.ping();

    // Get system stats
    const states = stateManager.getAllStates();
    const totalCandles = states.reduce((sum, s) => sum + s.candles.length, 0);
    const totalAlerts = states.reduce((sum, s) => sum + s.alerts.length, 0);

    return NextResponse.json({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      redis: {
        enabled: redisClient.enabled,
        healthy: redisHealthy,
      },
      stats: {
        activeStates: states.length,
        totalCandles,
        totalAlerts,
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

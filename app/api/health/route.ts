import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import { createContextLogger } from '@/lib/logging/logger';
import { HealthCheckResponse } from '@/lib/types/api';

// GET /api/health - Health check endpoint
export async function GET(req: NextRequest) {
  const logger = createContextLogger({});
  const startTime = Date.now();

  const version = process.env.npm_package_version || '1.0.0';
  const checks: HealthCheckResponse['checks'] = {
    database: { status: 'down' },
    auth: { status: 'down' },
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database connectivity
  try {
    const dbStartTime = Date.now();
    const { error } = await supabaseAdmin
      .from('device_models')
      .select('id')
      .limit(1);

    const dbLatency = Date.now() - dbStartTime;

    if (error) {
      logger.error({ error }, 'Database health check failed');
      checks.database = { status: 'down' };
      overallStatus = 'unhealthy';
    } else {
      checks.database = { status: 'up', latency_ms: dbLatency };

      // Degraded if latency is high
      if (dbLatency > 1000) {
        overallStatus = 'degraded';
      }
    }
  } catch (error) {
    logger.error({ error }, 'Database health check error');
    checks.database = { status: 'down' };
    overallStatus = 'unhealthy';
  }

  // Check Auth0 (simple check - just verify config exists)
  try {
    if (
      process.env.AUTH0_SECRET &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
    ) {
      checks.auth = { status: 'up' };
    } else {
      checks.auth = { status: 'down' };
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }
  } catch (error) {
    logger.error({ error }, 'Auth health check error');
    checks.auth = { status: 'down' };
    overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const duration = Date.now() - startTime;
  logger.info(
    {
      duration_ms: duration,
      status: overallStatus,
      checks,
    },
    'Health check completed'
  );

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version,
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

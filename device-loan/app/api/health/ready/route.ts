import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import { createContextLogger } from '@/lib/logging/logger';
import { ReadinessCheckResponse } from '@/lib/types/api';

// GET /api/health/ready - Readiness check endpoint
// Returns 200 if the service is ready to accept traffic, 503 otherwise
export async function GET(req: NextRequest) {
  const logger = createContextLogger({});
  const startTime = Date.now();

  let ready = true;

  // Check if database is accessible
  try {
    const { error } = await supabaseAdmin
      .from('device_models')
      .select('id')
      .limit(1);

    if (error) {
      ready = false;
      logger.error({ error }, 'Database not ready');
    }
  } catch (error) {
    ready = false;
    logger.error({ error }, 'Database readiness check failed');
  }

  // Check if Auth0 config is present
  if (
    !process.env.AUTH0_SECRET ||
    !process.env.AUTH0_ISSUER_BASE_URL ||
    !process.env.AUTH0_CLIENT_ID ||
    !process.env.AUTH0_CLIENT_SECRET
  ) {
    ready = false;
    logger.error('Auth0 configuration incomplete');
  }

  const duration = Date.now() - startTime;
  logger.info(
    {
      duration_ms: duration,
      ready,
    },
    'Readiness check completed'
  );

  const response: ReadinessCheckResponse = {
    ready,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: ready ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

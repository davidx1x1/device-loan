import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import { createContextLogger, getRequestContext } from '@/lib/logging/logger';
import { requireAuth } from '@/lib/middleware/rbac';
import { ApiResponse, SubscribeWaitlistRequest, WaitlistSubscription } from '@/lib/types/api';

// POST /api/waitlist - Subscribe to waitlist for a device model
export async function POST(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Subscribing to waitlist');

  // Check authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, correlation_id } = authResult;

  try {
    const body: SubscribeWaitlistRequest = await req.json();
    const { device_model_id } = body;

    if (!device_model_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'device_model_id is required',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Check if device model exists
    const { data: deviceModel, error: modelError } = await supabaseAdmin
      .from('device_models')
      .select('id, brand, model')
      .eq('id', device_model_id)
      .single();

    if (modelError || !deviceModel) {
      logger.error({ error: modelError, device_model_id }, 'Device model not found');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Device model not found',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Create waitlist entry (upsert to handle duplicates)
    const { data: waitlistEntry, error: waitlistError } = await supabaseAdmin
      .from('waitlist')
      .upsert(
        {
          user_id: user.id,
          device_model_id,
          notified: false,
        },
        {
          onConflict: 'user_id,device_model_id',
        }
      )
      .select()
      .single();

    if (waitlistError) {
      logger.error({ error: waitlistError, device_model_id, user_id: user.id }, 'Failed to create waitlist entry');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'WAITLIST_FAILED',
            message: 'Failed to subscribe to waitlist',
            details: waitlistError.message,
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        duration_ms: duration,
        waitlist_id: waitlistEntry.id,
        device_model_id,
        user_id: user.id,
      },
      'Waitlist subscription created'
    );

    // Log audit trail
    await supabaseAdmin.from('audit_logs').insert({
      correlation_id,
      user_id: user.id,
      action: 'SUBSCRIBE_WAITLIST',
      resource_type: 'waitlist',
      resource_id: waitlistEntry.id,
      metadata: {
        device_model_id,
      },
      ip_address: context.ip_address,
      user_agent: context.user_agent,
    });

    const response: WaitlistSubscription = {
      id: waitlistEntry.id,
      device_model: {
        brand: deviceModel.brand,
        model: deviceModel.model,
      },
      created_at: waitlistEntry.created_at,
    };

    return NextResponse.json<ApiResponse<WaitlistSubscription>>(
      {
        success: true,
        data: response,
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration, user_id: user.id }, 'Unexpected error subscribing to waitlist');

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/waitlist - Get user's waitlist subscriptions
export async function GET(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Fetching user waitlist subscriptions');

  // Check authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, correlation_id } = authResult;

  try {
    const { data: waitlistEntries, error: waitlistError } = await supabaseAdmin
      .from('waitlist')
      .select(`
        id,
        notified,
        created_at,
        device_model:device_models (
          id,
          brand,
          model,
          category,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (waitlistError) {
      logger.error({ error: waitlistError, user_id: user.id }, 'Failed to fetch waitlist');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch waitlist subscriptions',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({ duration_ms: duration, count: waitlistEntries?.length || 0 }, 'Waitlist fetched successfully');

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: waitlistEntries,
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration, user_id: user.id }, 'Unexpected error fetching waitlist');

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/waitlist?device_model_id=xxx - Unsubscribe from waitlist
export async function DELETE(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Unsubscribing from waitlist');

  // Check authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, correlation_id } = authResult;

  try {
    const { searchParams } = new URL(req.url);
    const device_model_id = searchParams.get('device_model_id');

    if (!device_model_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'device_model_id is required',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('waitlist')
      .delete()
      .eq('user_id', user.id)
      .eq('device_model_id', device_model_id);

    if (deleteError) {
      logger.error({ error: deleteError, device_model_id, user_id: user.id }, 'Failed to delete waitlist entry');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to unsubscribe from waitlist',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info({ duration_ms: duration, device_model_id, user_id: user.id }, 'Waitlist unsubscribe successful');

    // Log audit trail
    await supabaseAdmin.from('audit_logs').insert({
      correlation_id,
      user_id: user.id,
      action: 'UNSUBSCRIBE_WAITLIST',
      resource_type: 'waitlist',
      metadata: {
        device_model_id,
      },
      ip_address: context.ip_address,
      user_agent: context.user_agent,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration, user_id: user.id }, 'Unexpected error unsubscribing from waitlist');

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

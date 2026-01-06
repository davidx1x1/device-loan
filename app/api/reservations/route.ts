import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import { createContextLogger, getRequestContext } from '@/lib/logging/logger';
import { requireAuth } from '@/lib/middleware/rbac';
import { ApiResponse, CreateReservationRequest, CreateReservationResponse } from '@/lib/types/api';

// POST /api/reservations - Create a new reservation
// Requires authentication
export async function POST(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Creating reservation');

  // Check authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, correlation_id } = authResult;
  logger.info({ user_id: user.id, email: user.email }, 'User authenticated');

  try {
    const body: CreateReservationRequest = await req.json();
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

    // Use a transaction to handle concurrency
    // This ensures atomicity when checking availability and creating reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin.rpc(
      'create_reservation',
      {
        p_user_id: user.id,
        p_device_model_id: device_model_id,
        p_loan_duration_days: parseInt(process.env.DEFAULT_LOAN_DURATION_DAYS || '2', 10),
      }
    );

    if (reservationError) {
      logger.error(
        { error: reservationError, device_model_id, user_id: user.id },
        'Failed to create reservation'
      );

      // Handle specific error cases
      if (reservationError.message?.includes('NO_AVAILABLE_DEVICES')) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: 'NO_AVAILABLE_DEVICES',
              message: 'No devices available for this model',
            },
            metadata: {
              correlation_id,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'RESERVATION_FAILED',
            message: 'Failed to create reservation',
            details: reservationError.message,
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    // Fetch the complete reservation details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        device_id,
        reserved_at,
        due_date,
        status,
        device:devices (
          device_model:device_models (
            brand,
            model
          )
        )
      `)
      .eq('id', reservation.loan_id)
      .single();

    if (loanError || !loan) {
      logger.error({ error: loanError, loan_id: reservation.loan_id }, 'Failed to fetch loan details');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Reservation created but failed to fetch details',
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
        loan_id: loan.id,
        device_id: loan.device_id,
        user_id: user.id,
      },
      'Reservation created successfully'
    );

    // Log audit trail
    await supabaseAdmin.from('audit_logs').insert({
      correlation_id,
      user_id: user.id,
      action: 'CREATE_RESERVATION',
      resource_type: 'loan',
      resource_id: loan.id,
      metadata: {
        device_id: loan.device_id,
        device_model_id,
      },
      ip_address: context.ip_address,
      user_agent: context.user_agent,
    });

    const response: CreateReservationResponse = {
      loan_id: loan.id,
      device_id: loan.device_id,
      device_model: {
        brand: (loan as any).device.device_model.brand,
        model: (loan as any).device.device_model.model,
      },
      reserved_at: loan.reserved_at,
      due_date: loan.due_date,
      status: loan.status,
    };

    return NextResponse.json<ApiResponse<CreateReservationResponse>>(
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
    logger.error({ error, duration_ms: duration, user_id: user.id }, 'Unexpected error creating reservation');

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

// GET /api/reservations - Get user's reservations
export async function GET(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Fetching user reservations');

  // Check authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, correlation_id } = authResult;

  try {
    const { data: loans, error: loansError } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        device_id,
        status,
        reserved_at,
        collected_at,
        due_date,
        returned_at,
        device:devices (
          serial_number,
          device_model:device_models (
            brand,
            model,
            category,
            image_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('reserved_at', { ascending: false });

    if (loansError) {
      logger.error({ error: loansError, user_id: user.id }, 'Failed to fetch reservations');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch reservations',
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
    logger.info({ duration_ms: duration, count: loans?.length || 0 }, 'Reservations fetched successfully');

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: loans,
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration, user_id: user.id }, 'Unexpected error fetching reservations');

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

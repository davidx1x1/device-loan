import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import { createContextLogger, getRequestContext } from '@/lib/logging/logger';
import { requireStaff } from '@/lib/middleware/rbac';
import { ApiResponse, MarkCollectedRequest, LoanActionResponse } from '@/lib/types/api';
import { sendCollectionConfirmation } from '@/lib/email/resend-service';

// POST /api/staff/collect - Mark a device as collected
// Staff only
export async function POST(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Marking device as collected');

  // Check staff authentication
  const authResult = await requireStaff(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user: staff, correlation_id } = authResult;

  try {
    const body: MarkCollectedRequest = await req.json();
    const { loan_id } = body;

    if (!loan_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'loan_id is required',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Get the loan with user and device details
    const { data: loan, error: loanError } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        user_id,
        device_id,
        status,
        due_date,
        user:profiles!loans_user_id_fkey (id, email, name, role),
        device:devices (
          id,
          serial_number,
          device_model:device_models (
            id,
            brand,
            model,
            category
          )
        )
      `)
      .eq('id', loan_id)
      .single();

    if (loanError || !loan) {
      logger.error({ error: loanError, loan_id }, 'Loan not found');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Loan not found',
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      );
    }

    // Verify loan is in reserved status
    if (loan.status !== 'reserved') {
      logger.warn({ loan_id, current_status: loan.status }, 'Loan is not in reserved status');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot collect device. Current status: ${loan.status}`,
          },
          metadata: {
            correlation_id,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Update loan status to collected
    const collectedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('loans')
      .update({
        status: 'collected',
        collected_at: collectedAt,
        collected_by_staff_id: staff.id,
      })
      .eq('id', loan_id);

    if (updateError) {
      logger.error({ error: updateError, loan_id }, 'Failed to update loan status');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to mark device as collected',
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
        loan_id,
        staff_id: staff.id,
        user_id: loan.user_id,
      },
      'Device marked as collected'
    );

    // Log audit trail
    await supabaseAdmin.from('audit_logs').insert({
      correlation_id,
      user_id: staff.id,
      action: 'MARK_COLLECTED',
      resource_type: 'loan',
      resource_id: loan_id,
      metadata: {
        borrower_id: loan.user_id,
        device_id: loan.device_id,
      },
      ip_address: context.ip_address,
      user_agent: context.user_agent,
    });

    // Send collection confirmation email
    const loanData = loan as any;
    await sendCollectionConfirmation(
      {
        user: loanData.user,
        deviceModel: loanData.device.device_model,
        serialNumber: loanData.device.serial_number,
        collectedAt,
        dueDate: loan.due_date,
        loanId: loan.id,
      },
      correlation_id
    );

    const response: LoanActionResponse = {
      loan_id,
      status: 'collected',
      timestamp: collectedAt,
    };

    return NextResponse.json<ApiResponse<LoanActionResponse>>(
      {
        success: true,
        data: response,
        metadata: {
          correlation_id,
          timestamp: new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration, staff_id: staff.id }, 'Unexpected error marking device as collected');

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

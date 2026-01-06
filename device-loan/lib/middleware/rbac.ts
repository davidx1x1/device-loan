import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { UserRole } from '../types/database';
import { createContextLogger } from '../logging/logger';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  correlation_id: string;
}

// Middleware to check authentication
export async function requireAuth(
  req: NextRequest
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  const logger = createContextLogger({
    correlation_id: req.headers.get('x-correlation-id') || undefined,
  });

  try {
    const supabase = await createClient();

    // Get the current user from Supabase Auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      logger.warn('Unauthenticated access attempt');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      logger.error({ error: profileError }, 'Failed to fetch user profile');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_FETCH_FAILED',
            message: 'Failed to fetch user profile',
          },
        },
        { status: 500 }
      );
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as UserRole,
      },
      correlation_id: logger.bindings().correlation_id as string,
    };
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error',
        },
      },
      { status: 500 }
    );
  }
}

// Middleware to check for specific role
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!user || !allowedRoles.includes(user.role)) {
    const logger = createContextLogger({ correlation_id: authResult.correlation_id });
    logger.warn(
      { user_id: user?.id, role: user?.role, allowed_roles: allowedRoles },
      'Unauthorized role access attempt'
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      },
      { status: 403 }
    );
  }

  return authResult;
}

// Middleware to check if user is staff
export async function requireStaff(
  req: NextRequest
): Promise<{ user: AuthenticatedRequest['user']; correlation_id: string } | NextResponse> {
  return requireRole(req, ['staff']);
}

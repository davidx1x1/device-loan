import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/client';
import { createContextLogger, getRequestContext } from '@/lib/logging/logger';
import { ApiResponse, DeviceListResponse } from '@/lib/types/api';

// GET /api/devices - List all device models with availability
// Public endpoint - no authentication required
export async function GET(req: NextRequest) {
  const context = getRequestContext(req);
  const logger = createContextLogger(context);

  const startTime = Date.now();
  logger.info('Fetching device list');

  try {
    // Get all device models
    const { data: deviceModels, error: modelsError } = await supabase
      .from('device_models')
      .select('*')
      .order('brand', { ascending: true })
      .order('model', { ascending: true });

    if (modelsError) {
      logger.error({ error: modelsError }, 'Failed to fetch device models');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: 'Failed to fetch device models',
          },
          metadata: {
            correlation_id: context.correlation_id!,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    // For each model, get the count of available devices
    const devicesWithAvailability: DeviceListResponse[] = await Promise.all(
      (deviceModels || []).map(async (model) => {
        // Get total device count
        const { count: totalCount, error: totalError } = await supabase
          .from('devices')
          .select('*', { count: 'exact', head: true })
          .eq('device_model_id', model.id);

        if (totalError) {
          logger.error({ error: totalError, model_id: model.id }, 'Failed to count total devices');
        }

        // Get available device count
        // A device is available if:
        // 1. is_available = true
        // 2. Not in an active loan (reserved or collected)
        const { data: activeLoans, error: loansError } = await supabase
          .from('loans')
          .select('device_id')
          .in('status', ['reserved', 'collected']);

        if (loansError) {
          logger.error({ error: loansError }, 'Failed to fetch active loans');
        }

        const activeDeviceIds = new Set(
          (activeLoans || []).map((loan) => loan.device_id)
        );

        const { data: allDevicesForModel, error: devicesError } = await supabase
          .from('devices')
          .select('id, is_available')
          .eq('device_model_id', model.id);

        if (devicesError) {
          logger.error({ error: devicesError, model_id: model.id }, 'Failed to fetch devices');
        }

        const availableCount = (allDevicesForModel || []).filter(
          (device) => device.is_available && !activeDeviceIds.has(device.id)
        ).length;

        return {
          id: model.id,
          brand: model.brand,
          model: model.model,
          category: model.category,
          description: model.description,
          image_url: model.image_url,
          available_count: availableCount,
          total_count: totalCount || 0,
        };
      })
    );

    const duration = Date.now() - startTime;
    logger.info({ duration_ms: duration, count: devicesWithAvailability.length }, 'Device list fetched successfully');

    return NextResponse.json<ApiResponse<DeviceListResponse[]>>(
      {
        success: true,
        data: devicesWithAvailability,
        metadata: {
          correlation_id: context.correlation_id!,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration_ms: duration }, 'Unexpected error fetching devices');

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        metadata: {
          correlation_id: context.correlation_id!,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

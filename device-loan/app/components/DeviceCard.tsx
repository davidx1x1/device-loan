'use client';

import { DeviceListResponse } from '@/lib/types/api';

interface DeviceCardProps {
  device: DeviceListResponse;
  onReserve?: (deviceModelId: string) => void;
  onSubscribe?: (deviceModelId: string) => void;
  isAuthenticated?: boolean;
  isReserving?: boolean;
}

export default function DeviceCard({
  device,
  onReserve,
  onSubscribe,
  isAuthenticated,
  isReserving,
}: DeviceCardProps) {
  const isAvailable = device.available_count > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {device.image_url && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700">
          <img
            src={device.image_url}
            alt={`${device.brand} ${device.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {device.brand} {device.model}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {device.category}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isAvailable
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {device.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {device.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-600 dark:text-gray-400">
            Available: <strong className="text-gray-900 dark:text-white">{device.available_count}</strong> /{' '}
            {device.total_count}
          </span>
        </div>

        {isAuthenticated && (
          <div className="flex gap-2">
            {isAvailable ? (
              <button
                onClick={() => onReserve?.(device.id)}
                disabled={isReserving}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isReserving ? 'Reserving...' : 'Reserve Now'}
              </button>
            ) : (
              <button
                onClick={() => onSubscribe?.(device.id)}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Join Waitlist
              </button>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <button
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
            disabled
          >
            Sign in to reserve
          </button>
        )}
      </div>
    </div>
  );
}

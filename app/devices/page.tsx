'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import DeviceCard from '../components/DeviceCard';
import { DeviceListResponse, ApiResponse } from '@/lib/types/api';
import type { User } from '@supabase/supabase-js';

export default function DevicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices');
      const data: ApiResponse<DeviceListResponse[]> = await response.json();

      if (data.success && data.data) {
        setDevices(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch devices');
      }
    } catch (err) {
      setError('An error occurred while fetching devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (deviceModelId: string) => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    setReservingId(deviceModelId);
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_model_id: deviceModelId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        alert('Device reserved successfully!');
        // Refresh devices to update availability
        fetchDevices();
        // Optionally redirect to reservations page
        window.location.href = '/reservations';
      } else {
        alert(data.error?.message || 'Failed to reserve device');
      }
    } catch (err) {
      alert('An error occurred while reserving the device');
      console.error(err);
    } finally {
      setReservingId(null);
    }
  };

  const handleSubscribe = async (deviceModelId: string) => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_model_id: deviceModelId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        alert('Successfully joined waitlist! You will be notified when this device becomes available.');
      } else {
        alert(data.error?.message || 'Failed to join waitlist');
      }
    } catch (err) {
      alert('An error occurred while joining the waitlist');
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDevices}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Available Devices
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse and reserve devices for your studies
            </p>
          </div>
          <div className="flex gap-4">
            {user ? (
              <>
                <a
                  href="/reservations"
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  My Reservations
                </a>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <a
                href="/signin"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Sign In
              </a>
            )}
          </div>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No devices available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onReserve={handleReserve}
                onSubscribe={handleSubscribe}
                isAuthenticated={!!user}
                isReserving={reservingId === device.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

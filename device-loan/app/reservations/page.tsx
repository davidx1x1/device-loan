'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import { useRouter } from 'next/navigation';
import LoanCard from '../components/LoanCard';
import { ApiResponse } from '@/lib/types/api';
import type { User } from '@supabase/supabase-js';

interface Loan {
  id: string;
  status: string;
  reserved_at: string;
  collected_at?: string;
  returned_at?: string;
  due_date: string;
  device: {
    serial_number: string;
    device_model: {
      brand: string;
      model: string;
      category: string;
      image_url?: string;
    };
  };
}

export default function ReservationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
      if (!user) {
        router.push('/signin');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserLoading(false);
      if (!session?.user) {
        router.push('/signin');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reservations');
      const data: ApiResponse<Loan[]> = await response.json();

      if (data.success && data.data) {
        setLoans(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch reservations');
      }
    } catch (err) {
      setError('An error occurred while fetching reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reservations...</p>
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
            onClick={fetchReservations}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeLoans = loans.filter((loan) =>
    ['reserved', 'collected'].includes(loan.status)
  );
  const pastLoans = loans.filter((loan) =>
    ['returned', 'cancelled'].includes(loan.status)
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Reservations
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View your current and past device loans
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="/devices"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Browse Devices
            </a>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Active Loans */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Active Loans
          </h2>
          {activeLoans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any active loans.
              </p>
              <a
                href="/devices"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Reserve a Device
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan as any} />
              ))}
            </div>
          )}
        </div>

        {/* Past Loans */}
        {pastLoans.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Past Loans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

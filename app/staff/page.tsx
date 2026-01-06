'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase-client';
import { useRouter } from 'next/navigation';
import { ApiResponse } from '@/lib/types/api';
import type { User } from '@supabase/supabase-js';

interface Loan {
  id: string;
  status: string;
  reserved_at: string;
  collected_at?: string;
  due_date: string;
  user: {
    name: string;
    email: string;
  };
  device: {
    serial_number: string;
    device_model: {
      brand: string;
      model: string;
    };
  };
}

export default function StaffDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'reserved' | 'collected'>('all');

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
      // In a real app, check if user has staff role
      fetchAllLoans();
    }
  }, [user]);

  const fetchAllLoans = async () => {
    try {
      setLoading(true);
      // This would need a new API endpoint for staff to fetch all loans
      // For now, we'll use a mock implementation
      setError('Staff API endpoint not yet implemented. This is a demonstration UI.');
      setLoading(false);
    } catch (err) {
      setError('An error occurred while fetching loans');
      console.error(err);
      setLoading(false);
    }
  };

  const handleCollect = async (loanId: string) => {
    if (!confirm('Mark this device as collected?')) return;

    setActionLoading(loanId);
    try {
      const response = await fetch('/api/staff/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loan_id: loanId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        alert('Device marked as collected!');
        fetchAllLoans();
      } else {
        alert(data.error?.message || 'Failed to mark device as collected');
      }
    } catch (err) {
      alert('An error occurred');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (loanId: string) => {
    if (!confirm('Mark this device as returned?')) return;

    setActionLoading(loanId);
    try {
      const response = await fetch('/api/staff/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loan_id: loanId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        alert('Device marked as returned!');
        fetchAllLoans();
      } else {
        alert(data.error?.message || 'Failed to mark device as returned');
      }
    } catch (err) {
      alert('An error occurred');
      console.error(err);
    } finally {
      setActionLoading(null);
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredLoans =
    filter === 'all'
      ? loans
      : loans.filter((loan) => loan.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Staff Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage device collections and returns
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="/devices"
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
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

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            All Loans
          </button>
          <button
            onClick={() => setFilter('reserved')}
            className={`px-4 py-2 rounded-md ${
              filter === 'reserved'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Reserved
          </button>
          <button
            onClick={() => setFilter('collected')}
            className={`px-4 py-2 rounded-md ${
              filter === 'collected'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Collected
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {/* Loans Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {loan.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {loan.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {loan.device.device_model.brand}{' '}
                          {loan.device.device_model.model}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          SN: {loan.device.serial_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(loan.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {loan.status === 'reserved' && (
                        <button
                          onClick={() => handleCollect(loan.id)}
                          disabled={actionLoading === loan.id}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        >
                          Mark Collected
                        </button>
                      )}
                      {loan.status === 'collected' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={actionLoading === loan.id}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

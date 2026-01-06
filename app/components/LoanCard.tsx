'use client';

import { LoanStatus } from '@/lib/types/database';

interface Loan {
  id: string;
  status: LoanStatus;
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

interface LoanCardProps {
  loan: Loan;
}

export default function LoanCard({ loan }: LoanCardProps) {
  const statusColors = {
    reserved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    collected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const isOverdue =
    loan.status === 'collected' && new Date(loan.due_date) < new Date();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {loan.device.device_model.brand} {loan.device.device_model.model}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            SN: {loan.device.serial_number}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[loan.status]
          }`}
        >
          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Reserved:</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {new Date(loan.reserved_at).toLocaleDateString()}
          </span>
        </div>

        {loan.collected_at && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Collected:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {new Date(loan.collected_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {loan.status === 'collected' && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
            <span
              className={`font-medium ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {new Date(loan.due_date).toLocaleDateString()}
              {isOverdue && ' (Overdue!)'}
            </span>
          </div>
        )}

        {loan.returned_at && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Returned:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {new Date(loan.returned_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {isOverdue && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            This device is overdue. Please return it as soon as possible.
          </p>
        </div>
      )}
    </div>
  );
}

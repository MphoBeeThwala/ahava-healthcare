'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { visitsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Visit {
  id: string;
  status: string;
  scheduledStart: string;
  actualStart?: string;
  actualEnd?: string;
  booking: {
    patient: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  nurse?: {
    firstName: string;
    lastName: string;
  };
  doctor?: {
    firstName: string;
    lastName: string;
  };
  _count: {
    messages: number;
    payments: number;
  };
}

export default function VisitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchVisits();
  }, [filters]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: filters.limit,
        offset: filters.offset,
      };

      if (filters.status) params.status = filters.status;

      const response = await visitsAPI.list(params);
      
      if (response.success) {
        setVisits(response.visits);
        setTotal(response.pagination.total);
      }
    } catch (error: any) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Ahava Healthcare</h1>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Visit Management</h2>
          <p className="text-gray-600">Monitor and manage all healthcare visits</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, offset: 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EN_ROUTE">En Route</option>
                <option value="ARRIVED">Arrived</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end col-span-2">
              <button
                onClick={fetchVisits}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Total Visits Found</p>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
        </div>

        {/* Visits List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading visits...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-600">No visits found</p>
            </div>
          ) : (
            visits.map((visit) => (
              <div
                key={visit.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/visits/${visit.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(visit.status)}`}>
                      {visit.status.replace('_', ' ')}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {visit.booking.patient.firstName} {visit.booking.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{visit.booking.patient.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(visit.scheduledStart), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(visit.scheduledStart), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nurse</p>
                    <p className="font-medium text-gray-900">
                      {visit.nurse ? `${visit.nurse.firstName} ${visit.nurse.lastName}` : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Doctor</p>
                    <p className="font-medium text-gray-900">
                      {visit.doctor ? `${visit.doctor.firstName} ${visit.doctor.lastName}` : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Messages</p>
                    <p className="font-medium text-gray-900">{visit._count.messages}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payments</p>
                    <p className="font-medium text-gray-900">{visit._count.payments}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > filters.limit && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
              disabled={filters.offset === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
              Page {Math.floor(filters.offset / filters.limit) + 1}
            </span>
            <button
              onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
              disabled={filters.offset + filters.limit >= total}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800';
    case 'EN_ROUTE':
      return 'bg-yellow-100 text-yellow-800';
    case 'ARRIVED':
      return 'bg-orange-100 text-orange-800';
    case 'IN_PROGRESS':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}



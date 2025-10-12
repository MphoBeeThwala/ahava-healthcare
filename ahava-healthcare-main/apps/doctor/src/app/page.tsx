'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { visitsAPI, authAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.data.user.role !== 'DOCTOR') {
        router.push('/login');
        return;
      }
      setUser(response.data.user);
      fetchVisits();
    } catch {
      router.push('/login');
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await visitsAPI.list({ limit: 10 });
      setVisits(response.data.visits || []);
    } catch (error) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Ahava Healthcare</h1>
            <p className="text-sm text-gray-600">Doctor Portal</p>
          </div>
          <button
            onClick={async () => {
              await authAPI.logout();
              router.push('/login');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">Welcome, Dr. {user.firstName}! 👨‍⚕️</h2>
        <p className="text-gray-600 mb-8">Your assigned visits for oversight</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-600">No visits assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/visits/${visit.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {visit.booking?.patient?.firstName} {visit.booking?.patient?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{visit.booking?.patient?.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(visit.status)}`}>
                    {visit.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nurse</p>
                    <p className="font-medium">{visit.nurse ? `${visit.nurse.firstName} ${visit.nurse.lastName}` : 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Scheduled</p>
                    <p className="font-medium">{new Date(visit.scheduledStart).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Messages</p>
                    <p className="font-medium">{visit._count?.messages || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: any = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}



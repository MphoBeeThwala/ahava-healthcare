'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, visitsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function NurseDashboard() {
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
      setUser(response.data.user);
      fetchVisits();
    } catch {
      router.push('/login');
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await visitsAPI.list();
      setVisits(response.data.visits || []);
    } catch (error) {
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (visitId: string, status: string) => {
    try {
      await visitsAPI.updateStatus(visitId, status);
      toast.success('Status updated!');
      fetchVisits();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (!user) return null;

  const todayVisits = visits.filter((v) => {
    const visitDate = new Date(v.scheduledStart);
    const today = new Date();
    return visitDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Ahava Healthcare</h1>
            <p className="text-sm text-gray-600">Nurse App</p>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">Hello, {user.firstName}! 👩‍⚕️</h2>
        <p className="text-gray-700 mb-8">Here are your visits for today</p>

        <div className="mb-6 bg-primary-600 text-white rounded-2xl p-6">
          <p className="text-sm opacity-90 mb-1">Today's Visits</p>
          <p className="text-4xl font-bold">{todayVisits.length}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : todayVisits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-600">No visits scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayVisits.map((visit) => (
              <div key={visit.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {visit.booking?.patient?.firstName} {visit.booking?.patient?.lastName}
                    </p>
                    <p className="text-gray-600">{new Date(visit.scheduledStart).toLocaleTimeString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {visit.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  {visit.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusUpdate(visit.id, 'EN_ROUTE')}
                      className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Start Journey
                    </button>
                  )}
                  {visit.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => handleStatusUpdate(visit.id, 'ARRIVED')}
                      className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Mark Arrived
                    </button>
                  )}
                  {visit.status === 'ARRIVED' && (
                    <button
                      onClick={() => handleStatusUpdate(visit.id, 'IN_PROGRESS')}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Start Visit
                    </button>
                  )}
                  {visit.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => router.push(`/visits/${visit.id}/report`)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete & Report
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/visits/${visit.id}`)}
                    className="px-6 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {visits.length > todayVisits.length && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Upcoming Visits</h3>
            <div className="space-y-3">
              {visits
                .filter((v) => new Date(v.scheduledStart) > new Date() && !todayVisits.includes(v))
                .slice(0, 5)
                .map((visit) => (
                  <div key={visit.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="font-medium">{visit.booking?.patient?.firstName} {visit.booking?.patient?.lastName}</p>
                    <p className="text-sm text-gray-600">{new Date(visit.scheduledStart).toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



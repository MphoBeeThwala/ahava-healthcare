'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, visitsAPI, bookingsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function PatientDashboard() {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-600">Ahava Healthcare</h1>
            <p className="text-sm text-gray-600">Patient Portal</p>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user.firstName}! 👋</h2>
          <p className="text-gray-700">Manage your home healthcare visits</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/book')}
            className="bg-primary-600 hover:bg-primary-700 text-white p-8 rounded-2xl shadow-lg text-left transition transform hover:scale-105"
          >
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-2xl font-bold mb-2">Book a Visit</h3>
            <p className="opacity-90">Schedule a home healthcare visit</p>
          </button>

          <button
            onClick={() => router.push('/visits')}
            className="bg-secondary-600 hover:bg-secondary-700 text-white p-8 rounded-2xl shadow-lg text-left transition transform hover:scale-105"
          >
            <div className="text-5xl mb-4">🏥</div>
            <h3 className="text-2xl font-bold mb-2">My Visits</h3>
            <p className="opacity-90">View your visit history</p>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Recent Visits</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : visits.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No visits yet. Book your first visit!</p>
          ) : (
            <div className="space-y-3">
              {visits.slice(0, 5).map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => router.push(`/visits/${visit.id}`)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{new Date(visit.scheduledStart).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">
                        Nurse: {visit.nurse ? `${visit.nurse.firstName} ${visit.nurse.lastName}` : 'Pending'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: any = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    EN_ROUTE: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}



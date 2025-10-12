'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { visitsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function VisitsPage() {
  const router = useRouter();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/')} className="text-primary-600 hover:underline">
            ← Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">My Visits 🏥</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-600 mb-4">No visits yet</p>
            <button
              onClick={() => router.push('/book')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Book Your First Visit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                onClick={() => router.push(`/visits/${visit.id}`)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md cursor-pointer transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {new Date(visit.scheduledStart).toLocaleDateString('en-ZA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-600">{new Date(visit.scheduledStart).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(visit.status)}`}>
                    {visit.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nurse</p>
                    <p className="font-medium">{visit.nurse ? `${visit.nurse.firstName} ${visit.nurse.lastName}` : 'Pending assignment'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Messages</p>
                    <p className="font-medium">{visit._count?.messages || 0} messages</p>
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
    EN_ROUTE: 'bg-yellow-100 text-yellow-800',
    ARRIVED: 'bg-orange-100 text-orange-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}



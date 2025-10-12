'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Stats {
  users: {
    total: number;
    patients: number;
    nurses: number;
    doctors: number;
  };
  bookings: {
    total: number;
  };
  visits: {
    total: number;
    active: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getStats();
        if (response.success) {
          setStats(response.stats);
        }
      } catch (error: any) {
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Access Denied</h2>
          <p className="text-red-600">You must be an administrator to access this portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Ahava Healthcare</h1>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={() => {
                  useAuthStore.getState().logout();
                  router.push('/login');
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with Ahava Healthcare today.</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <StatsCard
              title="Total Users"
              value={stats.users.total}
              icon="👥"
              color="bg-blue-500"
              href="/users"
            />

            {/* Patients */}
            <StatsCard
              title="Patients"
              value={stats.users.patients}
              icon="🏥"
              color="bg-green-500"
              href="/users?role=PATIENT"
            />

            {/* Nurses */}
            <StatsCard
              title="Nurses"
              value={stats.users.nurses}
              icon="👩‍⚕️"
              color="bg-purple-500"
              href="/users?role=NURSE"
            />

            {/* Doctors */}
            <StatsCard
              title="Doctors"
              value={stats.users.doctors}
              icon="👨‍⚕️"
              color="bg-indigo-500"
              href="/users?role=DOCTOR"
            />

            {/* Total Bookings */}
            <StatsCard
              title="Total Bookings"
              value={stats.bookings.total}
              icon="📅"
              color="bg-yellow-500"
              href="/bookings"
            />

            {/* Total Visits */}
            <StatsCard
              title="Total Visits"
              value={stats.visits.total}
              icon="🏠"
              color="bg-orange-500"
              href="/visits"
            />

            {/* Active Visits */}
            <StatsCard
              title="Active Visits"
              value={stats.visits.active}
              icon="🔄"
              color="bg-teal-500"
              href="/visits?status=IN_PROGRESS"
            />

            {/* Completed Visits */}
            <StatsCard
              title="Completed"
              value={stats.visits.total - stats.visits.active}
              icon="✅"
              color="bg-green-600"
              href="/visits?status=COMPLETED"
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickActionCard
              title="Manage Users"
              description="View and manage all system users"
              icon="👥"
              href="/users"
            />
            <QuickActionCard
              title="View Visits"
              description="Monitor active and completed visits"
              icon="🏠"
              href="/visits"
            />
            <QuickActionCard
              title="Payments"
              description="Track and manage payments"
              icon="💳"
              href="/payments"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  href?: string;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm p-6 transition-all ${
        href ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(href)}
      className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-all hover:scale-105"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}



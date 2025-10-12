'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function SubmitReportPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<any>(null);

  useEffect(() => {
    fetchVisit();
  }, []);

  const fetchVisit = async () => {
    try {
      const response = await visitsAPI.getById(params.id as string);
      setVisit(response.data.visit);
    } catch (error) {
      toast.error('Failed to load visit');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit report
      await visitsAPI.addReport(params.id as string, report);
      
      // Mark as completed
      await visitsAPI.updateStatus(params.id as string, 'COMPLETED');
      
      toast.success('Report submitted and visit completed!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/')} className="text-primary-600 hover:underline">
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">Submit Visit Report 📝</h2>
        <p className="text-gray-600 mb-8">Document the care provided during this visit</p>

        {visit && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="font-medium">Patient: {visit.booking?.patient?.firstName} {visit.booking?.patient?.lastName}</p>
            <p className="text-sm text-gray-600">{new Date(visit.scheduledStart).toLocaleString()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nurse Report</label>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Document patient condition, care provided, vitals, medications administered, recommendations, etc."
            />
            <p className="text-sm text-gray-500 mt-2">Minimum 10 characters required</p>
          </div>

          <button
            type="submit"
            disabled={loading || report.length < 10}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report & Complete Visit'}
          </button>
        </form>
      </main>
    </div>
  );
}



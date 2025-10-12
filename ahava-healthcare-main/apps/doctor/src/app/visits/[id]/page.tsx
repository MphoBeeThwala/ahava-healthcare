'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function VisitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [visit, setVisit] = useState<any>(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisit();
  }, []);

  const fetchVisit = async () => {
    try {
      const response = await visitsAPI.getById(params.id as string);
      setVisit(response.data.visit);
    } catch (error) {
      toast.error('Failed to load visit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await visitsAPI.addReview(params.id as string, { doctorReview: review, doctorRating: rating });
      toast.success('Review submitted successfully!');
      fetchVisit();
      setReview('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!visit) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => router.push('/')} className="text-primary-600 hover:underline">← Back to Dashboard</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Visit Details</h2>

        <div className="bg-white rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Patient Information</h3>
          <p><strong>Name:</strong> {visit.booking.patient.firstName} {visit.booking.patient.lastName}</p>
          <p><strong>Email:</strong> {visit.booking.patient.email}</p>
          <p className="mt-4"><strong>Status:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{visit.status}</span></p>
        </div>

        {visit.nurseReport && (
          <div className="bg-white rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Nurse Report</h3>
            <p className="whitespace-pre-wrap">{visit.nurseReport}</p>
          </div>
        )}

        {!visit.doctorReview && (
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-4">Submit Your Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Review</label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Provide your medical review..."
                />
              </div>
              <button type="submit" className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700">
                Submit Review
              </button>
            </form>
          </div>
        )}

        {visit.doctorReview && (
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold mb-2 text-green-800">Your Review (Submitted)</h3>
            <p className="mb-2"><strong>Rating:</strong> {visit.doctorRating}/5 ⭐</p>
            <p className="whitespace-pre-wrap">{visit.doctorReview}</p>
          </div>
        )}
      </main>
    </div>
  );
}



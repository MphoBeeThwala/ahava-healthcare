'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsAPI, paymentsAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function BookVisitPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    scheduledDate: '',
    estimatedDuration: 60,
    address: '',
    paymentMethod: 'CARD',
    amountInCents: 50000, // R500
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple encryption (in production, use proper encryption)
      const encryptedAddress = btoa(formData.address);

      const bookingData = {
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        estimatedDuration: formData.estimatedDuration,
        encryptedAddress,
        paymentMethod: formData.paymentMethod,
        amountInCents: formData.amountInCents,
      };

      const response = await bookingsAPI.create(bookingData);
      
      if (response.data.booking) {
        toast.success('Booking created! Redirecting to payment...');
        
        // Initialize payment
        const paymentResponse = await paymentsAPI.initialize(response.data.booking.id);
        
        if (paymentResponse.data.data.authorizationUrl) {
          // Redirect to Paystack
          window.location.href = paymentResponse.data.data.authorizationUrl;
        } else {
          router.push('/visits');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create booking');
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Book a Home Visit 📅</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Estimated Duration</label>
            <select
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="CARD">Credit/Debit Card</option>
              <option value="INSURANCE">Medical Insurance</option>
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Estimated Cost:</strong> R{(formData.amountInCents / 100).toFixed(2)}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Creating booking...' : 'Book & Pay'}
          </button>
        </form>
      </main>
    </div>
  );
}



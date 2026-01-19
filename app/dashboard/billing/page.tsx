'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

export default function BillingPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Data State
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) {
          router.push('/login');
          return;
        }

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`,
          { expand: 'organization', requestKey: null }
        );

        if (memberRes && memberRes.organization) {
          const org = memberRes.expand?.organization as any;
          setOrgId(org.id);
          setOrgName(org.name);
          setCredits(org.job_credits || 0);
        } else {
          setMessage({ text: 'No organization found.', type: 'error' });
        }
      } catch (err) {
        console.error("Error loading billing data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBilling();
  }, [router]);

  const handleBuyCredits = async (amount: number) => {
    if (!orgId) return;
    
    setUpdating(true);
    setMessage({ text: '', type: '' });

    try {
      const updatedOrg = await pb.collection('organizations').update(orgId, {
        'job_credits+': amount // Atomically increment the credits
      });
      
      setCredits(updatedOrg.job_credits);
      setMessage({ text: `Successfully added ${amount} credits!`, type: 'success' });
    } catch (err: any) {
      console.error("Credit purchase error:", err);
      setMessage({ text: err.message || 'Failed to add credits.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading billing...</div>;
  if (!orgId) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
        Could not load organization.
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your job credits and subscription.</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Current Credits */}
        <div className="md:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Current Balance</h2>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-5xl font-bold text-gray-900">{credits}</span>
              <span className="text-gray-500 font-medium">Job Credits</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Credits are used to post new jobs.</p>
          </div>
        </div>

        {/* Right Side: Purchase Options */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Purchase More Credits</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Need to post more jobs? Choose a credit pack below to top up your account instantly.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                
                {/* Option 1: 5 Credits */}
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center text-center">
                  <span className="text-3xl">🪙</span>
                  <h3 className="font-bold text-gray-900 mt-2">5 Credits</h3>
                  <p className="text-lg font-semibold text-blue-600 mt-1">.00</p>
                  <button 
                    onClick={() => handleBuyCredits(5)}
                    disabled={updating}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
                  >
                    {updating ? 'Processing...' : 'Purchase'}
                  </button>
                </div>

                {/* Option 2: 20 Credits */}
                <div className="border border-blue-600 rounded-lg p-4 flex flex-col items-center text-center relative bg-blue-50/50">
                  <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Best Value</span>
                  <span className="text-3xl">🪙🪙🪙</span>
                  <h3 className="font-bold text-gray-900 mt-2">20 Credits</h3>
                  <p className="text-lg font-semibold text-blue-600 mt-1">.00</p>
                  <button 
                    onClick={() => handleBuyCredits(20)}
                    disabled={updating}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
                  >
                    {updating ? 'Processing...' : 'Purchase'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// /app/dashboard/billing/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord } from '@/types';

interface Plan {
  id: string;
  plan: string;
  cost: number;
  credit: number;
  price_id: string;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [credits, setCredits] = useState<number>(0);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    // Check for success/cancel from Stripe redirect
    if (searchParams.get('success') === 'true') {
      setMessage({ text: 'Payment successful! Credits have been added.', type: 'success' });
    } else if (searchParams.get('canceled') === 'true') {
      setMessage({ text: 'Payment was canceled.', type: 'error' });
    }
  }, [searchParams]);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');

        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`,
          { expand: 'organization', requestKey: null }
        );

        if (memberRes && memberRes.organization) {
          const org = memberRes.expand?.organization as any;
          setOrgId(org.id);
          setOrgName(org.name || '');
          setCredits(org.job_credits || 0);
        } else {
          setMessage({ text: 'No organization found.', type: 'error' });
        }

        // Load plans
        const plansRes = await pb.collection('plans').getFullList<Plan>({
          sort: 'cost',
          requestKey: null,
        });
        setPlans(plansRes);

      } catch (err) {
        console.error("Error loading billing data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBilling();
  }, [router]);

  const handleBuyCredits = async (plan: Plan) => {
    if (!orgId) return;
    
    setProcessing(plan.id);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          priceId: plan.price_id,
          userEmail,
          orgName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe
      window.location.href = data.url;

    } catch (err: any) {
      console.error("Checkout error:", err);
      setMessage({ text: err.message || 'Failed to start checkout.', type: 'error' });
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">
        Loading billing...
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          Could not load organization.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your job credits.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
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

        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Purchase More Credits</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Need to post more jobs? Choose a credit pack below.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {plans.map((plan, index) => (
                  <div 
                    key={plan.id}
                    className={`border rounded-lg p-4 flex flex-col items-center text-center relative ${
                      index === plans.length - 1 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-gray-200'
                    }`}
                  >
                    {index === plans.length - 1 && (
                      <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                        Best Value
                      </span>
                    )}
                    <span className="text-3xl">{'🪙'.repeat(Math.min(plan.credit, 3))}</span>
                    <h3 className="font-bold text-gray-900 mt-2">{plan.plan}</h3>
                    <p className="text-sm text-gray-500">{plan.credit} Credits</p>
                    <p className="text-lg font-semibold text-blue-600 mt-1">
                      ${(plan.cost / 100).toFixed(2)}
                    </p>
                    <button 
                      onClick={() => handleBuyCredits(plan)}
                      disabled={processing !== null}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
                    >
                      {processing === plan.id ? 'Redirecting...' : 'Purchase'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
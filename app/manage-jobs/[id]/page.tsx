'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { UserRecord, DepartmentRecord, JobRecord } from '@/types';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [deptOptions, setDeptOptions] = useState<DepartmentRecord[]>([]);

  // Form State
  const [role, setRole] = useState('');
  const [type, setType] = useState('Full Time');
  const [status, setStatus] = useState('Open'); // New field for Edit
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentType, setPaymentType] = useState('Monthly');
  const [scope, setScope] = useState('Listing Only');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [expires, setExpires] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.push('/login');
          return;
        }

        const user = pb.authStore.model as unknown as UserRecord;
        if (user?.is_super_admin) setIsSuperAdmin(true);

        // 1. Fetch Departments
        const depts = await pb.collection('departments').getFullList({ sort: 'department' });
        setDeptOptions(depts as unknown as DepartmentRecord[]);

        // 2. Fetch User's Organization to verify ownership
        const memberRes = await pb.collection('org_members').getFirstListItem(
          `user = "${user.id}"`
        );
        const userOrgId = memberRes?.organization;

        // 3. Fetch The Job
        const job = await pb.collection('jobs').getOne(jobId) as unknown as JobRecord;

        // Security Check: Does job belong to user's org?
        if (job.organization !== userOrgId && !user.is_super_admin) {
          setError("You do not have permission to edit this job.");
          setLoading(false);
          return;
        }

        // 4. Populate Form
        setRole(job.role);
        setType(job.type || 'Full Time');
        setStatus(job.stage || 'Open');
        setSalary(job.salary ? String(job.salary) : '');
        setCurrency(job.currency || 'USD');
        setPaymentType(job.paymentType || 'Monthly');
        setScope(job.scope || 'Listing Only');
        setDescription(job.description || '');
        setBenefits(job.benefits || '');
        
        // Handle Date (Convert ISO to YYYY-MM-DD for input)
        if (job.expires) {
          setExpires(new Date(job.expires).toISOString().split('T')[0]);
        }

        // Handle Departments (Relation field comes as array of IDs)
        if (Array.isArray(job.department)) {
          setSelectedDepts(job.department);
        }

      } catch (err: any) {
        console.error("Error loading job:", err);
        setError("Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [jobId, router]);

  const toggleDept = (id: string) => {
    setSelectedDepts(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await pb.collection('jobs').update(jobId, {
        role,
        type,
        stage: status,
        salary: salary ? parseInt(salary) : 0,
        currency,
        paymentType,
        scope, 
        description,
        benefits,
        department: selectedDepts,
        expires: expires ? new Date(expires).toISOString() : '',
      });

      router.push('/manage-jobs');
    } catch (err: any) {
      console.error('Update Error:', err);
      setError(err.message || 'Failed to update job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500">Loading job details...</div>;

  // Styles
  const inputClass = "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const selectWrapperClass = "relative";
  const chevronIcon = (
    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/manage-jobs" className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center">
          &larr; Back to Manage Jobs
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Job Listing</h1>
            <p className="text-gray-500 mt-1">Update details for <span className="font-semibold text-gray-800">{role}</span></p>
          </div>
          {/* Status Badge Preview */}
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
            status === 'Open' ? 'bg-green-50 text-green-700 border-green-200' :
            status === 'Filled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
            {status}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-bold text-sm mb-1">Error:</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* 1. Status & Core Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Status & Role</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>Role Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Job Status</label>
                  <div className={selectWrapperClass}>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} appearance-none`}>
                      <option value="Open">Open (Visible)</option>
                      <option value="Draft">Draft (Hidden)</option>
                      <option value="Filled">Filled</option>
                      <option value="Archived">Archived</option>
                    </select>
                    {chevronIcon}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Job Type</label>
                  <div className={selectWrapperClass}>
                    <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} appearance-none`}>
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                    {chevronIcon}
                  </div>
                </div>
                {/* Expiration */}
                <div>
                  <label className={labelClass}>Expiration Date</label>
                  <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* 2. Departments */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Departments</h3>
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {deptOptions.map((dept) => (
                    <label key={dept.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-200">
                      <input 
                        type="checkbox" 
                        checked={selectedDepts.includes(dept.id)}
                        onChange={() => toggleDept(dept.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                      />
                      <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Financials */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Salary</label>
                  <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <div className={selectWrapperClass}>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputClass} appearance-none`}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    {chevronIcon}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Frequency</label>
                  <div className={selectWrapperClass}>
                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={`${inputClass} appearance-none`}>
                      <option value="Monthly">Monthly</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Annually">Annually</option>
                    </select>
                    {chevronIcon}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Details</h3>
              <div>
                <label className={labelClass}>Job Description</label>
                <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass}></textarea>
              </div>
              <div>
                <label className={labelClass}>Benefits</label>
                <textarea rows={4} value={benefits} onChange={(e) => setBenefits(e.target.value)} className={inputClass}></textarea>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex items-center justify-end space-x-4 border-t border-gray-100">
              <Link href="/manage-jobs" className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

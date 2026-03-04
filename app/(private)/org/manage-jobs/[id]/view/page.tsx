'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import pb from '@/lib/pocketbase';
import { htmlToPlainText } from '@/lib/sanitize-html';
import { DepartmentRecord, JobRecord, UserRecord } from '@/types';
import { canManageJobs, getDefaultOrgPath } from '@/lib/access';
import { getCurrentOrgMembership } from '@/lib/org-membership';
import { hydrateJobs } from '@/lib/pb-hydration';
import SwipeTransition from '../../_components/SwipeTransition';

export default function ViewJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.replace('/login');
          return;
        }

        const user = pb.authStore.model as unknown as UserRecord;
        const memberRes = await getCurrentOrgMembership(user.id);

        if (memberRes?.role && !canManageJobs(memberRes.role) && !user.is_super_admin) {
          router.replace(getDefaultOrgPath(memberRes.role));
          return;
        }

        const jobRes = await pb.collection('jobs').getOne(jobId, {
          requestKey: null,
        });
        const [hydratedJob] = await hydrateJobs([jobRes as unknown as JobRecord]);

        if (!hydratedJob) {
          setError('Job not found.');
          return;
        }

        if (hydratedJob.organization !== memberRes?.organization && !user.is_super_admin) {
          setError('You do not have permission to view this job.');
          return;
        }

        setJob(hydratedJob);
      } catch (err) {
        console.error('Error loading job:', err);
        setError('Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [jobId, router]);

  if (loading) {
    return (
      <SwipeTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500">Loading job details...</div>
      </SwipeTransition>
    );
  }

  if (!job) {
    return (
      <SwipeTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-gray-500">{error || 'Job not found.'}</div>
      </SwipeTransition>
    );
  }

  const descriptionText = htmlToPlainText(job.description);
  const benefitsText = htmlToPlainText(job.benefits);
  const departments = job.expand?.department || [];

  const infoItems = [
    { label: 'Job Type', value: job.type || 'Not set' },
    { label: 'Status', value: job.stage },
    { label: 'Currency', value: job.currency || 'Not set' },
    { label: 'Payment Type', value: job.paymentType || 'Not set' },
    { label: 'Scope', value: job.scope || 'Not set' },
    {
      label: 'Salary',
      value: job.salary ? `${job.currency || 'USD'} ${job.salary.toLocaleString()}` : 'Not set',
    },
    {
      label: 'Expires',
      value: job.expires ? new Date(job.expires).toLocaleDateString() : 'Not set',
    },
    {
      label: 'Posted',
      value: new Date(job.created).toLocaleDateString(),
    },
  ];

  const questions = [
    job.question_one,
    job.question_two,
    job.question_three,
    job.question_four,
    job.question_five,
  ].filter(Boolean);

  const statusTone =
    job.stage === 'Open'
      ? 'bg-green-50 text-green-700 border-green-200'
      : job.stage === 'Filled'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : job.stage === 'Draft'
          ? 'bg-gray-100 text-gray-700 border-gray-200'
          : 'bg-red-50 text-red-700 border-red-200';

  return (
    <SwipeTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-6">
          <Link href="/org/manage-jobs" className="text-sm text-gray-500 hover:text-brand-dark font-medium flex items-center">
            &larr; Back to Manage Jobs
          </Link>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-brand-green/10 bg-white p-8 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="text-brand-green font-bold tracking-[0.2em] uppercase text-xs">Hiring</span>
            <h1 className="mt-2 text-3xl font-bold text-brand-dark">{job.role}</h1>
            <p className="mt-1 text-gray-500">Preview the published details for this role.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusTone}`}>
                {job.stage}
              </span>
              {departments.map((department: DepartmentRecord) => (
                <span key={department.id} className="inline-flex items-center rounded-full border border-brand-green/10 bg-brand-green/5 px-3 py-1 text-sm font-medium text-brand-green">
                  {department.department}
                </span>
              ))}
            </div>
          </div>

          <Link
            href={`/org/manage-jobs/${job.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-green-800"
          >
            Edit Job
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-green/10 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-brand-dark">Role Overview</h2>
            <div className="mt-5 space-y-8">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">Description</h3>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {descriptionText || 'No description provided.'}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">Benefits</h3>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {benefitsText || 'No benefits provided.'}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">Screening Questions</h3>
                {questions.length > 0 ? (
                  <ol className="mt-3 space-y-3 text-sm text-gray-600">
                    {questions.map((question, index) => (
                      <li key={`${index}-${question}`} className="rounded-xl border border-brand-green/10 bg-brand-green/5 px-4 py-3">
                        <span className="font-semibold text-brand-dark">Question {index + 1}:</span> {question}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No screening questions added.</p>
                )}
              </section>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-green/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-dark">Job Snapshot</h2>
            <dl className="mt-5 space-y-4">
              {infoItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-brand-green/10 bg-brand-green/5 px-4 py-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-green">{item.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-brand-dark">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </SwipeTransition>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';
import { UserRecord, JobRecord, DepartmentRecord } from '@/types';
import { canManageJobs, getDefaultOrgPath } from '@/lib/access';
import { getCurrentOrgMembership } from '@/lib/org-membership';

const PER_PAGE = 10;
const STAGE_OPTIONS: JobRecord['stage'][] = ['Open', 'Draft', 'Filled', 'Archived'];
const TYPE_OPTIONS: Array<NonNullable<JobRecord['type']>> = ['Full Time', 'Part Time', 'Contract'];
const SORT_OPTIONS = [
  { label: 'Recently updated', value: '-updated' },
  { label: 'Oldest updated', value: 'updated' },
  { label: 'Newest created', value: '-created' },
  { label: 'Oldest created', value: 'created' },
] as const;
const DEFAULT_SORT = '-updated';

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildOrFilter(field: string, values: string[]): string {
  return values
    .map((value) => `${field} = "${escapeFilterValue(value)}"`)
    .join(' || ');
}

export default function ManageJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]['value']>(DEFAULT_SORT);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const user = pb.authStore.model as unknown as UserRecord;
        if (!user) {
          router.replace('/login');
          return;
        }

        const memberRes = await getCurrentOrgMembership(user.id);
        if (memberRes?.role && !canManageJobs(memberRes.role)) {
          router.replace(getDefaultOrgPath(memberRes.role));
          return;
        }

        const deptRes = await pb.collection('departments').getFullList({
          sort: 'department',
          requestKey: null,
        });
        setDepartments(deptRes as unknown as DepartmentRecord[]);

        if (memberRes?.organization) {
          setOrgId(memberRes.organization);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    if (!orgId) {
      return;
    }

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const constraints = [`organization = "${escapeFilterValue(orgId)}"`];

        if (searchTerm.trim()) {
          const query = escapeFilterValue(searchTerm.trim());
          constraints.push(`(role ~ "${query}" || description ~ "${query}")`);
        }

        if (selectedStages.length > 0) {
          constraints.push(`(${buildOrFilter('stage', selectedStages)})`);
        }

        if (selectedTypes.length > 0) {
          constraints.push(`(${buildOrFilter('type', selectedTypes)})`);
        }

        if (selectedDepartments.length > 0) {
          constraints.push(`(${buildOrFilter('department', selectedDepartments)})`);
        }

        const result = await pb.collection('jobs').getList(page, PER_PAGE, {
          filter: constraints.join(' && '),
          sort: sortBy,
          requestKey: null,
        });

        setJobs(result.items as unknown as JobRecord[]);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timeoutId);
  }, [orgId, page, searchTerm, selectedStages, selectedTypes, selectedDepartments, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedStages, selectedTypes, selectedDepartments, sortBy]);

  useEffect(() => {
    jobs.forEach((job) => {
      router.prefetch(`/org/manage-jobs/${job.id}/view`);
      router.prefetch(`/org/manage-jobs/${job.id}`);
    });
  }, [jobs, router]);

  const getStatusClass = (stage: JobRecord['stage']) => {
    if (stage === 'Open') return 'bg-green-100 text-green-800';
    if (stage === 'Draft') return 'bg-gray-100 text-gray-800';
    if (stage === 'Filled') return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const toggleSelection = (value: string, current: string[], setter: (value: string[] | ((prev: string[]) => string[])) => void) => {
    setter((prev) => (
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    ));
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedStages.length ||
    selectedTypes.length ||
    selectedDepartments.length ||
    sortBy !== DEFAULT_SORT
  );
  const activeFilterCount = selectedStages.length + selectedTypes.length + selectedDepartments.length;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStages([]);
    setSelectedTypes([]);
    setSelectedDepartments([]);
    setSortBy(DEFAULT_SORT);
    setPage(1);
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString();

  const renderFilterGroup = (
    label: string,
    options: Array<{ label: string; value: string }>,
    selected: string[],
    onToggle: (value: string) => void
  ) => (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading your jobs...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-brand-green font-bold tracking-[0.2em] uppercase text-xs">Hiring</span>
          <h1 className="mt-2 text-3xl font-bold text-brand-dark">Manage Jobs</h1>
          <p className="text-gray-500">View and edit your organization&apos;s job listings.</p>
        </div>
        <Link 
          href="/org/manage-jobs/new" 
          className="px-5 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-800 transition-colors shadow-sm text-center"
        >
          + Post New Job
        </Link>
      </div>

      {!!orgId && (
        <div className="rounded-2xl border border-brand-green/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="relative flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Search</label>
              <input
                type="text"
                placeholder="Search role or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green"
              />
              <svg className="absolute left-3 top-[46px] h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="w-full lg:w-64">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Sort by</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as (typeof SORT_OPTIONS)[number]['value'])}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-12 text-gray-900 outline-none transition-all focus:border-brand-green focus:ring-2 focus:ring-brand-green"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-brand-green/10 bg-brand-green/5 px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-brand-dark">Filters</p>
                <p className="text-xs text-gray-500">
                  {activeFilterCount > 0 ? `${activeFilterCount} selected` : 'Stage, type, department'}
                </p>
              </div>
              <svg className={`h-5 w-5 text-brand-green transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-5 rounded-xl border border-brand-green/10 bg-brand-green/5 p-4 md:grid-cols-3 md:gap-6">
                {renderFilterGroup(
                  'Stage',
                  STAGE_OPTIONS.map((option) => ({ label: option, value: option })),
                  selectedStages,
                  (value) => toggleSelection(value, selectedStages, setSelectedStages)
                )}
                {renderFilterGroup(
                  'Type',
                  TYPE_OPTIONS.map((option) => ({ label: option, value: option })),
                  selectedTypes,
                  (value) => toggleSelection(value, selectedTypes, setSelectedTypes)
                )}
                {renderFilterGroup(
                  'Department',
                  departments.map((department) => ({ label: department.department, value: department.id })),
                  selectedDepartments,
                  (value) => toggleSelection(value, selectedDepartments, setSelectedDepartments)
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-brand-green/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-brand-dark">{totalItems}</span>{' '}
              jobs{hasActiveFilters ? ' matching current filters' : ''}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {!orgId ? (
         <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-yellow-800">
           You do not appear to be part of an organization. Please contact support or create one.
         </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-brand-green/10 rounded-2xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-brand-dark">
            {hasActiveFilters ? 'No jobs match your current filters' : 'No jobs posted yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters ? 'Try adjusting your search, filters, or sort order.' : 'Get started by creating your first job listing.'}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="text-brand-green font-medium hover:text-green-800">
              Clear all filters &rarr;
            </button>
          ) : (
            <Link href="/org/manage-jobs/new" className="text-brand-green font-medium hover:text-green-800">
              Create a Job &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
        <div className="bg-white border border-brand-green/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="space-y-4 bg-brand-green/5 p-4 md:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="space-y-4 rounded-2xl border border-brand-green/15 bg-white p-5 shadow-sm transition-all hover:border-brand-green/30 hover:shadow-md"
              >
                <Link
                  href={`/org/manage-jobs/${job.id}/view`}
                  className="block space-y-4 focus:outline-none focus:ring-2 focus:ring-brand-green rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-brand-dark">{job.role}</h3>
                      <p className="mt-1 text-sm text-gray-500">{job.type}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(job.stage)}`}>
                      {job.stage}
                    </span>
                  </div>

                  <div className="rounded-xl border border-brand-green/10 bg-brand-green/5 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-green">Posted</p>
                    <p className="mt-1 text-sm font-medium text-brand-dark">
                      {formatDate(job.created)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-brand-green/10 bg-white px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Updated</p>
                    <p className="mt-1 text-sm font-medium text-brand-dark">
                      {formatDate(job.updated)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-green">
                      <span>View details</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <div className="flex justify-end">
                  <Link
                    href={`/org/manage-jobs/${job.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-green/5 border-b border-brand-green/10">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Role Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Updated</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Posted</th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-green/10">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-brand-green/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-dark">
                      <Link href={`/org/manage-jobs/${job.id}/view`} className="block -mx-6 -my-4 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                        {job.role}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <Link href={`/org/manage-jobs/${job.id}/view`} className="block -mx-6 -my-4 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                        {job.type}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/org/manage-jobs/${job.id}/view`} className="block -mx-6 -my-4 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(job.stage)}`}>
                          {job.stage}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <Link href={`/org/manage-jobs/${job.id}/view`} className="block -mx-6 -my-4 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                        {formatDate(job.updated)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <Link href={`/org/manage-jobs/${job.id}/view`} className="block -mx-6 -my-4 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                        {formatDate(job.created)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link 
                        href={`/org/manage-jobs/${job.id}/view`} 
                        className="text-gray-500 hover:text-brand-dark font-medium transition-colors"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/org/manage-jobs/${job.id}`} 
                        className="text-brand-green hover:text-green-800 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

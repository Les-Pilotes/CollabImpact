'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnrollmentStatus } from '@prisma/client';
import { markAttendance } from '../actions';

type EnrollmentItem = {
  id: string;
  status: EnrollmentStatus;
  user: {
    firstName: string;
    lastName: string;
  };
};

type Props = {
  enrollments: EnrollmentItem[];
};

export function EmargementList({ enrollments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<string, EnrollmentStatus>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function getStatus(e: EnrollmentItem): EnrollmentStatus {
    return optimistic[e.id] ?? e.status;
  }

  function handleToggle(e: EnrollmentItem, attended: boolean) {
    const newStatus = attended ? EnrollmentStatus.presente : EnrollmentStatus.absente;
    const previousStatus = getStatus(e);

    // Optimistic update
    setOptimistic((prev) => ({ ...prev, [e.id]: newStatus }));
    setLoadingId(e.id);

    startTransition(async () => {
      const res = await markAttendance(e.id, attended);
      if (!res.ok) {
        // Revert on error
        setOptimistic((prev) => ({ ...prev, [e.id]: previousStatus }));
      }
      setLoadingId(null);
      router.refresh();
    });
  }

  const presentes = enrollments.filter((e) => getStatus(e) === EnrollmentStatus.presente).length;

  return (
    <div className="space-y-3">
      {enrollments.map((e) => {
        const status = getStatus(e);
        const isPresente = status === EnrollmentStatus.presente;
        const isAbsente = status === EnrollmentStatus.absente;
        const isLoading = loadingId === e.id && isPending;

        return (
          <div
            key={e.id}
            className={`rounded-2xl border-2 p-4 transition-colors ${
              isPresente
                ? 'border-green-300 bg-green-50'
                : isAbsente
                  ? 'border-red-300 bg-red-50'
                  : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-zinc-900">
                  {e.user.firstName} {e.user.lastName}
                </p>
                {isPresente && (
                  <p className="text-sm font-medium text-green-600 mt-0.5">Présente</p>
                )}
                {isAbsente && (
                  <p className="text-sm font-medium text-red-600 mt-0.5">Absente</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(e, true)}
                  disabled={isLoading || isPresente}
                  aria-label="Marquer présente"
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40 ${
                    isPresente
                      ? 'bg-green-500 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  ✓
                </button>
                <button
                  onClick={() => handleToggle(e, false)}
                  disabled={isLoading || isAbsente}
                  aria-label="Marquer absente"
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-40 ${
                    isAbsente
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-red-100 hover:text-red-700'
                  }`}
                >
                  ✗
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer counter */}
      <div className="sticky bottom-4 bg-zinc-900 text-white rounded-2xl px-5 py-3 text-center font-semibold shadow-lg">
        {presentes} présente{presentes !== 1 ? 's' : ''} / {enrollments.length} total
      </div>
    </div>
  );
}

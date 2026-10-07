'use client';

import { useState } from 'react';
import { vendorApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

const WORKFLOW_STEPS = ['DRAFT', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'APPROVED'];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ACTION_REQUIRED', label: 'Action Required' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function StatusWorkflow({
  vendorId,
  currentStatus,
  onStatusChanged,
}: {
  vendorId: string;
  currentStatus: string;
  onStatusChanged: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    try {
      setUpdating(true);
      await vendorApi.updateStatus(vendorId, newStatus);
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      onStatusChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const currentStepIndex = WORKFLOW_STEPS.indexOf(currentStatus);
  const isRejected = currentStatus === 'REJECTED';

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-6 flex items-center">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = idx <= currentStepIndex && !isRejected;
          const isCurrent = step === currentStatus;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : isActive
                      ? 'border-blue-300 bg-blue-100 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isActive && !isCurrent ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span className="mt-1 text-center text-[10px] font-medium text-slate-600">
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${isActive ? 'bg-blue-300' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {isRejected && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          This vendor has been rejected.
        </div>
      )}

      {/* Status Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Update Status:</label>
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updating}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

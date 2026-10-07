'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Mismatch {
  id: string;
  fieldName: string;
  value1: string;
  value2: string;
  source1: string;
  source2: string;
  severity: string;
  status: string;
}

export function MismatchList({
  vendorId,
  refreshKey,
  onResolved,
}: {
  vendorId: string;
  refreshKey: number;
  onResolved: () => void;
}) {
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMismatches() {
      try {
        setLoading(true);
        const response = await documentApi.getMismatches(vendorId);
        setMismatches(response.mismatches || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchMismatches();
  }, [vendorId, refreshKey]);

  const handleResolve = async (mismatchId: string) => {
    try {
      setResolvingId(mismatchId);
      await documentApi.resolveMismatch(mismatchId, 'Reviewed and confirmed correct value');
      toast.success('Mismatch resolved');
      setMismatches((prev) => prev.filter((m) => m.id !== mismatchId));
      onResolved();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve mismatch';
      toast.error(message);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return <div className="h-20 animate-pulse rounded-lg bg-slate-200" />;
  }

  const openMismatches = mismatches.filter((m) => m.status === 'OPEN');

  if (openMismatches.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-800">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">No open mismatches. Documents are consistent.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {openMismatches.map((mismatch) => (
        <div key={mismatch.id} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-900">
                  {mismatch.fieldName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="rounded bg-orange-200 px-2 py-0.5 text-xs font-medium text-orange-900">
                  {mismatch.severity}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="font-medium">{mismatch.source1}:</span> {mismatch.value1}
                </p>
                <p className="text-slate-700">
                  <span className="font-medium">{mismatch.source2}:</span> {mismatch.value2}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolve(mismatch.id)}
              disabled={resolvingId === mismatch.id}
            >
              {resolvingId === mismatch.id ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

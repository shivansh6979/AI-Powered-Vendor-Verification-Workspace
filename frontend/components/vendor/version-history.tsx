'use client';

import { useEffect, useState } from 'react';
import { vendorApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { History, RotateCcw } from 'lucide-react';

interface AuditLog {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  changedBy: string;
  createdAt: string;
}

export function VersionHistory({
  vendorId,
  refreshKey,
  onRestored,
}: {
  vendorId: string;
  refreshKey: number;
  onRestored: () => void;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const response = await vendorApi.getHistory(vendorId);
        setLogs(response.auditLogs || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [vendorId, refreshKey]);

  const handleRestore = async (auditLogId: string) => {
    if (!confirm('Restore vendor details to this point in time?')) return;

    try {
      setRestoringId(auditLogId);
      await vendorApi.restoreVersion(vendorId, auditLogId);
      toast.success('Vendor restored to previous version');
      onRestored();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore version';
      toast.error(message);
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-slate-200" />;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-slate-600">No change history yet.</p>;
  }

  const changeTypeColor: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    RESTORE: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex items-start gap-3">
            <History className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">
                  {log.fieldName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${changeTypeColor[log.changeType]}`}>
                  {log.changeType}
                </span>
              </div>
              {log.changeType === 'UPDATE' && (
                <p className="mt-1 text-sm text-slate-600">
                  <span className="text-red-600 line-through">{log.oldValue || '(empty)'}</span>
                  {' → '}
                  <span className="text-green-700">{log.newValue || '(empty)'}</span>
                </p>
              )}
              {log.changeType !== 'UPDATE' && log.newValue && (
                <p className="mt-1 text-sm text-slate-600">{log.newValue}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString()} · {log.changedBy}
              </p>
            </div>
          </div>
          {log.changeType === 'UPDATE' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRestore(log.id)}
              disabled={restoringId === log.id}
              className="shrink-0 gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

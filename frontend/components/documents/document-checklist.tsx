'use client';

import { useEffect, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LABELS: Record<string, string> = {
  REGISTRATION_CERTIFICATE: 'Company Registration Certificate',
  GST_CERTIFICATE: 'GST / Tax Certificate',
  BANK_DOCUMENT: 'Bank Document',
};

interface ChecklistItem {
  status: 'MISSING' | 'AVAILABLE' | 'VERIFIED';
  uploadedAt?: string;
}

export function DocumentChecklist({
  vendorId,
  refreshKey,
}: {
  vendorId: string;
  refreshKey: number;
}) {
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    async function fetchChecklist() {
      try {
        setLoading(true);
        const response = await documentApi.getChecklist(vendorId);
        setChecklist(response.checklist.documentStatus);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchChecklist();
  }, [vendorId, refreshKey]);

  const handleNotifyMissing = async () => {
    try {
      setNotifying(true);
      const response = await documentApi.checkMissing(vendorId);
      if (response.missingDocuments?.length > 0) {
        toast.success(`Email sent to client about ${response.missingDocuments.length} missing document(s)`);
      } else {
        toast.success('No documents are missing!');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check missing documents';
      toast.error(message);
    } finally {
      setNotifying(false);
    }
  };

  if (loading || !checklist) {
    return <div className="h-32 animate-pulse rounded-lg bg-slate-200" />;
  }

  const getIcon = (status: string) => {
    if (status === 'VERIFIED') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'AVAILABLE') return <Clock className="h-5 w-5 text-blue-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getBadgeClass = (status: string) => {
    if (status === 'VERIFIED') return 'bg-green-100 text-green-800';
    if (status === 'AVAILABLE') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  const hasMissing = Object.values(checklist).some((item) => item.status === 'MISSING');

  return (
    <div>
      <div className="space-y-2">
        {Object.entries(checklist).map(([docType, item]) => (
          <div key={docType} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              {getIcon(item.status)}
              <span className="font-medium text-slate-900">{LABELS[docType] || docType}</span>
            </div>
            <span className={`rounded px-2 py-1 text-xs font-medium ${getBadgeClass(item.status)}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {hasMissing && (
        <div className="mt-4">
          <Button onClick={handleNotifyMissing} disabled={notifying} variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            {notifying ? 'Sending...' : 'Notify Client of Missing Documents'}
          </Button>
        </div>
      )}
    </div>
  );
}

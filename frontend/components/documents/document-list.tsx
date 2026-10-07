'use client';

import { useState } from 'react';
import { documentApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Check, X, FileText } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company Name',
  registrationNumber: 'Registration Number',
  gstNumber: 'GST Number',
  address: 'Address',
  bankAccountNumber: 'Bank Account Number',
  ifscCode: 'IFSC Code',
};

interface ExtractedData {
  id: string;
  companyName?: string | null;
  registrationNumber?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  confidence?: Record<string, number>;
}

interface DocumentItem {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  extractedData?: ExtractedData | null;
}

export function DocumentList({
  documents,
  onUpdated,
}: {
  documents: DocumentItem[];
  onUpdated: () => void;
}) {
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const startEdit = (doc: DocumentItem) => {
    setEditingDoc(doc.id);
    setFormValues({
      companyName: doc.extractedData?.companyName || '',
      registrationNumber: doc.extractedData?.registrationNumber || '',
      gstNumber: doc.extractedData?.gstNumber || '',
      address: doc.extractedData?.address || '',
      bankAccountNumber: doc.extractedData?.bankAccountNumber || '',
      ifscCode: doc.extractedData?.ifscCode || '',
    });
  };

  const cancelEdit = () => {
    setEditingDoc(null);
    setFormValues({});
  };

  const saveEdit = async (documentId: string) => {
    try {
      setSaving(true);
      await documentApi.updateExtracted(documentId, formValues);
      toast.success('Extracted data updated');
      setEditingDoc(null);
      onUpdated();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update data';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (documents.length === 0) {
    return <p className="text-sm text-slate-600">No documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const isEditing = editingDoc === doc.id;
        const fields = doc.extractedData
          ? Object.keys(FIELD_LABELS).filter(
              (f) => doc.extractedData && doc.extractedData[f as keyof ExtractedData] !== null && doc.extractedData[f as keyof ExtractedData] !== undefined
            )
          : [];

        return (
          <div key={doc.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium text-slate-900">{doc.fileName}</p>
                  <p className="text-xs text-slate-500">{doc.documentType.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    doc.status === 'EXTRACTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {doc.status}
                </span>
                {doc.extractedData && !isEditing && (
                  <Button size="sm" variant="ghost" onClick={() => startEdit(doc)} className="gap-1">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {doc.extractedData && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {!isEditing ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div key={field} className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{FIELD_LABELS[field]}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {String(doc.extractedData![field as keyof ExtractedData] ?? '')}
                          </span>
                          {doc.extractedData!.confidence && doc.extractedData!.confidence[field] !== undefined && (
                            <span className="text-xs text-slate-400">
                              {Math.round(doc.extractedData!.confidence[field] * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(FIELD_LABELS).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-slate-600">{label}</label>
                        <input
                          type="text"
                          value={formValues[field] || ''}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => saveEdit(doc.id)} disabled={saving} className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

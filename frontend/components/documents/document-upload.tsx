'use client';

import { useRef, useState } from 'react';
import { documentApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'REGISTRATION_CERTIFICATE', label: 'Company Registration Certificate' },
  { value: 'GST_CERTIFICATE', label: 'GST / Tax Certificate' },
  { value: 'BANK_DOCUMENT', label: 'Bank Document' },
];

export function DocumentUpload({
  vendorId,
  onUploaded,
}: {
  vendorId: string;
  onUploaded: () => void;
}) {
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      await documentApi.upload(vendorId, documentType, file);
      toast.success('Document uploaded and processed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">Document Type</label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">File (PDF, JPG, PNG)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="mt-1 block w-full text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <Button onClick={handleUpload} disabled={uploading} className="gap-2">
        <Upload className="h-4 w-4" />
        {uploading ? 'Processing...' : 'Upload'}
      </Button>
    </div>
  );
}

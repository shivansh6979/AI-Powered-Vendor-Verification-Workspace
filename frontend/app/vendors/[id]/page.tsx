'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { vendorApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { StatusWorkflow } from '@/components/vendor/status-workflow';
import { VersionHistory } from '@/components/vendor/version-history';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentChecklist } from '@/components/documents/document-checklist';
import { MismatchList } from '@/components/documents/mismatch-list';
import { TaskList } from '@/components/tasks/task-list';

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber?: string;
  gstNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  status: string;
  documents?: any[];
  verificationResult?: any;
  tasks?: any[];
}

const TABS = ['Overview', 'Documents', 'Verification', 'Tasks', 'History'] as const;
type Tab = (typeof TABS)[number];

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorApi.get(vendorId);
      setVendor(response.vendor);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vendor';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) fetchVendor();
  }, [vendorId, fetchVendor]);

  const refreshAll = () => {
    fetchVendor();
    setRefreshKey((k) => k + 1);
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      await vendorApi.verify(vendorId);
      toast.success('Verification completed via GLEIF');
      refreshAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify company';
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'ACTION_REQUIRED':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="w-6 h-6 text-blue-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/vendors" className="mb-4 block text-sm text-blue-600 hover:text-blue-700">
            ← Back to Vendors
          </Link>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-900">{error || 'Vendor not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/vendors" className="mb-4 block text-sm text-blue-600 hover:text-blue-700">
            ← Back to Vendors
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{vendor.companyName}</h1>
              <p className="mt-2 text-lg text-slate-600">{vendor.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(vendor.status)}
              <span className="text-lg font-semibold text-slate-700">
                {vendor.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <StatusWorkflow
              vendorId={vendor.id}
              currentStatus={vendor.status}
              onStatusChanged={refreshAll}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendor Information</CardTitle>
              <Link href={`/vendors/${vendor.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-600">Contact Person</p>
                  <p className="text-lg font-medium text-slate-900">{vendor.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="text-lg font-medium text-slate-900">{vendor.phone}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-600">Address</p>
                  <p className="text-lg font-medium text-slate-900">{vendor.address}</p>
                </div>
                {vendor.registrationNumber && (
                  <div>
                    <p className="text-sm text-slate-600">Registration Number</p>
                    <p className="text-lg font-medium text-slate-900">{vendor.registrationNumber}</p>
                  </div>
                )}
                {vendor.gstNumber && (
                  <div>
                    <p className="text-sm text-slate-600">GST Number</p>
                    <p className="text-lg font-medium text-slate-900">{vendor.gstNumber}</p>
                  </div>
                )}
                {vendor.bankAccountNumber && (
                  <div>
                    <p className="text-sm text-slate-600">Bank Account</p>
                    <p className="text-lg font-medium text-slate-900">
                      ****{vendor.bankAccountNumber.slice(-4)}
                    </p>
                  </div>
                )}
                {vendor.ifscCode && (
                  <div>
                    <p className="text-sm text-slate-600">IFSC Code</p>
                    <p className="text-lg font-medium text-slate-900">{vendor.ifscCode}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentChecklist vendorId={vendor.id} refreshKey={refreshKey} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Document</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUpload vendorId={vendor.id} onUploaded={refreshAll} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents &amp; AI-Extracted Data</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentList documents={vendor.documents || []} onUpdated={refreshAll} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-Document Mismatches</CardTitle>
              </CardHeader>
              <CardContent>
                <MismatchList vendorId={vendor.id} refreshKey={refreshKey} onResolved={refreshAll} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'Verification' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>GLEIF Company Verification</CardTitle>
              <Button onClick={handleVerify} disabled={verifying} size="sm">
                {verifying ? 'Verifying...' : 'Run Verification'}
              </Button>
            </CardHeader>
            <CardContent>
              {vendor.verificationResult ? (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    {vendor.verificationResult.status === 'VERIFIED' && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                    {vendor.verificationResult.status === 'MISMATCH' && (
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    )}
                    {vendor.verificationResult.status === 'UNABLE_TO_VERIFY' && (
                      <XCircle className="h-6 w-6 text-slate-600" />
                    )}
                    <span
                      className={`text-lg font-semibold ${
                        vendor.verificationResult.status === 'VERIFIED'
                          ? 'text-green-600'
                          : vendor.verificationResult.status === 'MISMATCH'
                          ? 'text-orange-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {vendor.verificationResult.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {vendor.verificationResult.matchedName && (
                    <p className="text-slate-600">
                      Matched Name:{' '}
                      <span className="font-medium text-slate-900">
                        {vendor.verificationResult.matchedName}
                      </span>
                    </p>
                  )}
                  {vendor.verificationResult.matchedRegistration && (
                    <p className="text-slate-600">
                      LEI:{' '}
                      <span className="font-medium text-slate-900">
                        {vendor.verificationResult.matchedRegistration}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No verification has been run yet. Click &quot;Run Verification&quot; to check this
                  company against the GLEIF global registry.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'Tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList vendorId={vendor.id} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'History' && (
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistory vendorId={vendor.id} refreshKey={refreshKey} onRestored={refreshAll} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vendorApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  companyName: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        const response = await vendorApi.list();
        setVendors(response.vendors || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch vendors';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 border-red-200';
      case 'ACTION_REQUIRED':
        return 'bg-orange-50 border-orange-200';
      case 'UNDER_REVIEW':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'ACTION_REQUIRED':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'UNDER_REVIEW':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Vendors</h1>
            <p className="mt-2 text-lg text-slate-600">Manage and verify vendor information</p>
          </div>
          <Link href="/vendors/create">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Vendor
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Error Loading Vendors</CardTitle>
              <CardDescription className="text-red-700">{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Vendors Grid */}
        {!loading && !error && (
          <div className="space-y-4">
            {vendors.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-slate-600">No vendors yet. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              vendors.map((vendor) => (
                <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                  <Card className={`cursor-pointer border-2 transition-all hover:shadow-lg ${getStatusColor(vendor.status)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{vendor.companyName}</h3>
                          <p className="text-sm text-slate-600">{vendor.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(vendor.status)}
                            <span className="text-sm font-medium text-slate-700">{vendor.status.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

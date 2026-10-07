'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { vendorApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VendorForm, VendorFormValues } from '@/components/vendor/vendor-form';
import { toast } from 'sonner';

export default function CreateVendorPage() {
  const router = useRouter();

  const handleSubmit = async (values: VendorFormValues) => {
    try {
      await vendorApi.create(values);
      toast.success('Vendor created successfully!');
      router.push('/vendors');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create vendor';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/vendors" className="mb-4 block text-sm text-blue-600 hover:text-blue-700">
            ← Back to Vendors
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Create New Vendor</h1>
          <p className="mt-2 text-lg text-slate-600">Enter vendor information to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorForm
              onSubmit={handleSubmit}
              submitLabel="Create Vendor"
              onCancel={() => router.push('/vendors')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

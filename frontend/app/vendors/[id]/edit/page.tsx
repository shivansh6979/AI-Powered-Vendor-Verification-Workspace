'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { vendorApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VendorForm, VendorFormValues } from '@/components/vendor/vendor-form';
import { toast } from 'sonner';

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [initialValues, setInitialValues] = useState<Partial<VendorFormValues> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendor() {
      try {
        const response = await vendorApi.get(vendorId);
        const v = response.vendor;
        setInitialValues({
          companyName: v.companyName,
          contactPerson: v.contactPerson,
          email: v.email,
          phone: v.phone,
          address: v.address,
          registrationNumber: v.registrationNumber || '',
          gstNumber: v.gstNumber || '',
          bankAccountNumber: v.bankAccountNumber || '',
          ifscCode: v.ifscCode || '',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch vendor';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [vendorId]);

  const handleSubmit = async (values: VendorFormValues) => {
    try {
      await vendorApi.update(vendorId, values);
      toast.success('Vendor updated successfully!');
      router.push(`/vendors/${vendorId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update vendor';
      toast.error(message);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/vendors/${vendorId}`} className="mb-4 block text-sm text-blue-600 hover:text-blue-700">
            ← Back to Vendor
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">Edit Vendor</h1>
          <p className="mt-2 text-lg text-slate-600">Update vendor information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
              onCancel={() => router.push(`/vendors/${vendorId}`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

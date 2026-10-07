import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, CheckCircle, Send } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-slate-900">
            Vendor Verification Workspace
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            AI-Powered Onboarding & Verification Platform
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Upload and automatically extract data from vendor documents using AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">AI Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Powerful AI models automatically extract key information from documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Send className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle className="text-lg">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Verify companies against external databases and detect inconsistencies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Plus className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle className="text-lg">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Automated workflows with task management and status tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link href="/vendors">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Get Started
            </Button>
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Technology Stack</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frontend</CardTitle>
                <CardDescription>Next.js 15, React 19, Tailwind CSS</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backend</CardTitle>
                <CardDescription>Node.js, Express, PostgreSQL, Prisma</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI & APIs</CardTitle>
                <CardDescription>Google Gemini, OpenCorporates, Resend Email</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

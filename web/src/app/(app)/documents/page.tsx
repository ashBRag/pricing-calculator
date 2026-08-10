"use client";

import Link from "next/link";
import { useDocuments } from "@/lib/documents/use-documents";
import { formatCents, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function DocumentsPage() {
  const { data: documents, isLoading, isError } = useDocuments();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <Link href="/documents/new">
          <Button>New document</Button>
        </Link>
      </div>

      {isLoading && <Spinner label="Loading documents..." />}
      {isError && (
        <p className="text-sm text-red-600">Failed to load documents.</p>
      )}

      {documents && documents.length === 0 && (
        <Card className="text-sm text-slate-500">
          No documents yet. Create your first one to get started.
        </Card>
      )}

      {documents && documents.length > 0 && (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <Link key={doc._id} href={`/documents/${doc._id}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-slate-300">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {doc.title}
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {doc.customer} &middot; {formatDate(doc.issueDate)}
                  </p>
                </div>
                <span className="font-medium text-slate-900">
                  {formatCents(doc.grandTotalCents)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

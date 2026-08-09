"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useDocument,
  useDeleteDocument,
  useFinalizeDocument,
  useDuplicateDocument,
  useUpdateDocument,
} from "@/lib/documents/use-documents";
import { DocumentSummary } from "@/components/documents/document-summary";
import { DocumentForm } from "@/components/documents/document-form";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: document, isLoading, isError } = useDocument(id);
  const [isEditing, setIsEditing] = useState(false);

  const updateDocument = useUpdateDocument(id);
  const deleteDocument = useDeleteDocument();
  const finalizeDocument = useFinalizeDocument();
  const duplicateDocument = useDuplicateDocument();

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (isError || !document)
    return <p className="text-sm text-red-600">Failed to load document.</p>;

  const isDraft = document.status === "draft";

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-slate-900">Edit document</h1>
        <DocumentForm
          initialValue={{
            title: document.title,
            customer: document.customer,
            issueDate: document.issueDate,
            lineItems: document.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              discountPercent: li.discountPercent,
              fixedDiscount: li.fixedDiscount,
              taxPercent: li.taxPercent,
            })),
          }}
          submitLabel="Save changes"
          isSubmitting={updateDocument.isPending}
          error={updateDocument.error}
          onSubmit={(input) =>
            updateDocument.mutate(input, {
              onSuccess: () => setIsEditing(false),
            })
          }
        />
        <Button variant="ghost" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {document.title}
            </h1>
            <StatusBadge status={document.status} />
          </div>
          <p className="text-sm text-slate-500">
            {document.customer} &middot; {formatDate(document.issueDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/backend/documents/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary">Print</Button>
          </a>
          {isDraft && (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button onClick={() => finalizeDocument.mutate(id)}>
                Finalize
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Delete this draft document?")) {
                    deleteDocument.mutate(id, {
                      onSuccess: () => router.push("/documents"),
                    });
                  }
                }}
              >
                Delete
              </Button>
            </>
          )}
          {!isDraft && (
            <Button
              variant="secondary"
              onClick={() =>
                duplicateDocument.mutate(id, {
                  onSuccess: (copy) => router.push(`/documents/${copy._id}`),
                })
              }
            >
              Duplicate as draft
            </Button>
          )}
        </div>
      </div>

      <DocumentSummary document={document} />

      <Link href="/documents" className="text-sm text-slate-500 underline">
        Back to documents
      </Link>
    </div>
  );
}

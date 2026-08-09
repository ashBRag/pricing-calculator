"use client";

import { useRouter } from "next/navigation";
import { DocumentForm } from "@/components/documents/document-form";
import { useCreateDocument } from "@/lib/documents/use-documents";

export default function NewDocumentPage() {
  const router = useRouter();
  const createDocument = useCreateDocument();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">New document</h1>
      <DocumentForm
        submitLabel="Create document"
        isSubmitting={createDocument.isPending}
        error={createDocument.error}
        onSubmit={(input) =>
          createDocument.mutate(input, {
            onSuccess: (doc) => router.push(`/documents/${doc._id}`),
          })
        }
      />
    </div>
  );
}

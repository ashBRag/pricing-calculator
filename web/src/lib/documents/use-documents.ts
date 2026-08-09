"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi, ApiError } from "@/lib/api";
import type {
  CreateDocumentInput,
  PricingDocument,
  ReportSummary,
  UpdateDocumentInput,
} from "@/types/api";

const documentsKey = ["documents"] as const;
const documentKey = (id: string) => ["documents", id] as const;
const reportKey = (from: string, to: string) => ["reports", from, to] as const;

export function useDocuments() {
  return useQuery({
    queryKey: documentsKey,
    queryFn: () => fetchApi<PricingDocument[]>("/documents"),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKey(id),
    queryFn: () => fetchApi<PricingDocument>(`/documents/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation<PricingDocument, ApiError, CreateDocumentInput>({
    mutationFn: (input) =>
      fetchApi("/documents", { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation<PricingDocument, ApiError, UpdateDocumentInput>({
    mutationFn: (input) =>
      fetchApi(`/documents/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
      queryClient.invalidateQueries({ queryKey: documentKey(id) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => fetchApi(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useFinalizeDocument() {
  const queryClient = useQueryClient();
  return useMutation<PricingDocument, ApiError, string>({
    mutationFn: (id) =>
      fetchApi(`/documents/${id}/finalize`, { method: "POST" }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
      queryClient.invalidateQueries({ queryKey: documentKey(id) });
    },
  });
}

export function useDuplicateDocument() {
  const queryClient = useQueryClient();
  return useMutation<PricingDocument, ApiError, string>({
    mutationFn: (id) =>
      fetchApi(`/documents/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export function useReportSummary(from: string, to: string) {
  return useQuery({
    queryKey: reportKey(from, to),
    queryFn: () =>
      fetchApi<ReportSummary>(
        `/reports/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      ),
    enabled: Boolean(from && to),
  });
}

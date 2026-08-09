"use client";

import { useState } from "react";
import { useReportSummary } from "@/lib/documents/use-documents";
import { formatCents } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());

  const { data: summary, isLoading, isError } = useReportSummary(
    new Date(from).toISOString(),
    new Date(to).toISOString()
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>

      <Card className="flex gap-4">
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </Card>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load report.</p>}

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <p className="text-xs uppercase text-slate-500">Documents</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary.documentCount}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-500">Grand total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatCents(summary.sumGrandTotalCents)}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-500">Total tax</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatCents(summary.sumTotalTaxCents)}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase text-slate-500">Total discount</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatCents(summary.sumTotalDiscountCents)}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

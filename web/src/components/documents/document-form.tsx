"use client";

import { useState, FormEvent } from "react";
import type { CreateDocumentInput, LineItemInput } from "@/types/api";
import { LineItemRow } from "@/components/line-items/line-item-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

const EMPTY_LINE_ITEM: LineItemInput = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

interface DocumentFormProps {
  initialValue?: CreateDocumentInput;
  submitLabel: string;
  isSubmitting: boolean;
  error?: unknown;
  onSubmit: (input: CreateDocumentInput) => void;
}

export function DocumentForm({
  initialValue,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
}: DocumentFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [customer, setCustomer] = useState(initialValue?.customer ?? "");
  const [issueDate, setIssueDate] = useState(
    initialValue?.issueDate.slice(0, 10) ??
      new Date().toISOString().slice(0, 10)
  );
  const [lineItems, setLineItems] = useState<LineItemInput[]>(
    initialValue?.lineItems ?? [{ ...EMPTY_LINE_ITEM }]
  );

  function updateLineItem(index: number, value: LineItemInput) {
    setLineItems((items) => items.map((item, i) => (i === index ? value : item)));
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { ...EMPTY_LINE_ITEM }]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      customer,
      issueDate: new Date(issueDate).toISOString(),
      lineItems,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="grid grid-cols-3 gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Customer"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          required
        />
        <Input
          label="Issue date"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          required
        />
      </Card>

      <Card>
        <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-medium uppercase text-slate-500">
          <span className="col-span-4">Description</span>
          <span className="col-span-1">Qty</span>
          <span className="col-span-2">Unit price</span>
          <span className="col-span-3">Discount</span>
          <span className="col-span-1">Tax %</span>
        </div>
        {lineItems.map((item, index) => (
          <LineItemRow
            key={index}
            value={item}
            onChange={(value) => updateLineItem(index, value)}
            onRemove={() => removeLineItem(index)}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={addLineItem}
        >
          Add line item
        </Button>
      </Card>

      {error !== undefined && error !== null && (
        <p className="text-sm text-red-600">
          {error instanceof ApiError ? error.message : "Something went wrong."}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={lineItems.length === 0}
          loading={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

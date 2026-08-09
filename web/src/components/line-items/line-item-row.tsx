"use client";

import type { LineItemInput } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DiscountMode = "none" | "percent" | "fixed";

interface LineItemRowProps {
  value: LineItemInput;
  onChange: (value: LineItemInput) => void;
  onRemove: () => void;
}

function discountModeOf(value: LineItemInput): DiscountMode {
  if (value.discountPercent !== undefined) return "percent";
  if (value.fixedDiscount !== undefined) return "fixed";
  return "none";
}

export function LineItemRow({ value, onChange, onRemove }: LineItemRowProps) {
  const mode = discountModeOf(value);

  function setDiscountMode(next: DiscountMode) {
    onChange({
      ...value,
      discountPercent: next === "percent" ? 0 : undefined,
      fixedDiscount: next === "fixed" ? 0 : undefined,
    });
  }

  return (
    <div className="grid grid-cols-12 gap-2 border-b border-slate-100 py-3 last:border-b-0">
      <div className="col-span-4">
        <Input
          placeholder="Description"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          required
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Qty"
          value={value.quantity}
          onChange={(e) =>
            onChange({ ...value, quantity: Number(e.target.value) })
          }
          required
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="Unit price"
          value={value.unitPrice}
          onChange={(e) =>
            onChange({ ...value, unitPrice: Number(e.target.value) })
          }
          required
        />
      </div>
      <div className="col-span-2 flex gap-1">
        <select
          className="rounded-md border border-slate-300 px-2 text-sm"
          value={mode}
          onChange={(e) => setDiscountMode(e.target.value as DiscountMode)}
        >
          <option value="none">No discount</option>
          <option value="percent">% off</option>
          <option value="fixed">Fixed</option>
        </select>
        {mode === "percent" && (
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={value.discountPercent ?? 0}
            onChange={(e) =>
              onChange({ ...value, discountPercent: Number(e.target.value) })
            }
          />
        )}
        {mode === "fixed" && (
          <Input
            type="number"
            min={0}
            step={0.01}
            value={value.fixedDiscount ?? 0}
            onChange={(e) =>
              onChange({ ...value, fixedDiscount: Number(e.target.value) })
            }
          />
        )}
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.01}
          placeholder="Tax %"
          value={value.taxPercent ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              taxPercent: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </div>
      <div className="col-span-1 flex items-center justify-end">
        <Button type="button" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

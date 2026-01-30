"use client";

import { useCallback } from "react";

import type { ProductOption, ProductVariant } from "@/validation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getVariantTitle } from "@/validation";

type VariantsTableProps = {
  options: ProductOption[];
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
};

export function VariantsTable({
  options,
  variants,
  onChange,
  disabled = false,
}: VariantsTableProps) {
  const updateVariant = useCallback(
    (index: number, field: keyof ProductVariant, value: string) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    },
    [variants, onChange]
  );

  const applyToAll = useCallback(
    (field: "price" | "compareAtPrice" | "quantity", value: string) => {
      onChange(variants.map((v) => ({ ...v, [field]: value })));
    },
    [variants, onChange]
  );

  // Get unique option names for column headers
  const optionNames = options.map((o) => o.name);

  // Don't show table if no variants or only default variant with no options
  if (variants.length === 0) {
    return null;
  }

  const hasOptions = options.length > 0 && options.some((o) => o.values.length > 0);

  if (!hasOptions) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Variants</CardTitle>
        <CardDescription>
          {variants.length} variant{variants.length !== 1 ? "s" : ""} generated from your options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {optionNames.map((name) => (
                <TableHead
                  key={name}
                  className="font-medium"
                >
                  {name}
                </TableHead>
              ))}
              <TableHead className="w-28">
                <div className="flex items-center gap-1">
                  Price
                  {variants.length > 1 && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                      onClick={() => {
                        const firstPrice = variants[0]?.price;
                        if (firstPrice) applyToAll("price", firstPrice);
                      }}
                      disabled={disabled}
                    >
                      (apply all)
                    </button>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-28">
                <div className="flex items-center gap-1">
                  Compare-at
                  {variants.length > 1 && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                      onClick={() => {
                        const firstCompareAt = variants[0]?.compareAtPrice;
                        if (firstCompareAt) applyToAll("compareAtPrice", firstCompareAt);
                      }}
                      disabled={disabled}
                    >
                      (apply all)
                    </button>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-32">SKU</TableHead>
              <TableHead className="w-24">
                <div className="flex items-center gap-1">
                  Qty
                  {variants.length > 1 && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                      onClick={() => {
                        const firstQty = variants[0]?.quantity;
                        if (firstQty) applyToAll("quantity", firstQty);
                      }}
                      disabled={disabled}
                    >
                      (apply all)
                    </button>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, index) => (
              <TableRow key={index}>
                {optionNames.map((name) => (
                  <TableCell
                    key={name}
                    className="font-medium"
                  >
                    {variant.optionValues[name] || "-"}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">
                      $
                    </span>
                    <Input
                      type="text"
                      value={variant.price || ""}
                      onChange={(e) => updateVariant(index, "price", e.target.value)}
                      placeholder="0.00"
                      className="h-8 pl-5"
                      disabled={disabled}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">
                      $
                    </span>
                    <Input
                      type="text"
                      value={variant.compareAtPrice || ""}
                      onChange={(e) => updateVariant(index, "compareAtPrice", e.target.value)}
                      placeholder="0.00"
                      className="h-8 pl-5"
                      disabled={disabled}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={variant.sku || ""}
                    onChange={(e) => updateVariant(index, "sku", e.target.value)}
                    placeholder="SKU"
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={variant.quantity || ""}
                    onChange={(e) => updateVariant(index, "quantity", e.target.value)}
                    placeholder="0"
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {variants.length > 5 && (
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Showing all {variants.length} variants
          </p>
        )}
      </CardContent>
    </Card>
  );
}

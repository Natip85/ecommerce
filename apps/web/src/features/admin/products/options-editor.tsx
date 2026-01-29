"use client";

import { Plus, X, GripVertical } from "lucide-react";
import { useState, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type ProductOption } from "@/validation";

type OptionsEditorProps = {
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
  disabled?: boolean;
};

export function OptionsEditor({
  options,
  onChange,
  disabled = false,
}: OptionsEditorProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [editingValueIndex, setEditingValueIndex] = useState<{
    optionIndex: number;
    valueIndex: number | "new";
  } | null>(null);
  const [newValueText, setNewValueText] = useState("");

  const addOption = useCallback(() => {
    if (!newOptionName.trim()) return;

    // Check for duplicate option names
    if (
      options.some(
        (o) => o.name.toLowerCase() === newOptionName.toLowerCase().trim(),
      )
    ) {
      return;
    }

    onChange([
      ...options,
      {
        name: newOptionName.trim(),
        values: [],
      },
    ]);
    setNewOptionName("");
  }, [newOptionName, options, onChange]);

  const removeOption = useCallback(
    (index: number) => {
      onChange(options.filter((_, i) => i !== index));
    },
    [options, onChange],
  );

  const updateOptionName = useCallback(
    (index: number, name: string) => {
      const updated = [...options];
      updated[index] = { ...updated[index], name };
      onChange(updated);
    },
    [options, onChange],
  );

  const addValue = useCallback(
    (optionIndex: number, value: string) => {
      if (!value.trim()) return;

      const option = options[optionIndex];
      // Check for duplicate values
      if (
        option.values.some(
          (v) => v.toLowerCase() === value.toLowerCase().trim(),
        )
      ) {
        return;
      }

      const updated = [...options];
      updated[optionIndex] = {
        ...option,
        values: [...option.values, value.trim()],
      };
      onChange(updated);
    },
    [options, onChange],
  );

  const removeValue = useCallback(
    (optionIndex: number, valueIndex: number) => {
      const updated = [...options];
      updated[optionIndex] = {
        ...updated[optionIndex],
        values: updated[optionIndex].values.filter((_, i) => i !== valueIndex),
      };
      onChange(updated);
    },
    [options, onChange],
  );

  const handleValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, optionIndex: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addValue(optionIndex, newValueText);
        setNewValueText("");
        setEditingValueIndex(null);
      } else if (e.key === "Escape") {
        setNewValueText("");
        setEditingValueIndex(null);
      }
    },
    [addValue, newValueText],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Options</CardTitle>
        <CardDescription>
          Add options like Size or Color to create variants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Options */}
        {options.map((option, optionIndex) => (
          <div
            key={optionIndex}
            className="rounded-md border bg-muted/30 p-3 space-y-3"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <Input
                value={option.name}
                onChange={(e) => updateOptionName(optionIndex, e.target.value)}
                placeholder="Option name (e.g., Size)"
                className="flex-1 font-medium"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeOption(optionIndex)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Option Values */}
            <div className="flex flex-wrap gap-2 pl-6">
              {option.values.map((value, valueIndex) => (
                <Badge
                  key={valueIndex}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(optionIndex, valueIndex)}
                    className="ml-1 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {/* Add Value Input */}
              {editingValueIndex?.optionIndex === optionIndex &&
              editingValueIndex?.valueIndex === "new" ? (
                <Input
                  autoFocus
                  value={newValueText}
                  onChange={(e) => setNewValueText(e.target.value)}
                  onKeyDown={(e) => handleValueKeyDown(e, optionIndex)}
                  onBlur={() => {
                    if (newValueText.trim()) {
                      addValue(optionIndex, newValueText);
                    }
                    setNewValueText("");
                    setEditingValueIndex(null);
                  }}
                  placeholder="Add value..."
                  className="h-6 w-24 text-xs"
                  disabled={disabled}
                />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setEditingValueIndex({ optionIndex, valueIndex: "new" });
                    setNewValueText("");
                  }}
                  disabled={disabled}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add value
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Add New Option */}
        <div className="flex items-center gap-2">
          <Input
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
            placeholder="Add another option (e.g., Color, Material)"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            disabled={disabled || !newOptionName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {options.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No options defined. Add options to create product variants.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

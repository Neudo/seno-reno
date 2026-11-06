import type { ComponentProps, ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";

type SelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type SelectFieldProps = Omit<
  ComponentProps<typeof SelectTrigger>,
  "children" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
};

export function SelectField({
  value,
  onValueChange,
  options,
  disabled,
  required,
  className,
  ...triggerProps
}: SelectFieldProps) {
  const emptyOption = options.find((option) => option.value === "");

  return (
    <Select
      disabled={disabled}
      required={required}
      value={value === "" ? "" : `option:${value}`}
      onValueChange={(nextValue) => onValueChange(nextValue.slice(7))}
    >
      <SelectTrigger className={cn("w-full", className)} {...triggerProps}>
        <SelectValue placeholder={emptyOption?.label ?? "Sélectionner…"} />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={`option:${option.value}`}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

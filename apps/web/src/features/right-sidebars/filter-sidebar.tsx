"use client";

import { Trash } from "lucide-react";
import { motion } from "motion/react";
import { createContext, useContext, useId, useState } from "react";


import { cn } from "../../lib/utils";

import type { Product } from "@ecommerce/db/schema/product";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";


export type FilterSidebarContextType = {
  item?: Pick<
    Product,
    | "title"
    | "handle"
    | "description"
    | "vendor"
    | "productType"
    | "status"
    | "creationStatus"
    | "published"
    | "metadata"
    | "createdAt"
    | "updatedAt"
  >;
};

const FilterSidebarContext = createContext<FilterSidebarContextType>(
  {} as FilterSidebarContextType,
);

export { FilterSidebarContext };

export type FilterSidebarProps = Partial<
  Pick<FilterSidebarContextType, "item">
> & {
  children: React.ReactNode;
};

export function FilterSidebar({ children, item }: FilterSidebarProps) {
  return (
    <FilterSidebarContext.Provider value={{ item }}>
      {children}
    </FilterSidebarContext.Provider>
  );
}

export function FilterSidebarHeader({
  className,
  title,
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
}) {
  return (
    <SidebarHeader
      className={cn("relative border-b border-neutral-400 p-3", className)}
      {...props}
    >
      <h2 className="text-lg font-medium">{title}</h2>
    </SidebarHeader>
  );
}

export const FilterSidebarContent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SidebarContent>) => {
  return (
    <SidebarContent
      {...props}
      className={cn(
        "scrollbar-gutter-stable flex-1 overflow-y-auto p-3",
        className,
      )}
    >
      {children}
    </SidebarContent>
  );
};

export const FilterSidebarModeSwitcher = ({
  className,
  proMode,
  setProMode,
  onCheckedChange,
  disabled,
  ...props
}: React.ComponentProps<"div"> & {
  proMode: boolean;
  setProMode: (proMode: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  const handleCheckedChange = (checked: boolean) => {
    setProMode?.(checked);
    onCheckedChange?.(checked);
  };

  return (
    <div
      className={cn("flex items-center justify-between gap-2", className)}
      {...props}
    >
      <p className="text-neutral-950">Pro Mode</p>
      <div className="flex items-center gap-2">
        <Label
          htmlFor="pro-mode"
          className="relative h-5 w-8 cursor-pointer overflow-hidden text-sm"
        >
          {[
            { text: "ON", isActive: proMode, direction: -24 },
            { text: "OFF", isActive: !proMode, direction: 24 },
          ].map(({ text, isActive, direction }) => (
            <motion.span
              key={text}
              className="absolute right-0"
              initial={false}
              animate={{
                x: isActive ? 0 : direction,
                opacity: isActive ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              {text}
            </motion.span>
          ))}
        </Label>
        <Switch
          id="pro-mode"
          checked={proMode}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

type FilterSidebarSectionContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  id: string;
};

const FilterSidebarSectionContext =
  createContext<FilterSidebarSectionContextType>(
    {} as FilterSidebarSectionContextType,
  );

export const FilterSidebarSection = ({
  children,
  className,
  defaultOpen = false,
  disabled = false,
  ...props
}: React.ComponentProps<typeof SidebarGroup> & {
  defaultOpen?: boolean;
  disabled?: boolean;
}) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <FilterSidebarSectionContext.Provider value={{ isOpen, setIsOpen, id }}>
      <SidebarGroup
        className={cn("rounded-md border border-neutral-400 p-0", className)}
        {...props}
      >
        <Accordion
          type="single"
          collapsible
          defaultValue={defaultOpen ? id : undefined}
          value={isOpen && !disabled ? id : ""}
          disabled={disabled}
        >
          <AccordionItem value={id}>{children}</AccordionItem>
        </Accordion>
      </SidebarGroup>
    </FilterSidebarSectionContext.Provider>
  );
};

export const FilterSidebarSectionTitle = ({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof AccordionTrigger>) => {
  const { setIsOpen, isOpen } = useContext(FilterSidebarSectionContext);

  return (
    <AccordionTrigger
      className={cn(
        "flex items-center justify-between px-3 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-950 hover:no-underline",
        className,
      )}
      onClick={(e) => {
        setIsOpen(!isOpen);
        onClick?.(e);
      }}
      {...props}
    />
  );
};

export const FilterSidebarSectionContent = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof AccordionContent>) => {
  return (
    <AccordionContent
      className={cn("flex flex-col gap-2 px-3 pb-3", className)}
      {...props}
    >
      {children}
    </AccordionContent>
  );
};

export const FilterSidebarSectionClearButton = ({
  children,
  className,
  onClick,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { setIsOpen } = useContext(FilterSidebarSectionContext);
  if (disabled) return null;
  return (
    <Button
      variant="link"
      size="sm"
      color="destructive"
      className={cn("self-end", className)}
      onClick={(e) => {
        setIsOpen(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children ?? <Trash />}
    </Button>
  );
};

export const FilterSidebarFooter = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof SidebarFooter>) => {
  return (
    <SidebarFooter
      {...props}
      className={cn("flex items-center  gap-4 border-t p-3", className)}
    >
      {children}
    </SidebarFooter>
  );
};

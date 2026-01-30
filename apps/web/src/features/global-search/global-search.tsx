"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Loader2, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGlobalSearchParams } from "@/hooks/use-global-search-params";
import { useKeypress } from "@/hooks/use-keypress";
import { skipToken, useTRPC } from "@/trpc";

function formatPrice(price: string | null) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function SearchInput() {
  const { globalSearchParams, setGlobalSearchQuery } = useGlobalSearchParams();

  const { value, onChange } = useDebouncedValue({
    initialValue: globalSearchParams.globalSearchQuery,
    delay: 300,
    onDebouncedChange: setGlobalSearchQuery,
  });

  return (
    <div className="px-3">
      <Input
        autoFocus
        placeholder="Search products and collections..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}

type Product = {
  id: string;
  title: string;
  handle: string;
  productType: string | null;
  price: string | null;
  image: { url: string; alt: string | null } | null;
};

type Collection = {
  id: string;
  title: string;
  handle: string;
  productCount: number;
};

function ProductResultItem({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.id}`}
      className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors"
    >
      {product.image ?
        <img
          src={product.image.url}
          alt={product.image.alt ?? product.title}
          className="h-10 w-10 rounded-md border object-cover"
        />
      : <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md border">
          <Package className="text-muted-foreground h-5 w-5" />
        </div>
      }
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{product.title}</span>
          <Badge
            variant="secondary"
            className="h-4 shrink-0 px-1.5 py-0 text-[10px]"
          >
            Product
          </Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          {product.productType && `${product.productType}`}
          {product.productType && product.price && " · "}
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}

function CollectionResultItem({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/shop?collectionIds=${collection.id}`}
      className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors"
    >
      <div className="bg-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-md border">
        <FolderOpen className="text-primary h-5 w-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{collection.title}</span>
          <Badge
            variant="outline"
            className="border-primary/50 text-primary h-4 shrink-0 px-1.5 py-0 text-[10px]"
          >
            Collection
          </Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          {collection.productCount} product
          {collection.productCount !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

function ResultsGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 px-3">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">({count})</p>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SearchResults() {
  const trpc = useTRPC();
  const { globalSearchParams } = useGlobalSearchParams();
  const searchQuery = globalSearchParams.globalSearchQuery;
  const shouldSearch = searchQuery.length >= 2;

  const { data, isPending } = useQuery(
    trpc.product.globalSearch.queryOptions(shouldSearch ? searchQuery : skipToken)
  );

  const products = data?.products ?? [];
  const collections = data?.collections ?? [];
  const hasResults = products.length > 0 || collections.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (isPending && shouldSearch) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!hasSearchQuery) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Start typing to search...
      </div>
    );
  }

  if (hasSearchQuery && searchQuery.length < 2) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Type at least 2 characters to search
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        No results found for "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.length > 0 && (
        <ResultsGroup
          label="Products"
          count={products.length}
        >
          {products.map((product) => (
            <ProductResultItem
              key={product.id}
              product={product}
            />
          ))}
        </ResultsGroup>
      )}
      {collections.length > 0 && (
        <ResultsGroup
          label="Collections"
          count={collections.length}
        >
          {collections.map((collection) => (
            <CollectionResultItem
              key={collection.id}
              collection={collection}
            />
          ))}
        </ResultsGroup>
      )}
    </div>
  );
}

export function GlobalSearch() {
  const { globalSearchParams, closeGlobalSearch, toggleGlobalSearch } = useGlobalSearchParams();

  // Keyboard shortcut: Cmd+K or Cmd+/
  useKeypress(toggleGlobalSearch, ["k", "/"], { withMeta: true });

  return (
    <Dialog
      open={globalSearchParams.globalSearchOpen}
      onOpenChange={(open) => {
        if (!open) closeGlobalSearch();
      }}
    >
      <DialogContent
        className="gap-0 p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for products and collections
        </DialogDescription>
        <div className="py-3">
          <SearchInput />
        </div>
        <div className="h-80 overflow-y-auto border-t">
          <div className="py-2">
            <SearchResults />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

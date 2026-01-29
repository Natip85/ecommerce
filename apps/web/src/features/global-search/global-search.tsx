"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, FolderOpen } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-accent transition-colors"
    >
      {product.image ? (
        <img
          src={product.image.url}
          alt={product.image.alt ?? product.title}
          className="h-10 w-10 rounded-md object-cover border"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted border">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{product.title}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 shrink-0"
          >
            Product
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
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
      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-accent transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
        <FolderOpen className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{collection.title}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-primary/50 text-primary"
          >
            Collection
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
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
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">({count})</p>
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
    trpc.product.globalSearch.queryOptions(
      shouldSearch ? searchQuery : skipToken,
    ),
  );

  const products = data?.products ?? [];
  const collections = data?.collections ?? [];
  const hasResults = products.length > 0 || collections.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (isPending && shouldSearch) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSearchQuery) {
    return (
      <div className="text-muted-foreground text-sm text-center py-8">
        Start typing to search...
      </div>
    );
  }

  if (hasSearchQuery && searchQuery.length < 2) {
    return (
      <div className="text-muted-foreground text-sm text-center py-8">
        Type at least 2 characters to search
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-muted-foreground text-sm text-center py-8">
        No results found for "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.length > 0 && (
        <ResultsGroup label="Products" count={products.length}>
          {products.map((product) => (
            <ProductResultItem key={product.id} product={product} />
          ))}
        </ResultsGroup>
      )}
      {collections.length > 0 && (
        <ResultsGroup label="Collections" count={collections.length}>
          {collections.map((collection) => (
            <CollectionResultItem key={collection.id} collection={collection} />
          ))}
        </ResultsGroup>
      )}
    </div>
  );
}

export function GlobalSearch() {
  const { globalSearchParams, closeGlobalSearch, toggleGlobalSearch } =
    useGlobalSearchParams();

  // Keyboard shortcut: Cmd+K or Cmd+/
  useKeypress(toggleGlobalSearch, ["k", "/"], { withMeta: true });

  return (
    <Dialog
      open={globalSearchParams.globalSearchOpen}
      onOpenChange={(open) => {
        if (!open) closeGlobalSearch();
      }}
    >
      <DialogContent className="p-0 gap-0" showCloseButton={false}>
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

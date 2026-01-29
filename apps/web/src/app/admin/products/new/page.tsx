"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useTRPC } from "@/trpc";

export default function NewProductPage() {
  const router = useRouter();
  const hasRedirected = useRef(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  // Check for existing incomplete product
  const { data: incompleteProduct, isLoading: isChecking } = useQuery(
    trpc.product.getIncompleteProduct.queryOptions(),
  );

  // Mutation to create a new product
  const createProduct = useMutation(
    trpc.product.create.mutationOptions({
      onSuccess: (product) => {
        // Invalidate the list cache
        queryClient.invalidateQueries({ queryKey: ["product", "list"] });
        queryClient.invalidateQueries({ queryKey: ["product", "getIncompleteProduct"] });

        // Redirect to edit page
        router.replace(`/admin/products/${product.id}`);
      },
    }),
  );

  useEffect(() => {
    // Prevent double execution
    if (hasRedirected.current) return;

    // Wait for check to complete
    if (isChecking) return;

    // If we have an incomplete product, redirect to it
    if (incompleteProduct) {
      hasRedirected.current = true;
      router.replace(`/admin/products/${incompleteProduct.id}`);
      return;
    }

    // No incomplete product exists, create a new one
    if (!createProduct.isPending && !createProduct.isSuccess) {
      hasRedirected.current = true;
      createProduct.mutate({});
    }
  }, [incompleteProduct, isChecking, createProduct, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isChecking
            ? "Checking for incomplete products..."
            : incompleteProduct
              ? "Resuming product..."
              : "Creating new product..."}
        </p>
      </div>
    </div>
  );
}

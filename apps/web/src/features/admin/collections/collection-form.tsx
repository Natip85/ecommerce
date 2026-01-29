"use client";
"use no memo";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
  Globe,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "@/features/admin/page-title";
import { createAdminCollectionDetailBreadcrumbs } from "@/lib/breadcrumbs";
import { useTRPC } from "@/trpc";
import {
  collectionFormSchema,
  type CollectionForm,
  defaultCollectionForm,
  generateHandle,
} from "@/validation";

type CollectionFormProps = {
  collectionId?: string;
};

export function CollectionForm({ collectionId }: CollectionFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isCreateMode = !collectionId;

  // Track if user has manually edited the handle field
  const handleManuallyEdited = useRef(false);
  // Track if form has been initialized with collection data
  const formInitialized = useRef(false);

  // Fetch collection data (only in edit mode)
  const { data: collection, isLoading: isLoadingCollection } = useQuery({
    ...trpc.collection.getById.queryOptions({ collectionId: collectionId! }),
    enabled: !isCreateMode,
  });

  // Create mutation
  const { mutateAsync: createCollection, isPending: isCreating } = useMutation(
    trpc.collection.create.mutationOptions({
      onSuccess: (newCollection) => {
        queryClient.invalidateQueries({
          queryKey: trpc.collection.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.listCollections.queryKey(),
        });
        toast.success("Collection created");
        router.push(`/admin/collections/${newCollection.id}`);
      },
      onError: (error) => {
        toast.error("Failed to create collection", {
          description: error.message,
        });
      },
    }),
  );

  // Update mutation
  const { mutateAsync: updateCollection, isPending: isUpdating } = useMutation(
    trpc.collection.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collection.getById.queryKey({
            collectionId: collectionId!,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.collection.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.listCollections.queryKey(),
        });
        toast.success("Collection saved");
      },
      onError: (error) => {
        toast.error("Failed to save collection", {
          description: error.message,
        });
      },
    }),
  );

  // Delete mutation
  const { mutateAsync: deleteCollection, isPending: isDeleting } = useMutation(
    trpc.collection.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collection.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.listCollections.queryKey(),
        });
        toast.success("Collection deleted");
        router.push("/admin/collections");
      },
      onError: (error) => {
        toast.error("Failed to delete collection", {
          description: error.message,
        });
      },
    }),
  );

  const isPending = isCreating || isUpdating;

  // Initialize form
  const form = useForm<CollectionForm>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: defaultCollectionForm,
  });

  // Watch title for auto-generating handle
  const titleValue = form.watch("title");

  // Auto-generate handle from title (only if not manually edited)
  useEffect(() => {
    if (
      titleValue &&
      !handleManuallyEdited.current &&
      formInitialized.current
    ) {
      const handle = generateHandle(titleValue);
      form.setValue("handle", handle, { shouldValidate: true });
    }
  }, [titleValue, form]);

  // Initialize form with collection data (edit mode) or mark as initialized (create mode)
  useEffect(() => {
    if (isCreateMode && !formInitialized.current) {
      formInitialized.current = true;
    } else if (collection && !formInitialized.current) {
      formInitialized.current = true;

      // If handle looks auto-generated, don't mark as manually edited
      const expectedHandle = generateHandle(collection.title);
      if (collection.handle !== expectedHandle) {
        handleManuallyEdited.current = true;
      }

      form.reset({
        title: collection.title || "",
        handle: collection.handle || "",
        description: collection.description || "",
        published: collection.published || false,
      });
    }
  }, [collection, form, isCreateMode]);

  async function onSubmit(data: CollectionForm) {
    if (isCreateMode) {
      await createCollection({
        title: data.title,
        handle: data.handle,
        description: data.description || undefined,
        published: data.published,
      });
    } else {
      await updateCollection({
        collectionId: collectionId!,
        title: data.title,
        handle: data.handle,
        description: data.description || undefined,
        published: data.published,
      });
    }
  }

  async function handleDelete() {
    await deleteCollection({ collectionId: collectionId! });
    setShowDeleteDialog(false);
  }

  // Loading state (only in edit mode)
  if (!isCreateMode && isLoadingCollection) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Not found state (only in edit mode)
  if (!isCreateMode && !collection) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Collection not found</p>
          <Button asChild variant="outline">
            <Link href="/admin/collections">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const pageTitle = isCreateMode
    ? "New Collection"
    : collection?.title || "Edit Collection";
  const breadcrumbs = isCreateMode
    ? [
        { href: "/admin", label: "Admin" },
        { href: "/admin/collections", label: "Collections" },
        { href: "/admin/collections/new", label: "New Collection" },
      ]
    : createAdminCollectionDetailBreadcrumbs(
        collectionId!,
        collection?.title || "Edit Collection",
      );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4 py-6 pr-4.5 pl-6"
      >
        {/* Header */}
        <Breadcrumbs pages={breadcrumbs} className="mb-2" />
        <PageTitle
          title={pageTitle}
          statusBadge={
            isCreateMode
              ? undefined
              : collection?.published
                ? "Published"
                : "Draft"
          }
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/collections">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            {!isCreateMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {collection?.published && (
                    <DropdownMenuItem asChild>
                      <a
                        href={`/collections/${collection.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View on storefront
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreateMode ? "Create" : "Save"}
            </Button>
          </div>
        </PageTitle>

        {/* Main Content */}
        <div className="grid flex-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Details</CardTitle>
                <CardDescription>
                  Basic information about this collection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Summer Collection"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handle</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            /collections/
                          </span>
                          <Input
                            placeholder="summer-collection"
                            disabled={isPending}
                            {...field}
                            onChange={(e) => {
                              handleManuallyEdited.current = true;
                              field.onChange(e);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this collection..."
                          className="min-h-[120px] resize-y"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Products in Collection (edit mode only) */}
            {!isCreateMode && collection && (
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Products included in this collection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {collection.products && collection.products.length > 0 ? (
                    <div className="space-y-2">
                      {collection.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-md border">
                            {product.image?.url ? (
                              <Image
                                src={product.image.url}
                                alt={product.image.alt || product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="text-muted-foreground h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-medium hover:underline"
                            >
                              {product.title}
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No products in this collection
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add products to this collection from the product edit
                        page
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Publishing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Show this collection on the storefront
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {collection?.published && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`/collections/${collection.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View on storefront
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats Card (edit mode only) */}
            {!isCreateMode && collection && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Products
                    </span>
                    <Badge variant="secondary">{collection.productCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Created
                    </span>
                    <span className="text-sm">
                      {new Date(collection.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Updated
                    </span>
                    <span className="text-sm">
                      {new Date(collection.updatedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      {!isCreateMode && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete collection?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{collection?.title}&quot;?
                Products will be removed from this collection but not deleted.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Form>
  );
}

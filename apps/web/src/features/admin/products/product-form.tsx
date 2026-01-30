"use client";
"use no memo";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  Copy,
  Eye,
  Globe,
  GripVertical,
  Info,
  Loader2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { ProductForm, ProductOption, ProductVariant } from "@/validation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createAdminProductDetailBreadcrumbs } from "@/lib/breadcrumbs";
import { useTRPC } from "@/trpc";
import {
  defaultProductForm,
  generateHandle,
  generateVariants,
  productFormSchema,
} from "@/validation";
import { ProductImageUpload } from "./add-product-image";
import { OptionsEditor } from "./options-editor";
import { VariantsTable } from "./variants-table";

type ProductFormProps = {
  productId: string;
};

export function ProductForm({ productId }: ProductFormProps) {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [isEditingSeo, setIsEditingSeo] = useState(false);
  // Track if user has manually edited the handle field
  const handleManuallyEdited = useRef(false);
  // Track if form has been initialized with product data
  const formInitialized = useRef(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch product data
  const { data: product, isLoading: isLoadingProduct } = useQuery(
    trpc.product.getById.queryOptions({ productId })
  );

  // Update mutation
  const { mutateAsync: updateProduct, isPending } = useMutation(
    trpc.product.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.getById.queryKey({ productId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        toast.success("Product saved");
      },
      onError: (error) => {
        toast.error("Failed to save product", {
          description: error.message,
        });
      },
    })
  );

  // Delete image mutation
  const { mutateAsync: deleteImage } = useMutation(
    trpc.product.deleteImage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.getById.queryKey({ productId }),
        });
      },
      onError: (error) => {
        toast.error("Failed to delete image", {
          description: error.message,
        });
      },
    })
  );

  async function handleDeleteImage(imageId: string) {
    // Optimistically remove from UI
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    // Delete from database
    await deleteImage({ imageId });
  }

  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductForm,
  });

  // Fetch available collections
  const { data: availableCollections } = useQuery(trpc.product.listCollections.queryOptions());

  // Fetch available tags
  const { data: availableTags } = useQuery(trpc.product.storefrontTags.queryOptions());

  // Populate form with product data when loaded
  useEffect(() => {
    if (product && !formInitialized.current) {
      formInitialized.current = true;

      // Always preserve existing handle when loading a product
      // This prevents the auto-generate effect from overwriting unique handles
      if (product.handle) {
        handleManuallyEdited.current = true;
      }

      // Extract metadata if it exists
      const metadata = product.metadata as
        | { metaTitle?: string; metaDescription?: string }
        | null
        | undefined;

      // Extract default variant data
      const variant = product.defaultVariant;

      // Parse options and variants from product data
      const productOptions = (product as { options?: ProductOption[] }).options || [];
      // Variants are already transformed by the API to form format
      const productVariants = (product as { variants?: ProductVariant[] }).variants || [];

      form.reset({
        title: product.title || "",
        handle: product.handle || "",
        description: product.description || "",
        price: variant?.price || "",
        compareAtPrice: variant?.compareAtPrice || "",
        chargeTax: variant?.chargeTax ?? true,
        sku: variant?.sku || "",
        barcode: variant?.barcode || "",
        trackQuantity: variant?.inventoryTracked ?? true,
        quantity: String(variant?.inventoryQuantity ?? 0),
        continueSellingWhenOutOfStock: variant?.continueSellingWhenOutOfStock ?? false,
        options: productOptions,
        variants: productVariants,
        productType: product.productType || "",
        vendor: product.vendor || "",
        tags: product.tags?.join(", ") || "",
        collections: product.collections || [],
        status: product.status || "draft",
        published: product.published || false,
        metaTitle: metadata?.metaTitle || "",
        metaDescription: metadata?.metaDescription || "",
      });

      // Set images from product
      if (product.images) {
        setImages(product.images.map((img) => ({ id: img.id, url: img.url })));
      }
    }
  }, [product, form]);

  const titleValue = useWatch({ control: form.control, name: "title" });
  const statusValue = useWatch({ control: form.control, name: "status" });
  const handleValue = useWatch({ control: form.control, name: "handle" });
  const descriptionValue = useWatch({
    control: form.control,
    name: "description",
  });
  const metaTitleValue = useWatch({ control: form.control, name: "metaTitle" });
  const metaDescriptionValue = useWatch({
    control: form.control,
    name: "metaDescription",
  });
  const publishedValue = useWatch({ control: form.control, name: "published" });
  const optionsValue = useWatch({ control: form.control, name: "options" }) || [];
  const variantsValue = useWatch({ control: form.control, name: "variants" }) || [];

  // Check if product has variants (more than just the default)
  const hasVariants =
    optionsValue.length > 0 && optionsValue.some((o: ProductOption) => o.values.length > 0);

  // Handler for options changes - regenerates variants
  const handleOptionsChange = useCallback(
    (newOptions: ProductOption[]) => {
      form.setValue("options", newOptions);
      // Regenerate variants from new options, preserving existing data
      const currentVariants = form.getValues("variants") || [];
      const newVariants = generateVariants(newOptions, currentVariants);
      form.setValue("variants", newVariants);
    },
    [form]
  );

  // Handler for variants changes
  const handleVariantsChange = useCallback(
    (newVariants: ProductVariant[]) => {
      form.setValue("variants", newVariants);
    },
    [form]
  );

  // Auto-generate handle from title (only when handle not manually edited and title changes)
  useEffect(() => {
    if (titleValue && !handleManuallyEdited.current) {
      const generatedHandle = generateHandle(titleValue);
      form.setValue("handle", generatedHandle);
    }
  }, [titleValue, form]);

  async function handleFormSubmit(data: ProductForm) {
    try {
      // Only include metadata if there's actual SEO content
      const hasMetadata = data.metaTitle || data.metaDescription;
      const metadata =
        hasMetadata ?
          {
            metaTitle: data.metaTitle || undefined,
            metaDescription: data.metaDescription || undefined,
          }
        : undefined;

      // Parse tags from comma-separated string to array
      const tagsArray =
        data.tags ?
          data.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [];

      // Check if we have variants (options with values)
      const hasProductVariants =
        data.options && data.options.length > 0 && data.options.some((o) => o.values.length > 0);

      await updateProduct({
        productId,
        title: data.title,
        handle: data.handle,
        description: data.description || undefined,
        vendor: data.vendor || undefined,
        productType: data.productType || undefined,
        status: data.status,
        creationStatus: "completed", // Mark product creation as complete
        published: data.published,
        tags: tagsArray,
        collections: data.collections || [],
        metadata,
        // Include options and variants if they exist
        options: data.options,
        variants:
          hasProductVariants ?
            data.variants?.map((v) => ({
              id: v.id,
              optionValues: v.optionValues,
              price: v.price || "0",
              compareAtPrice: v.compareAtPrice || undefined,
              sku: v.sku || undefined,
              quantity: v.quantity ? parseInt(v.quantity, 10) : 0,
            }))
          : undefined,
        // Only include default variant data when no variants exist
        variant:
          !hasProductVariants ?
            {
              price: data.price || undefined,
              // Always send compareAtPrice (even empty string) so API can clear it
              compareAtPrice: data.compareAtPrice,
              sku: data.sku || undefined,
              barcode: data.barcode || undefined,
              inventoryQuantity: data.quantity ? parseInt(data.quantity, 10) : 0,
              inventoryTracked: data.trackQuantity,
              chargeTax: data.chargeTax,
              continueSellingWhenOutOfStock: data.continueSellingWhenOutOfStock,
            }
          : undefined,
      });
    } catch (_error) {
      // Error handled by mutation's onError
    } finally {
      // Error handled by mutation's onError
    }
  }

  if (isLoadingProduct) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentStatus = product?.status ?? "draft";
  const statusBadgeVariant = currentStatus === "active" ? "default" : "secondary";
  const statusBadgeText = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <Breadcrumbs
            pages={createAdminProductDetailBreadcrumbs(productId, product?.title)}
            className="mb-6 pt-6 pl-6"
          />
          <div className="min-h-screen">
            {/* Top Header Bar */}
            <header className="bg-background sticky top-0 z-50 border-b">
              <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href="/admin/products">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Back to products</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold">{product?.title}</h1>
                    <Badge
                      variant={statusBadgeVariant}
                      className="text-xs font-normal"
                    >
                      {statusBadgeText}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
                {/* Left Column - Main Content */}
                <div className="space-y-6">
                  {/* Title & Description Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Short sleeve t-shirt"
                                  className="h-10"
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
                                <Input
                                  placeholder="short-sleeve-t-shirt"
                                  className="h-10"
                                  {...field}
                                  onChange={(e) => {
                                    handleManuallyEdited.current = true;
                                    field.onChange(e);
                                  }}
                                />
                              </FormControl>
                              <p className="text-muted-foreground text-xs">
                                URL-friendly identifier. Auto-generated from title.
                              </p>
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
                                  placeholder="Write a description..."
                                  rows={6}
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-muted-foreground text-xs">
                                Describe your product in detail. This will appear on the product
                                page.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Media Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {images.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {images.map((image, index) => (
                              <div
                                key={image.id}
                                className="bg-muted group relative aspect-square overflow-hidden rounded-lg border"
                              >
                                <Image
                                  src={image.url || "/placeholder.svg"}
                                  alt={`Product image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <div className="bg-background/80 absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteImage(image.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {index === 0 && (
                                  <Badge className="absolute top-2 left-2 text-[10px]">Main</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <ProductImageUpload
                          productId={productId}
                          onImagesUploaded={(uploadedImages) => {
                            const newImages = uploadedImages.map((file) => ({
                              id: file.serverData.imageId,
                              url: file.ufsUrl,
                            }));
                            setImages((prev) => [...prev, ...newImages]);
                            queryClient.invalidateQueries({
                              queryKey: trpc.product.getById.queryKey({
                                productId,
                              }),
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pricing Card - only show when no variants */}
                  {!hasVariants && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Pricing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                                      $
                                    </span>
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      className="pl-7"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="compareAtPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                  Compare-at price
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">
                                        To display a reduced price, set a higher compare-at price.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                                      $
                                    </span>
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      className="pl-7"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Separator className="my-4" />
                        <FormField
                          control={form.control}
                          name="chargeTax"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-y-0 space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm leading-none font-normal">
                                Charge tax on this product
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory Card - only show when no variants */}
                  {!hasVariants && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Inventory</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="SKU-001"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="barcode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Barcode (ISBN, UPC, GTIN, etc.)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="12345678901234"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Separator />
                        <FormField
                          control={form.control}
                          name="trackQuantity"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Track quantity</FormLabel>
                                <p className="text-muted-foreground text-xs">
                                  Track inventory for this product
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="w-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="continueSellingWhenOutOfStock"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-y-0 space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm leading-none font-normal">
                                Continue selling when out of stock
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Options Editor */}
                  <OptionsEditor
                    options={optionsValue}
                    onChange={handleOptionsChange}
                    disabled={isPending}
                  />

                  {/* Variants Table - only show when there are variants */}
                  {hasVariants && (
                    <VariantsTable
                      options={optionsValue}
                      variants={variantsValue}
                      onChange={handleVariantsChange}
                      disabled={isPending}
                    />
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              key={statusValue}
                              onValueChange={field.onChange}
                              defaultValue={statusValue}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-muted-foreground h-2 w-2 rounded-full" />
                                    Draft
                                  </div>
                                </SelectItem>
                                <SelectItem value="active">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    Active
                                  </div>
                                </SelectItem>
                                <SelectItem value="archived">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    Archived
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Categorization Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Categorization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="productType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. T-Shirts"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vendor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Nike"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <MultiSelect
                              values={(field.value ?? "")
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)}
                              onValuesChange={(values) => field.onChange(values.join(", "))}
                            >
                              <FormControl>
                                <MultiSelectTrigger
                                  className="w-full"
                                  disabled={isPending}
                                >
                                  <MultiSelectValue placeholder="Select tags..." />
                                </MultiSelectTrigger>
                              </FormControl>
                              <MultiSelectContent
                                search={{
                                  placeholder: "Search or create tags...",
                                  emptyMessage: "No tags found.",
                                }}
                                creatable={{
                                  formatCreateLabel: (value) => (
                                    <span>
                                      Create tag &quot;<strong>{value}</strong>
                                      &quot;
                                    </span>
                                  ),
                                }}
                              >
                                <MultiSelectGroup heading="Tags">
                                  {Array.from(
                                    new Set([
                                      ...((availableTags ?? []).map((t) => t.value) ?? []),
                                      ...((field.value ?? "")
                                        .split(",")
                                        .map((t) => t.trim())
                                        .filter(Boolean) ?? []),
                                    ])
                                  ).map((tagValue) => (
                                    <MultiSelectItem
                                      key={tagValue}
                                      value={tagValue}
                                    >
                                      {tagValue}
                                    </MultiSelectItem>
                                  ))}
                                </MultiSelectGroup>
                              </MultiSelectContent>
                            </MultiSelect>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collections"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collections</FormLabel>
                            {availableCollections && availableCollections.length > 0 ?
                              <MultiSelect
                                values={field.value ?? []}
                                onValuesChange={field.onChange}
                              >
                                <FormControl>
                                  <MultiSelectTrigger
                                    className="w-full"
                                    disabled={isPending}
                                  >
                                    <MultiSelectValue placeholder="Select collections..." />
                                  </MultiSelectTrigger>
                                </FormControl>
                                <MultiSelectContent
                                  search={{
                                    placeholder: "Search collections...",
                                    emptyMessage: "No collections found.",
                                  }}
                                >
                                  <MultiSelectGroup heading="Collections">
                                    {availableCollections.map((collection) => (
                                      <MultiSelectItem
                                        key={collection.id}
                                        value={collection.id}
                                      >
                                        {collection.title}
                                      </MultiSelectItem>
                                    ))}
                                  </MultiSelectGroup>
                                </MultiSelectContent>
                              </MultiSelect>
                            : <p className="text-muted-foreground text-sm">
                                No collections available. Create collections to organize products.
                              </p>
                            }
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Publishing Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Publishing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Sales channels</p>
                        <p className="text-muted-foreground text-xs">
                          {publishedValue ? "Online Store" : "Not published to any channels"}
                        </p>
                      </div>
                      <Separator />
                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div className="flex items-center gap-2">
                              <Globe className="text-muted-foreground h-4 w-4" />
                              <FormLabel className="text-sm font-normal">Online Store</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Search Engine Listing Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Search engine listing</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingSeo(!isEditingSeo)}
                        >
                          {isEditingSeo ? "Done" : "Edit"}
                        </Button>
                      </div>
                      <CardDescription>
                        Add a title and description to see how this product might appear in search
                        engine listings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditingSeo ?
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="metaTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Page title</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={titleValue || "Product title"}
                                    {...field}
                                  />
                                </FormControl>
                                <p className="text-muted-foreground text-xs">
                                  {(field.value || "").length}/70 characters
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="metaDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={
                                      descriptionValue ||
                                      "Enter a description for search engines..."
                                    }
                                    rows={3}
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <p className="text-muted-foreground text-xs">
                                  {(field.value || "").length}/160 characters
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      : <div className="bg-muted/50 space-y-1 rounded-lg border p-4">
                          <p className="text-lg text-[#1a0dab]">
                            {metaTitleValue || titleValue || "Product title"}
                          </p>
                          <p className="text-sm text-[#006621]">
                            https://yourstore.com/products/
                            {handleValue || "product-handle"}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {metaDescriptionValue ||
                              descriptionValue ||
                              "Product description will appear here..."}
                          </p>
                        </div>
                      }
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}

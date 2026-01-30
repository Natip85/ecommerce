"use client";

import { toast } from "sonner";

import type { ProductImageUploadResponse } from "@/lib/uploadthing";
import { UploadDropzone } from "@/lib/uploadthing";

type Props = {
  productId: string;
  onImagesUploaded: (images: ProductImageUploadResponse) => void;
};

export function ProductImageUpload({ productId, onImagesUploaded }: Props) {
  return (
    <UploadDropzone
      endpoint="productImage"
      // @ts-expect-error - input prop exists when using .input() in router but types don't infer correctly
      input={{ productId }}
      config={{ mode: "auto" }}
      onClientUploadComplete={(res) => {
        onImagesUploaded(res as ProductImageUploadResponse);
        toast.success(
          res.length === 1 ?
            "Image uploaded successfully"
          : `${res.length} images uploaded successfully`
        );
      }}
      onUploadError={(error: Error) => {
        toast.error(`Upload failed: ${error.message}`);
      }}
    />
  );
}

import { insertProductImage } from "@ecommerce/api/routers/product";
import { auth } from "@ecommerce/auth";
import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
 /**
  * Product image uploader - for admin product management
  */
 productImage: f({
  image: {
   maxFileSize: "4MB",
   maxFileCount: 10,
  },
 })
  .input(z.object({ productId: z.string().uuid() }))
  .middleware(async ({ input }) => {
   const session = await auth.api.getSession({ headers: await headers() });

   if (!session?.user) {
    throw new UploadThingError("Unauthorized");
   }

   // Only admins can upload product images
   if (session.user.role !== "admin") {
    throw new UploadThingError("Admin access required");
   }

   return {
    userId: session.user.id,
    productId: input.productId,
   };
  })
  .onUploadComplete(async ({ metadata, file }) => {
   console.log("Product image upload complete:", {
    userId: metadata.userId,
    productId: metadata.productId,
    fileKey: file.key,
   });

   if (!metadata.userId) {
    console.error("User ID is required", { metadata, file });
    throw new UploadThingError("User ID is required");
   }

   if (!metadata.productId) {
    console.error("Product ID is required", { metadata, file });
    throw new UploadThingError("Product ID is required");
   }

   const insertedImage = await insertProductImage({
    productId: metadata.productId,
    url: file.ufsUrl,
   });

   return {
    uploadedBy: metadata.userId,
    imageId: insertedImage.id,
    url: file.ufsUrl,
    key: file.key,
    position: insertedImage.position,
   };
  }),

 /**
  * Generic image uploader - for general use
  */
 imageUploader: f({
  image: {
   maxFileSize: "4MB",
   maxFileCount: 10,
  },
 })
  .middleware(async () => {
   const session = await auth.api.getSession({ headers: await headers() });

   if (!session?.user) {
    throw new UploadThingError("Unauthorized");
   }

   return { userId: session.user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
   console.log("Image upload complete for userId:", metadata.userId);

   return {
    uploadedBy: metadata.userId,
    url: file.ufsUrl,
    key: file.key,
   };
  }),

 /**
  * Profile image uploader - for user profile pictures
  */
 profileImage: f({
  image: {
   maxFileSize: "2MB",
   maxFileCount: 1,
  },
 })
  .middleware(async () => {
   const session = await auth.api.getSession({ headers: await headers() });

   if (!session?.user) {
    throw new UploadThingError("Unauthorized");
   }

   return {
    userId: session.user.id,
    currentImage: session.user.image,
   };
  })
  .onUploadComplete(async ({ metadata, file }) => {
   console.log("Profile image upload complete for userId:", metadata.userId);

   // TODO: Update user profile image in database
   // TODO: Delete old profile image if exists

   return {
    uploadedBy: metadata.userId,
    url: file.ufsUrl,
    key: file.key,
   };
  }),
};

export type OurFileRouter = typeof ourFileRouter;

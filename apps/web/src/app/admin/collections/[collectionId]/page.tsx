import { CollectionForm } from "@/features/admin/collections/collection-form";

type Props = {
  params: Promise<{ collectionId: string }>;
};

export default async function CollectionPage({ params }: Props) {
  const { collectionId } = await params;
  return <CollectionForm collectionId={collectionId} />;
}

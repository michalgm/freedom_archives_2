import { useParams } from "react-router";
import { Collection } from "src/components/Collection";

export default function CollectionView() {
  const { id } = useParams();
  console.log("CollectionView id:", id);

  return <Collection id={id} />;
}
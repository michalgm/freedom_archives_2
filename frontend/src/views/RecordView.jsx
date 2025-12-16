import { useParams } from "react-router";
import { Record } from "src/components/Record";

export default function RecordView() {
  const { id } = useParams();

  return <Record id={id} />;
}
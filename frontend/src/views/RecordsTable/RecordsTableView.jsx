import { lazy, Suspense } from "react";

const Table = lazy(() => import("./RecordsTable.jsx"));
export default function TableView() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Table />
    </Suspense>
  );
}
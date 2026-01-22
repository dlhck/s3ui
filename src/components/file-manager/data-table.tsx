"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { FolderOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { S3Object } from "@/lib/s3/types";

interface DataTableProps {
  columns: ColumnDef<S3Object>[];
  data: S3Object[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  onRowDoubleClick?: (object: S3Object) => void;
}

export function DataTable({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  onRowDoubleClick,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(newSelection);
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getRowId: (row) => row.key,
  });

  const filterValue =
    (table.getColumn("name")?.getFilterValue() as string) ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Filter files..."
          value={filterValue}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FolderOpen className="h-8 w-8" />
                    <p>No results found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>
  );
}

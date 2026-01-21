"use client";

import type { BaseRecord, HttpError } from "@refinedev/core";
import type { UseTableReturnType } from "@refinedev/react-table";
import type { Column } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";

type DataTableProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>;
  onRowEnter?: (row: TData) => void;
};

export function DataTable<TData extends BaseRecord>({
  table,
  onRowEnter
}: DataTableProps<TData>) {
  const {
    reactTable: { getHeaderGroups, getRowModel, getAllColumns },
    refineCore: {
      tableQuery,
      currentPage,
      setCurrentPage,
      pageCount,
      pageSize,
      setPageSize,
    },
  } = table;
  const columns = getAllColumns();
  const leafColumns = table.reactTable.getAllLeafColumns();
  const isLoading = tableQuery.isLoading || tableQuery.isFetching;
  const hasRowSelection = table.reactTable.options.enableRowSelection;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isOverflowing, setIsOverflowing] = useState({
    horizontal: false,
    vertical: false,
  });

  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Move Down
  useHotkeys("arrowdown", (e) => {
    setActiveIndex((prev) => (prev < getRowModel().rows.length - 1 ? prev + 1 : prev));
  });

  // 2. Move Up
  useHotkeys("arrowup", (e) => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
  });

  // 3.Move Left (Previous Page)
  useHotkeys("arrowleft", (e) => {
    e.preventDefault();
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  });

  // 3. Move Right (Next Page)
  useHotkeys("arrowright", (e) => {
    e.preventDefault();
    setCurrentPage((prev) => (prev < pageCount ? prev + 1 : prev));
  });

  // 3. Toggle Selection (Space)
  useHotkeys("space", (e) => {
    e.preventDefault();
    getRowModel().rows[activeIndex].toggleSelected();
  });

  //On Enter
  useHotkeys("enter", (e) => {
    e.preventDefault();
    onRowEnter?.(getRowModel().rows[activeIndex].original);
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (tableRef.current && tableContainerRef.current) {
        const table = tableRef.current;
        const container = tableContainerRef.current;

        const horizontalOverflow = table.offsetWidth > container.clientWidth;
        const verticalOverflow = table.offsetHeight > container.clientHeight;

        setIsOverflowing({
          horizontal: horizontalOverflow,
          vertical: verticalOverflow,
        });
      }
    };

    checkOverflow();

    // Check on window resize
    window.addEventListener("resize", checkOverflow);

    // Check when table data changes
    const timeoutId = setTimeout(checkOverflow, 100);
    table?.reactTable?.resetRowSelection();
    if (currentPage > pageCount) {
      setCurrentPage(1);
    }
    setActiveIndex(0);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [tableQuery.data?.data, pageSize]);

  return (
    <div className={cn("flex", "flex-col", "flex-1", "gap-4")}>
      <div ref={tableContainerRef} className={cn("rounded-md", "border")}>
        <Table ref={tableRef} style={{ tableLayout: "fixed", width: "100%" }}>
          <TableHeader>
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {hasRowSelection && (
                  <TableHead
                    style={{
                      width: 50,
                      minWidth: 50,
                      maxWidth: 50,
                      position: isOverflowing.horizontal ? "sticky" : "relative",
                      left: 0,
                      background: isOverflowing.horizontal ? "var(--background)" : "",
                      boxShadow: isOverflowing.horizontal ? "-4px 0 4px -4px var(--border) inset" : undefined,
                      zIndex: isOverflowing.horizontal ? 1 : 0,
                    }}
                    className="pl-4"
                  >
                    <Checkbox
                      checked={
                        table.reactTable.getIsAllPageRowsSelected() ||
                        (table.reactTable.getIsSomePageRowsSelected() && "indeterminate")
                      }
                      onCheckedChange={(value) => table.reactTable.toggleAllPageRowsSelected(!!value)}
                      aria-label="Select all"
                      className="border-gray-500"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header, i) => {
                  const isPlaceholder = header.isPlaceholder;
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...getCommonStyles({
                          column: header.column,
                          isOverflowing: isOverflowing,
                        })
                      }}
                      className={!hasRowSelection && i == 0 ? "pl-4" : ""}
                    >
                      {isPlaceholder ? null : (
                        <div className={cn("flex", "items-center", "gap-1")}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="relative">
            {isLoading ? (
              <>
                {Array.from({ length: pageSize < 1 ? 1 : pageSize }).map(
                  (_, rowIndex) => (
                    <TableRow
                      key={`skeleton-row-${rowIndex}`}
                      aria-hidden="true"
                    >
                      {hasRowSelection && (
                        <TableCell
                          style={{
                            width: 50,
                            minWidth: 50,
                            maxWidth: 50,
                            position: isOverflowing.horizontal ? "sticky" : "relative",
                            left: 0,
                            background: isOverflowing.horizontal ? "var(--background)" : "",
                            zIndex: isOverflowing.horizontal ? 1 : 0,
                          }}
                          className="pl-4"
                        >
                          <div className="h-8" />
                        </TableCell>
                      )}
                      {leafColumns.map((column) => (
                        <TableCell
                          key={`skeleton-cell-${rowIndex}-${column.id}`}
                          style={{
                            ...getCommonStyles({
                              column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                          className={cn("truncate")}
                        >
                          <div className="h-8" />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )}
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (hasRowSelection ? 1 : 0)}
                    className={cn("absolute", "inset-0", "pointer-events-none")}
                  >
                    <Loader2
                      className={cn(
                        "absolute",
                        "top-1/2",
                        "left-1/2",
                        "animate-spin",
                        "text-primary",
                        "h-8",
                        "w-8",
                        "-translate-x-1/2",
                        "-translate-y-1/2"
                      )}
                    />
                  </TableCell>
                </TableRow>
              </>
            ) : getRowModel().rows?.length ? (
              getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.original?.id ?? row.id}
                    className={cn(row.index === activeIndex ? "bg-accent shadow-[inset_4px_0_0_0_theme(colors.primary.DEFAULT)]" : "", //hover:bg-transparent
                      "hover:cursor-pointer"
                    )}
                    onClick={() => onRowEnter?.(row?.original)}
                  // data-state={(row.getIsSelected() || activeIndex === row.index) && "selected"}
                  >
                    {hasRowSelection && (
                      <TableCell
                        style={{
                          width: 50,
                          minWidth: 50,
                          maxWidth: 50,
                          position: isOverflowing.horizontal ? "sticky" : "relative",
                          left: 0,
                          background: isOverflowing.horizontal ? "var(--background)" : "",
                          zIndex: isOverflowing.horizontal ? 1 : 0,
                        }}
                        onClick={(e) => {
                          e.stopPropagation(); // This stops the 'click' from reaching the TableRow
                        }}
                        className="pl-4"
                      >
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(value) => { row.toggleSelected(!!value); setActiveIndex(row.index) }}
                          aria-label="Select row"
                          className="border-gray-500"
                        />
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell, i) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonStyles({
                              column: cell.column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                          className={cn(!hasRowSelection && i == 0 ? "pl-4" : "")}
                        >
                          <div className="truncate" title={(cell.getValue() || "").toString()}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <DataTableNoData
                isOverflowing={isOverflowing}
                columnsLength={columns.length + (hasRowSelection ? 1 : 0)}
              />
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && getRowModel().rows?.length > 0 && pageCount > 0 && pageSize > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          pageCount={pageCount}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={tableQuery.data?.total}
        />
      )}
    </div>
  );
}

function DataTableNoData({
  isOverflowing,
  columnsLength,
}: {
  isOverflowing: { horizontal: boolean; vertical: boolean };
  columnsLength: number;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={columnsLength}
        className={cn("relative", "text-center")}
        style={{ height: "200px" }}
      >
        <div
          className={cn(
            "absolute",
            "inset-0",
            "flex",
            "flex-col",
            "items-center",
            "justify-center",
            "gap-2",
            "bg-background"
          )}
          style={{
            position: isOverflowing.horizontal ? "sticky" : "absolute",
            left: isOverflowing.horizontal ? "50%" : "50%",
            transform: "translateX(-50%)",
            zIndex: isOverflowing.horizontal ? 2 : 1,
            width: isOverflowing.horizontal ? "fit-content" : "100%",
            minWidth: "300px",
          }}
        >
          <div className={cn("text-lg", "font-semibold", "text-foreground")}>
            No data to display
          </div>
          <div className={cn("text-sm", "text-muted-foreground")}>
            This table is empty for the time being.
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function getCommonStyles<TData>({
  column,
  isOverflowing,
}: {
  column: Column<TData>;
  isOverflowing: {
    horizontal: boolean;
    vertical: boolean;
  };
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");
  return {
    boxShadow:
      isOverflowing.horizontal && isLastLeftPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isOverflowing.horizontal && isFirstRightPinnedColumn
          ? "4px 0 4px -4px var(--border) inset"
          : undefined,
    left:
      isOverflowing.horizontal && isPinned === "left"
        ? `${column.getStart("left")}px`
        : undefined,
    right:
      isOverflowing.horizontal && isPinned === "right"
        ? `${column.getAfter("right")}px`
        : undefined,
    opacity: 1,
    position: isOverflowing.horizontal && isPinned ? "sticky" : "relative",
    background: isOverflowing.horizontal && isPinned ? "var(--background)" : "",
    borderTopRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderBottomRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderTopLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    borderBottomLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    width: column.getSize(),
    zIndex: isOverflowing.horizontal && isPinned ? 1 : 0,
  };
}

DataTable.displayName = "DataTable";

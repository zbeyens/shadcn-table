/* eslint-disable */
'use client';

import * as React from 'react';


import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import {DataTableFilterField} from "@/types";
import {useDebounce} from "@/hooks/use-debounce";


interface UseDataTableProps<TData, TValue> {
  /**
   * The columns of the table.
   *
   * @default [ ]
   * @type ColumnDef<TData, TValue>[]
   */
  columns: ColumnDef<TData, TValue>[];

  /**
   * The data for the table.
   *
   * @default [ ]
   * @type TData[]
   */
  data: TData[];

  defaultPageSize?: number;
  defaultSort?: string;

  /**
   * Enable notion like column filters. Advanced filters and column filters
   * cannot be used at the same time.
   *
   * @default false
   * @type boolean
   */
  enableAdvancedFilter?: boolean;

  /**
   * Defines filter fields for the table. Supports both dynamic faceted filters
   * and search filters.
   *
   * - Faceted filters are rendered when `options` are provided for a filter
   *   field.
   * - Otherwise, search filters are rendered.
   *
   * The indie filter field `value` represents the corresponding column name in
   * the database table.
   *
   * @example
   *   ```ts
   *   // Render a search filter
   *   const filterFields = [
   *     { label: "Title", value: "title", placeholder: "Search titles" }
   *   ];
   *   // Render a faceted filter
   *   const filterFields = [
   *     {
   *       label: "Status",
   *       value: "status",
   *       options: [
   *         { label: "Todo", value: "todo" },
   *         { label: "In Progress", value: "in-progress" },
   *         { label: "Done", value: "done" },
   *         { label: "Canceled", value: "canceled" }
   *       ]
   *     }
   *   ];
   *   ```;
   *
   * @default [ ]
   * @type {label: string, value: keyof TData, placeholder?: string, options?: { label: string, value: string, icon?: React.ComponentType<{ className?: string }> }[]}
   */
  filterFields?: DataTableFilterField<TData>[];

  /**
   * The number of pages in the table.
   *
   * @type number
   */
  pageCount?: number;
}

export function useDataTable<TData, TValue>({
  columns,
  data,
  defaultPageSize = 10,
  defaultSort = 'createdAt.desc',
  enableAdvancedFilter = false,
  filterFields = [],
  pageCount = 1,
}: UseDataTableProps<TData, TValue>) {
  const searchParams = useSearchParams();
  // const queryState: Record<string, any> = Object.fromEntries(
  //   searchParams.entries()
  // );
  // queryState.pageIndex = queryState.pageIndex ?? 0;
  // queryState.pageSize = queryState.pageSize ?? defaultPageSize;
  // queryState.sort = queryState.sort ?? defaultSort;

  const keyMap: Parameters<typeof useQueryStates>[0] = {};
  filterFields.forEach(({ value }) => {
    keyMap[value] = parseAsString;
  });

  const [queryState, setQueryState] = useQueryStates(
    {
      ...keyMap,
      pageIndex: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(defaultPageSize),
      sort: parseAsString.withDefault(defaultSort),
    }
    // { history: 'push' }
  );

  // Search params
  const [column, order] = queryState.sort?.split('.') ?? [];

  // Memoize computation of searchableColumns and filterableColumns
  const { filterableColumns, searchableColumns } = React.useMemo(() => {
    return {
      filterableColumns: filterFields.filter((field) => field.options),
      searchableColumns: filterFields.filter((field) => !field.options),
    };
  }, [filterFields]);

  // Initial column filters
  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    return Object.keys(queryState).reduce<ColumnFiltersState>(
      (filters, key) => {
        const value = (queryState as any)[key];

        const filterableColumn = filterableColumns.find(
          (column) => column.value === key
        );
        const searchableColumn = searchableColumns.find(
          (column) => column.value === key
        );

        if (value?.length && filterableColumn) {
          filters.push({
            id: key,
            value: value.split('.'),
          });
        } else if (value?.length && searchableColumn) {
          filters.push({
            id: key,
            value: [value],
          });
        }

        return filters;
      },
      []
    );
  }, [queryState, filterableColumns, searchableColumns]);

  // Table states
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] =
    React.useState<PaginationState>({
      pageIndex: queryState.pageIndex,
      pageSize: queryState.pageSize,
    });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  React.useEffect(() => {
    void setQueryState(
      {
        ...queryState,
        pageIndex,
        pageSize,
      },
      {
        scroll: false,
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  // Handle server-side sorting
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      desc: order === 'desc',
      id: column ?? '',
    },
  ]);

  React.useEffect(() => {
    void setQueryState({
      ...queryState,
      sort: sorting[0]?.id
        ? `${sorting[0]?.id}.${sorting[0]?.desc ? 'desc' : 'asc'}`
        : null,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  // Handle server-side filtering
  const debouncedSearchableColumnFilters = JSON.parse(
    useDebounce(
      JSON.stringify(
        columnFilters.filter((filter) => {
          return searchableColumns.find((column) => column.value === filter.id);
        })
      ),
      500
    )
  ) as ColumnFiltersState;

  const filterableColumnFilters = columnFilters.filter((filter) => {
    return filterableColumns.find((column) => column.value === filter.id);
  });

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Opt out when advanced filter is enabled, because it contains additional params
    if (enableAdvancedFilter) return;
    // Prevent resetting the page on initial render
    if (!mounted) {
      setMounted(true);

      return;
    }

    // Initialize new params
    const newParamsObject = {
      pageIndex: 0,
    };

    // Handle debounced searchable column filters
    for (const column of debouncedSearchableColumnFilters) {
      if (typeof column.value === 'string') {
        Object.assign(newParamsObject, {
          [column.id]: column.value,
        });
      }
    }

    // Handle filterable column filters
    for (const column of filterableColumnFilters) {
      if (typeof column.value === 'object' && Array.isArray(column.value)) {
        Object.assign(newParamsObject, { [column.id]: column.value.join('.') });
      }
    }

    // Remove deleted values
    for (const key of searchParams.keys()) {
      if (
        (searchableColumns.some((column) => column.value === key) &&
          !debouncedSearchableColumnFilters.some(
            (column) => column.id === key
          )) ||
        (filterableColumns.some((column) => column.value === key) &&
          !filterableColumnFilters.some((column) => column.id === key))
      ) {
        Object.assign(newParamsObject, { [key]: null });
      }
    }

    // After cumulating all the changes, push new params
    void setQueryState({
      ...queryState,
      ...newParamsObject,
    });

    table.setPageIndex(0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(debouncedSearchableColumnFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filterableColumnFilters),
  ]);

  const table = useReactTable({
    columns,
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    pageCount: pageCount ?? -1,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
      sorting,
    },
  });

  return { table };
}

import * as React from "react"
import type { SearchParams } from "@/types"

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { DateRangePicker } from "@/components/date-range-picker"
import { Shell } from "@/components/shell"
import {searchParamsSchema} from "@/app/_lib/validations";
import {getTasks} from "@/app/_lib/queries";
import {TasksTableProvider} from "@/app/_components/tasks-table-provider";
import {TasksTable} from "@/app/_components/tasks-table";


export interface IndexPageProps {
  searchParams: SearchParams
}

export default function IndexPage({ searchParams }: IndexPageProps) {
  const search = searchParamsSchema.parse(searchParams)

  const tasksPromise = getTasks(search)

  return (
    <Shell className="gap-2">
      {/**
       * The `TasksTableProvider` is use to enable some feature flags for the `TasksTable` component.
       * Feel free to remove this, as it's not required for the `TasksTable` component to work.
       */}
      <TasksTableProvider>
        {/**
         * The `DateRangePicker` component is used to render the date range picker UI.
         * It is used to filter the tasks based on the selected date range it was created at.
         * The business logic for filtering the tasks based on the selected date range is handled inside the component.
         */}
        <DateRangePicker
          triggerSize="sm"
          triggerClassName="ml-auto w-56 sm:w-60"
          align="end"
        />
        <React.Suspense
          fallback={
            <DataTableSkeleton
              columnCount={5}
              searchableColumnCount={1}
              filterableColumnCount={2}
              cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
              shrinkZero
            />
          }
        >
          {/**
           * The `TasksTable` component is used to render the `DataTable` component within it.
           * This is done because the table columns need to be memoized, and the `useDataTable` hook needs to be called in a client component.
           * By encapsulating the `DataTable` component within the `tasktableshell` component, we can ensure that the necessary logic and state management is handled correctly.
           */}
          <TasksTable tasksPromise={tasksPromise} defaultSort="title.asc" />
        </React.Suspense>
      </TasksTableProvider>
    </Shell>
  )
}

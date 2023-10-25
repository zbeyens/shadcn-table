import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DataTableFilterOption } from "@/types"
import { DotsHorizontalIcon, TrashIcon } from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DataTableAdvancedFilter } from "./data-table-advanced-filter"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableAdvancedFilterItemProps<TData> {
  table: Table<TData>
  selectedOption: DataTableFilterOption<TData>
  options: DataTableFilterOption<TData>[]
  selectedOptions: DataTableFilterOption<TData>[]
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<DataTableFilterOption<TData>[]>
  >
}

export function DataTableAdvancedFilterItem<TData>({
  table,
  selectedOption,
  options,
  selectedOptions,
  setSelectedOptions,
}: DataTableAdvancedFilterItemProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState("")
  const debounceValue = useDebounce(value, 500)
  const [open, setOpen] = React.useState(true)

  const selectedValues =
    selectedOption.items.length > 0
      ? Array.from(
          new Set(
            table
              .getColumn(String(selectedOption.value))
              ?.getFilterValue() as string[]
          )
        )
      : []

  const filterVarieties =
    selectedOption.items.length > 0
      ? ["is", "is not"]
      : ["contains", "does not contain", "is", "is not"]

  const [filterVariety, setFilterVariety] = React.useState(filterVarieties[0])
  const [advancedFilterRows, setAdvancedFilterRows] = React.useState<
    React.ReactNode[] | null
  >([
    <AdvancedFilterRow
      key={crypto.randomUUID()}
      table={table}
      options={options}
      selectedOption={selectedOption}
      selectedOptions={selectedOptions}
      setSelectedOptions={setSelectedOptions}
      setFilterVariety={setFilterVariety}
      filterVarieties={filterVarieties}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="aspect-square h-8 w-8"
          >
            <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Remove</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              setAdvancedFilterRows((prev) => [
                // @ts-expect-error symbol iterator missing
                ...prev,
                <AdvancedFilterRow
                  key={crypto.randomUUID()}
                  table={table}
                  options={options}
                  selectedOption={selectedOption}
                  selectedOptions={selectedOptions}
                  setSelectedOptions={setSelectedOptions}
                  setFilterVariety={setFilterVariety}
                  filterVarieties={filterVarieties}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="aspect-square h-8 w-8"
                      >
                        <DotsHorizontalIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Remove</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                          setAdvancedFilterRows((prev) => [
                            ...prev,
                            <AdvancedFilterRow
                              key={crypto.randomUUID()}
                              table={table}
                              options={options}
                              selectedOption={selectedOption}
                              selectedOptions={selectedOptions}
                              setSelectedOptions={setSelectedOptions}
                              setFilterVariety={setFilterVariety}
                              filterVarieties={filterVarieties}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="aspect-square h-8 w-8"
                                  >
                                    <DotsHorizontalIcon
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>Remove</DropdownMenuItem>
                                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </AdvancedFilterRow>,
                          ])
                        }}
                      >
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AdvancedFilterRow>,
              ])
            }}
          >
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </AdvancedFilterRow>,
  ])

  // Create query string
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString())

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, String(value))
        }
      }

      return newSearchParams.toString()
    },
    [searchParams]
  )

  React.useEffect(() => {
    if (debounceValue.length > 0) {
      router.push(
        `${pathname}?${createQueryString({
          [selectedOption.value]: `${debounceValue}${
            debounceValue.length > 0 ? `.${filterVariety}` : ""
          }`,
        })}`,
        {
          scroll: false,
        }
      )
    }

    if (debounceValue.length === 0) {
      router.push(
        `${pathname}?${createQueryString({
          [selectedOption.value]: null,
        })}`,
        {
          scroll: false,
        }
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceValue, filterVariety])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 truncate rounded-full",
            (selectedValues.length > 0 || value.length > 0) && "bg-muted/50"
          )}
        >
          {value.length > 0 || selectedValues.length > 0 ? (
            <>
              <span className="font-medium capitalize">
                {selectedOption.label}:
              </span>
              {selectedValues.length > 0 ? (
                <span className="ml-1">
                  {selectedValues.length > 2
                    ? `${selectedValues.length} selected`
                    : selectedValues.join(", ")}
                </span>
              ) : (
                <span className="ml-1">{value}</span>
              )}
            </>
          ) : (
            <span className="capitalize">{selectedOption.label}</span>
          )}
        </Button>
      </PopoverTrigger>
      {selectedOption.isAdvanced ? (
        <PopoverContent className="w-fit space-y-1 text-xs" align="start">
          <div className="flex flex-col space-y-2">{advancedFilterRows}</div>
        </PopoverContent>
      ) : (
        <PopoverContent className="w-60 space-y-1 text-xs" align="start">
          <div className="flex items-center space-x-1">
            <div className="flex flex-1 items-center space-x-1">
              <div className="capitalize">{selectedOption.label}</div>
              <Select onValueChange={(value) => setFilterVariety(value)}>
                <SelectTrigger className="h-auto w-fit truncate border-none px-2 py-0.5 hover:bg-muted/50">
                  <SelectValue placeholder={filterVarieties[0]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filterVarieties.map((variety) => (
                      <SelectItem key={variety} value={variety}>
                        {variety}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              aria-label="Remove filter"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                router.push(
                  `${pathname}?${createQueryString({
                    [selectedOption.value]: null,
                  })}`,
                  {
                    scroll: false,
                  }
                )
                setSelectedOptions((prev) =>
                  prev.filter((item) => item.value !== selectedOption.value)
                )
              }}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <DynamicFilter
            table={table}
            selectedOption={selectedOption}
            value={value}
            setValue={setValue}
          />
        </PopoverContent>
      )}
    </Popover>
  )
}

interface AdvancedFilterRowProps<TData> {
  table: Table<TData>
  options: DataTableFilterOption<TData>[]
  selectedOption: DataTableFilterOption<TData>
  selectedOptions: DataTableFilterOption<TData>[]
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<DataTableFilterOption<TData>[]>
  >
  setFilterVariety: React.Dispatch<React.SetStateAction<string | undefined>>
  filterVarieties: string[]
  children: React.ReactNode
}

function AdvancedFilterRow<TData>({
  table,
  options,
  selectedOption,
  selectedOptions,
  setSelectedOptions,
  setFilterVariety,
  filterVarieties,
  children,
}: AdvancedFilterRowProps<TData>) {
  return (
    <div className="flex flex-1 items-center space-x-2">
      <div>Where</div>
      <DataTableAdvancedFilter
        options={options}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        buttonText={selectedOption.label}
        isSelectable={true}
      />
      <Select onValueChange={(value) => setFilterVariety(value)}>
        <SelectTrigger className="h-8 w-full">
          <SelectValue placeholder={filterVarieties[0]} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {filterVarieties.map((variety) => (
              <SelectItem key={variety} value={variety}>
                {variety}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <DynamicFilterItem table={table} selectedOption={selectedOption} />
      {children}
    </div>
  )
}

interface DynamicFilterProps<TData> {
  table: Table<TData>
  selectedOption: DataTableFilterOption<TData>
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
}

export function DynamicFilter<TData>({
  table,
  selectedOption,
  value,
  setValue,
}: DynamicFilterProps<TData>) {
  if (selectedOption.items.length > 0) {
    return (
      table.getColumn(
        selectedOption.value ? String(selectedOption.value) : ""
      ) && (
        <DataTableFacetedFilter
          key={String(selectedOption.value)}
          column={table.getColumn(
            selectedOption.value ? String(selectedOption.value) : ""
          )}
          title={selectedOption.label}
          options={selectedOption.items}
          variant="command"
        />
      )
    )
  }

  return (
    <Input
      placeholder="Type here..."
      className="h-8"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      autoFocus
    />
  )
}

interface DynamicFilterItemProps<TData> {
  table: Table<TData>
  selectedOption: DataTableFilterOption<TData>
}

export function DynamicFilterItem<TData>({
  table,
  selectedOption,
}: DynamicFilterItemProps<TData>) {
  const [value, setValue] = React.useState("")

  if (selectedOption.items.length > 0) {
    return (
      table.getColumn(
        selectedOption.value ? String(selectedOption.value) : ""
      ) && (
        <DataTableFacetedFilter
          key={String(selectedOption.value)}
          column={table.getColumn(
            selectedOption.value ? String(selectedOption.value) : ""
          )}
          title={selectedOption.label}
          options={selectedOption.items}
          variant="command"
        />
      )
    )
  }

  return (
    <Input
      placeholder="Type here..."
      className="h-8"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      autoFocus
    />
  )
}
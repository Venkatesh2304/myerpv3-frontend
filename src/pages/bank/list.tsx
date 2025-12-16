import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { formatDate } from "@/lib/common";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Bank } from "./types";
import type { CrudFilters } from "@refinedev/core";
import { useFilters } from "@/hooks/filters";
import { LoadingButton } from "@/components/ui/loading-button";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const COLLECTION_TYPES = [
  { value: "all", label: "All" },
  { value: "cheque", label: "Cheque" },
  { value: "neft", label: "NEFT" },
  { value: "upi", label: "UPI (IKEA)" },
  { value: "cash_deposit", label: "Cash Deposit" },
  { value: "self_transfer", label: "Self Transfer" },
  { value: "others", label: "Others" },
];

const BANKS = [
  { value: "all", label: "All" },
  { value: "KVB CA", label: "KVB CA" },
  { value: "SBI CA", label: "SBI CA" },
  { value: "SBI OD", label: "SBI OD" },
  { value: "SBI LAKME", label: "SBI LAKME" },
];

const PUSHED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "false", label: "Not Pushed" },
];


const BankFilters: React.FC<{
  setFilters: React.Dispatch<React.SetStateAction<CrudFilters>>;
}> = ({ setFilters }) => {

  const { form, resetFilters } = useFilters({
    defaultValues: {
      date: "",
      type: "all",
      bank: "all",
      pushed: "all",
    },
    setFilters,
  });

  return (
    <Card className="mb-2 pt-4 pb-4">
      <CardContent className="">
        <Form {...form}>
          <div className="grid grid-cols-5 gap-8 items-end">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Collection Type</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COLLECTION_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Bank</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANKS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pushed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Pushed Status</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PUSHED_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

const MatchUpiButton = () => {
  const { open } = useNotification();

  const handleMatchUpi = () => {
    return dataProvider.custom({
      url: "/match_upi/",
      method: "post",
    }).then(() => {
      open?.({
        type: "success",
        message: "UPI Matched",
        description: "UPI transactions have been matched successfully.",
      });
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error matching UPI",
        description: err.message,
      });
    });
  };

  return (
    <LoadingButton
      variant="default"
      onClick={handleMatchUpi}
    >
      Match UPI
    </LoadingButton>
  );
};

const UploadStatementDialog = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const { open } = useNotification();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      open?.({
        type: "error",
        message: "File required",
        description: "Please select a file to upload.",
      });
      return Promise.resolve();
    }

    const formData = new FormData();
    formData.append("excel_file", file);

    return dataProvider.custom({
      url: "/bank_statement_upload/",
      method: "post",
      payload: formData,
    }).then(() => {
      open?.({
        type: "success",
        message: "Statement Uploaded",
        description: "Bank statement has been uploaded successfully.",
      });
      setOpenDialog(false);
      setFile(null);
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error uploading statement",
        description: err.message,
      });
    });
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="default">Upload Statement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing the bank statement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, .xls"
              className="col-span-3"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <DialogFooter>
          <LoadingButton onClick={handleUpload}>Upload</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BankList = () => {
  const [filters, setFilters] = React.useState<CrudFilters>([]);

  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Bank>();

    return [
      columnHelper.accessor("date", {
        id: "date",
        header: "Date",
        enableSorting: true,
        cell: ({ getValue }) => formatDate(getValue()),
        size: 75,
      }),
      columnHelper.accessor("ref", {
        id: "ref",
        header: "Reference",
        enableSorting: true,
        cell: ({ getValue }) => <span className="font-mono">{getValue()}</span>,
        size: 200,
      }),
      columnHelper.accessor("desc", {
        id: "desc",
        header: "Description",
        enableSorting: true,
        cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
        size: 400,
      }),
      columnHelper.accessor("amt", {
        id: "amt",
        header: "Amount",
        enableSorting: true,
        cell: ({ getValue }) =>
          `₹${getValue().toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
        size: 100,
      }),
      columnHelper.accessor("bank", {
        id: "bank",
        header: "Bank",
        enableSorting: true,
        cell: ({ getValue }) => getValue() ?? "",
        size: 100,
      }),
      columnHelper.accessor("type", {
        id: "type",
        header: "Type",
        enableSorting: true,
        cell: ({ getValue }) => getValue()?.toUpperCase() ?? "",
        size: 100,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => <EditButton recordItemId={row.original.id} />,
        size: 50,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      filters: {
        permanent: filters,
      },
    },
  });

  return (
    <ListView>
      <ListViewHeader title="" canCreate={false} >
        <div className="flex items-center gap-4">
          <MatchUpiButton />
          <UploadStatementDialog />
        </div>
      </ListViewHeader>
      <BankFilters setFilters={setFilters} />
      <DataTable table={table} />
    </ListView>
  );
};

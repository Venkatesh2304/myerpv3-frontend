import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CrudFilters } from "@refinedev/core";

export const useFilters = ({
  defaultValues,
  formToFilters,
  setFilters,
}: {
  defaultValues: Record<string, any>;
  formToFilters?: (values: any) => CrudFilters;
  setFilters: React.Dispatch<React.SetStateAction<CrudFilters>>;
}) => {

  const form = useForm({
    defaultValues,
  });

  const formValues = form.watch();

  useEffect(() => {
    const subscription = form.watch((formValues) => {
      let newFilters: CrudFilters = [];

      if (formToFilters) {
        newFilters = formToFilters(formValues);
      } else {
        Object.keys(formValues).forEach((key) => {
          const value = formValues[key];
          if (value !== "" && value !== null && value !== undefined && value !== "all") {
            const transformedValue = value;
            newFilters.push({
              field: key as string,
              operator: "eq",
              value: transformedValue,
            });
          }
        });
      }

      setFilters((prevFilters: CrudFilters) => {
        console.log("Setting Filters : ", newFilters);
        if (formToFilters) {
          return newFilters;
        }

        const oldUnrelatedFilters = prevFilters.filter(filter => {
          if ('field' in filter && filter.field) {
            return !Object.keys(formValues).includes(filter.field);
          }
          return true;
        });
        return [...oldUnrelatedFilters, ...newFilters];
      });
    });
    return () => subscription.unsubscribe();
  }, [form, setFilters, formToFilters]);

  const resetFilters = React.useCallback(() => {
    form.reset(defaultValues);
  }, [formValues, defaultValues]);

  return {
    form,
    resetFilters,
  };
}
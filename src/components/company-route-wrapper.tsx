import { useCompany } from "@/providers/company-provider";
import { useNotification } from "@refinedev/core";
import { useEffect } from "react";

export const CompanyRouteWrapper = ({ Component }: { Component: React.ComponentType }) => {
    const { company } = useCompany();
    if (!company) return null;
    return <Component key={`company-context-${company.id}`} />;
};

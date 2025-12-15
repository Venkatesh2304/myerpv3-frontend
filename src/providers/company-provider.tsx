"use client";

import { useCustom, useList } from "@refinedev/core";
import { createContext, useContext, useEffect, useState } from "react";

export type Company = {
    id: string;
};

type CompanyProviderState = {
    company: Company | null;
    setCompany: (company: Company) => void;
};

const initialState: CompanyProviderState = {
    company: null,
    setCompany: () => null,
};

const CompanyContext = createContext<CompanyProviderState>(initialState);

export function CompanyProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [company, setCompanyState] = useState<Company | null>(null);

    const setCompany = (company: Company) => {
        setCompanyState(company);
        sessionStorage.setItem("selectedCompanyId", String(company.id));
    };

    const value = {
        company,
        setCompany,
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);

    if (context === undefined) {
        throw new Error("useCompany must be used within a CompanyProvider");
    }

    return context;
}

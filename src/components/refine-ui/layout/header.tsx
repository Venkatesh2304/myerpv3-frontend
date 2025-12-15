import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  useActiveAuthProvider,
  useCustom,
  useDataProvider,
  useGetIdentity,
  useList,
  useLogout,
  useRefineOptions,
} from "@refinedev/core";
import { LogOutIcon } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useCompany } from "@/providers/company-provider";
import { compareAsc } from "date-fns";

export const Header = () => {
  const { isMobile } = useSidebar();

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>;
};

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-end",
        "z-40"
      )}
    >
      <CompanyDropdown />
      {/* <ThemeToggle /> */}
      <UserDropdown />
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();

  const { title } = useRefineOptions();

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40"
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": open,
          "opacity-100": !open || isMobile,
          "pointer-events-auto": !open || isMobile,
          "pointer-events-none": open && !isMobile,
        })}
      />

      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !open,
            "pl-5": open,
          }
        )}
      >
        <div>{title.icon}</div>
        <h2
          className={cn(
            "text-sm",
            "font-bold",
            "transition-opacity",
            "duration-200",
            {
              "opacity-0": !open,
              "opacity-100": open,
            }
          )}
        >
          {title.text}
        </h2>
      </div>

      <ThemeToggle className={cn("h-8", "w-8")} />
    </header>
  );
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            logout();
          }}
        >
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CompanyDropdown = () => {
  const { company, setCompany } = useCompany();
  const { result: { data: companyData }, query: { isLoading } } = useCustom({
    url: "companies",
    method: "get"
  });
  const companies = companyData || [];

  useEffect(() => {
    if (isLoading) return;
    const stored = sessionStorage.getItem("selectedCompanyId");
    let defaultCompany: string | null = null;
    if (stored && companies.includes(stored)) {
      defaultCompany = stored;
    } else if (companies.length > 0) {
      defaultCompany = companies[0];
    }
    if (defaultCompany && company?.id !== defaultCompany) {
      setCompany({ id: defaultCompany } as any);
    }
  }, [companies, company, setCompany, isLoading]);

  if (isLoading || companies.length === 0) {
    return <></>;
  }

  return (
    <Select
      value={company?.id?.toString()}
      onValueChange={(value) => {
        setCompany({ id: value } as any);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((c: any) => (
          <SelectItem key={c} value={String(c)}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

Header.displayName = "Header";
MobileHeader.displayName = "MobileHeader";
DesktopHeader.displayName = "DesktopHeader";

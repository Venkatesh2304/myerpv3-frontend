import { Authenticated, GitHubBanner, Refine, useNotification } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";

import { ChequeEdit, ChequeList } from "./pages/cheque";
import { ChequeCreate } from "./pages/cheque/create";
import { BankList, BankEdit } from "@/pages/bank";
import { BillList } from "@/pages/bill";
import { BillingList } from "@/pages/billing";
import { dataProvider } from "./lib/dataprovider";
import { authProvider } from "./lib/authprovider";
import { BookOpenTextIcon, LandmarkIcon, PrinterIcon, ScrollTextIcon, Building2Icon } from "lucide-react";
import { Login } from "./pages/login";
import { CompanyProvider, useCompany } from "./providers/company-provider";
import { useEffect } from "react";
import { CompanyRouteWrapper } from "./components/company-route-wrapper";
function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <Refine
            dataProvider={dataProvider}
            notificationProvider={useNotificationProvider()}
            authProvider={authProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: "billing",
                list: "/billing",
                meta: {
                  label: "Billing",
                  icon: <ScrollTextIcon />
                },
              },
              {
                name: "bill",
                list: "/print",
                meta: {
                  label: "Print",
                  icon: <PrinterIcon />
                },
              },

              {
                name: "cheque",
                list: "/cheque",
                edit: "/cheque/edit/:id",
                create: "/cheque/create",
                meta: {
                  label: "Cheque",
                  icon: <BookOpenTextIcon />
                },
              },
              {
                name: "bank",
                list: "/bank",
                edit: "/bank/edit/:id",
                meta: {
                  label: "Bank",
                  icon: <LandmarkIcon />
                },
              },

            ]}
            options={{
              title: {
                text: "ERP",
                icon: <Building2Icon />,
              },
              disableTelemetry: true,
              warnWhenUnsavedChanges: true,
              projectId: "acm5tN-f22iGa-ckgfSS",
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <CompanyProvider>
                      <Layout>
                        <Outlet />
                      </Layout>
                    </CompanyProvider>
                  </Authenticated>
                }
              >
                <Route path="/cheque">
                  <Route index element={<ChequeList />} />
                  <Route path="edit/:id" element={<ChequeEdit />} />
                  <Route path="create" element={<ChequeCreate />} />
                </Route>
                <Route path="/bank">
                  <Route index element={<BankList />} />
                  <Route path="edit/:id" element={<BankEdit />} />
                </Route>
                <Route path="/print">
                  <Route index element={<CompanyRouteWrapper Component={BillList} />} />
                </Route>
                <Route path="/billing">
                  <Route index element={<CompanyRouteWrapper Component={BillingList} />} />
                </Route>
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>

            <Toaster position="top-center" />
            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter >
  );
}

export default App;

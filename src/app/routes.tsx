import { createBrowserRouter } from "react-router";
import { Products } from "./pages/products";
import { ProductDetails } from "./pages/product-details";
import { RootLayout } from "./components/root-layout";
import { AdminLayout } from "./components/admin-layout";
import { AdminDashboard } from "./pages/admin-dashboard";
import { AdminProducts } from "./pages/admin-products";
import { AdminOrders } from "./pages/admin-orders";
import { AdminSettings } from "./pages/admin-settings";
import { FinanceOverview } from "./pages/finance-overview";
import { FinanceRevenue } from "./pages/finance-revenue";
import { FinanceExpenses } from "./pages/finance-expenses";
import { FinanceProfit } from "./pages/finance-profit";
import { FinanceOutsourcing } from "./pages/finance-outsourcing";
import { FinanceInvoices } from "./pages/finance-invoices";
import { FinanceInvoiceCreate } from "./pages/finance-invoice-create";
import { FinanceInvoiceView } from "./pages/finance-invoice-view";
import { FinanceCashFlow } from "./pages/finance-cashflow";
import { FinanceReports } from "./pages/finance-reports";
import { RepairOrdersDashboard } from "./pages/repair-orders-dashboard";
import { RepairOrdersList } from "./pages/repair-orders-list";
import { RepairOrderCreate } from "./pages/repair-order-create";
import { RepairOrderView } from "./pages/repair-order-view";
import { AdminLogin } from "./pages/admin-login";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Products,
      },
      {
        path: "products",
        Component: Products,
      },
      {
        path: "products/:id",
        Component: ProductDetails,
      },
    ],
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: "products",
        Component: AdminProducts,
      },
      {
        path: "orders",
        Component: AdminOrders,
      },
      {
        path: "settings",
        Component: AdminSettings,
      },
      {
        path: "finance/overview",
        Component: FinanceOverview,
      },
      {
        path: "finance/revenue",
        Component: FinanceRevenue,
      },
      {
        path: "finance/expenses",
        Component: FinanceExpenses,
      },
      {
        path: "finance/profit",
        Component: FinanceProfit,
      },
      {
        path: "finance/outsourcing",
        Component: FinanceOutsourcing,
      },
      {
        path: "finance/invoices",
        Component: FinanceInvoices,
      },
      {
        path: "finance/invoices/create",
        Component: FinanceInvoiceCreate,
      },
      {
        path: "finance/invoices/:id",
        Component: FinanceInvoiceView,
      },
      {
        path: "finance/cashflow",
        Component: FinanceCashFlow,
      },
      {
        path: "finance/reports",
        Component: FinanceReports,
      },
      {
        path: "repair-orders",
        Component: RepairOrdersDashboard,
      },
      {
        path: "repair-orders/list",
        Component: RepairOrdersList,
      },
      {
        path: "repair-orders/create",
        Component: RepairOrderCreate,
      },
      {
        path: "repair-orders/:id",
        Component: RepairOrderView,
      },
    ],
  },
]);

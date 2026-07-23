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
// FinanceOutsourcing moved under Repair — see repair-outsourcing below.
import { FinanceInvoices } from "./pages/finance-invoices";
import { FinanceInvoiceCreate } from "./pages/finance-invoice-create";
import { FinanceInvoiceView } from "./pages/finance-invoice-view";
import { FinanceCashFlow } from "./pages/finance-cashflow";
import { FinanceReports } from "./pages/finance-reports";
import { RepairOrdersDashboard } from "./pages/repair-orders-dashboard";
import { RepairOrdersList } from "./pages/repair-orders-list";
import { RepairOrderCreate } from "./pages/repair-order-create";
import { RepairOrderView } from "./pages/repair-order-view";
import { RepairOrderEdit } from "./pages/repair-order-edit";
import { RepairOutsourcing } from "./pages/repair-outsourcing";
import { Navigate } from "react-router";
import { SalesOverview } from "./pages/sales-overview";
import { SalesClients } from "./pages/sales-clients";
import { SalesQuotations } from "./pages/sales-quotations";
import { QuotationCreate } from "./pages/quotation-create";
import { QuotationView } from "./pages/quotation-view";
import { AdminCategories } from "./pages/admin-categories";
import { AdminLogin } from "./pages/admin-login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Cart } from "./pages/cart";
import { Checkout } from "./pages/checkout";
import { QuotationConfirmation } from "./pages/quotation-confirmation";

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
      {
        path: "cart",
        Component: Cart,
      },
      {
        path: "checkout",
        Component: Checkout,
      },
      {
        path: "quotation/:id",
        Component: QuotationConfirmation,
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
        path: "sales/overview",
        Component: SalesOverview,
      },
      {
        path: "clients",
        Component: SalesClients,
      },
      {
        path: "categories",
        Component: AdminCategories,
      },
      {
        path: "quotations",
        Component: SalesQuotations,
      },
      {
        path: "quotations/create",
        Component: QuotationCreate,
      },
      {
        path: "quotations/:id",
        Component: QuotationView,
      },
      {
        path: "quotations/:id/edit",
        Component: QuotationCreate,
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
        // Legacy route kept as a redirect so bookmarks don't 404.
        // Moved to Repair → Outsourcing in Phase 6.
        path: "finance/outsourcing",
        element: <Navigate to="/admin/repair-orders/outsourcing" replace />,
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
        // Same component; presence of :id switches it into edit mode.
        path: "finance/invoices/:id/edit",
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
        path: "repair-orders/outsourcing",
        Component: RepairOutsourcing,
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
      {
        path: "repair-orders/:id/edit",
        Component: RepairOrderEdit,
      },
    ],
  },
]);

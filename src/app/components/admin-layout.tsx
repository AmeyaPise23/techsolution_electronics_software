import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  Receipt,
  Users,
  FileText,
  BarChart3,
  ChevronRight,
  Wrench,
  LogOut,
  User as UserIcon,
  ClipboardList,
  ListOrdered,
  CreditCard,
  Box,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const salesNav: NavSection = {
  label: "Sales",
  items: [
    { name: "Overview", href: "/admin/sales/overview", icon: BarChart3 },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Quotations", href: "/admin/quotations", icon: ClipboardList },
    { name: "Invoices", href: "/admin/finance/invoices", icon: FileText },
    { name: "Orders", href: "/admin/orders", icon: ListOrdered },
  ],
};

const financeNav: NavSection = {
  label: "Finance",
  items: [
    { name: "Payments", href: "/admin/finance/overview", icon: CreditCard },
    { name: "Expenses", href: "/admin/finance/expenses", icon: Receipt },
    { name: "Reports", href: "/admin/finance/reports", icon: FileText },
  ],
};

const repairNav: NavSection = {
  label: "Operations",
  items: [
    { name: "Projects", href: "/admin/repair-orders", icon: ClipboardList },
    { name: "Inventory", href: "/admin/categories", icon: Box },
    { name: "Repair", href: "/admin/repair-orders/list", icon: Wrench },
  ],
};

const sections: NavSection[] = [salesNav, financeNav, repairNav];

function NavLink({
  to,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      className={`
        group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold
        transition-all duration-200
        ${
          isActive
            ? "bg-blue-100/80 text-[#0c367e] shadow-sm"
            : "text-slate-600 hover:bg-blue-50/80 hover:text-slate-950"
        }
      `}
      onClick={onClick}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-blue-600" />
      )}
      <Icon className={`size-4 shrink-0 transition-colors duration-200 ${isActive ? "text-blue-700" : "text-slate-500 group-hover:text-slate-900"}`} />
      <span>{label}</span>
    </Link>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] transform
          border-r border-blue-100 bg-[#F7FAFF] backdrop-blur-md
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-[76px] items-center justify-between px-5">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#123f8d] to-[#0d2c63] shadow-sm">
                <ShoppingCart className="size-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-tight text-slate-950">{user?.companyName || "Dashboard"}</span>
                <span className="text-xs font-medium leading-tight text-slate-500">ERP Suite</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-3 scrollbar-thin">
            {/* Dashboard — standalone */}
            <div className="space-y-1">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-normal text-slate-500">
                Main
              </p>
              <NavLink
                to="/admin"
                icon={LayoutDashboard}
                label="Dashboard"
                isActive={location.pathname === "/admin"}
                onClick={() => setSidebarOpen(false)}
              />
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div key={section.label} className="space-y-1">
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-normal text-slate-500">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      icon={item.icon}
                      label={item.name}
                      isActive={
                        location.pathname === item.href ||
                        (item.href !== "/admin" && location.pathname.startsWith(item.href + "/"))
                      }
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Utilities */}
            <div className="space-y-1">
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-normal text-slate-500">
                System
              </p>
              {user?.role === "ROLE_ADMIN" && (
                <NavLink
                  to="/admin/users"
                  icon={Users}
                  label="Team"
                  isActive={location.pathname.startsWith("/admin/users")}
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <NavLink
                to="/admin/company-settings"
                icon={Settings}
                label="Company"
                isActive={location.pathname === "/admin/company-settings"}
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink
                to="/admin/settings"
                icon={Settings}
                label="Settings"
                isActive={location.pathname === "/admin/settings"}
                onClick={() => setSidebarOpen(false)}
              />
            </div>
          </nav>

          {/* User */}
          <div className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg border border-blue-100 bg-white p-3 shadow-sm transition-colors duration-200 hover:bg-blue-50/70">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-bold text-blue-800">
                      {user ? getUserInitials(user.username) : "AD"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {user?.username || "TechSolution Pvt Ltd"}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {user?.role || "Ameya Pise"}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-[13px]">
                  <UserIcon className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[13px]">
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-blue-100 bg-white/80 px-4 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-semibold">TechSolution</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

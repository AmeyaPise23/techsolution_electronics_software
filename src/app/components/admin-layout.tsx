import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  Users,
  FileText,
  Wallet,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Wrench,
  LogOut,
  User as UserIcon,
  FolderTree,
  ClipboardList,
  ListOrdered,
  Store,
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
  icon: LucideIcon;
  items: NavItem[];
}

const salesNav: NavSection = {
  label: "Sales",
  icon: ShoppingCart,
  items: [
    { name: "Overview", href: "/admin/sales/overview", icon: BarChart3 },
    { name: "Clients", href: "/admin/clients", icon: Users },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Quotations", href: "/admin/quotations", icon: ClipboardList },
    { name: "Invoices", href: "/admin/finance/invoices", icon: FileText },
    { name: "Orders", href: "/admin/orders", icon: ListOrdered },
  ],
};

const financeNav: NavSection = {
  label: "Finance",
  icon: DollarSign,
  items: [
    { name: "Overview", href: "/admin/finance/overview", icon: BarChart3 },
    { name: "Revenue", href: "/admin/finance/revenue", icon: TrendingUp },
    { name: "Expenses", href: "/admin/finance/expenses", icon: Receipt },
    { name: "Profit", href: "/admin/finance/profit", icon: PieChart },
    { name: "Outsourcing", href: "/admin/finance/outsourcing", icon: Users },
    { name: "Cash Flow", href: "/admin/finance/cashflow", icon: Wallet },
    { name: "Reports", href: "/admin/finance/reports", icon: FileText },
  ],
};

const repairNav: NavSection = {
  label: "Repair",
  icon: Wrench,
  items: [
    { name: "Dashboard", href: "/admin/repair-orders", icon: LayoutDashboard },
    { name: "All Orders", href: "/admin/repair-orders/list", icon: ListOrdered },
    { name: "New Order", href: "/admin/repair-orders/create", icon: ClipboardList },
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
        group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium
        transition-all duration-200
        ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }
      `}
      onClick={onClick}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
      )}
      <Icon className={`size-4 shrink-0 transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
      <span>{label}</span>
    </Link>
  );
}

function CollapsibleSection({
  section,
  isOpen,
  onToggle,
  pathname,
  onNavigate,
}: {
  section: NavSection;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  onNavigate: () => void;
}) {
  const sectionActive = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={`
          group flex items-center justify-between w-full rounded-md px-3 py-2 text-[13px] font-medium
          transition-all duration-200
          ${sectionActive ? "text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
        `}
      >
        <div className="flex items-center gap-3">
          <section.icon className={`size-4 shrink-0 transition-colors duration-200 ${sectionActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span>{section.label}</span>
        </div>
        <ChevronRight
          className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="ml-3 border-l border-border/60 pl-3 space-y-0.5 py-0.5">
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              icon={item.icon}
              label={item.name}
              isActive={pathname === item.href}
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Sales: true,
    Finance: false,
    Repair: false,
  });

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
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
          bg-card/95 backdrop-blur-md border-r border-border/50
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-border/50">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Store className="size-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">Admin Panel</span>
                <span className="text-[10px] text-muted-foreground leading-tight">E-Commerce</span>
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
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 scrollbar-thin">
            {/* Dashboard — standalone */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {section.label}
                </p>
                <CollapsibleSection
                  section={section}
                  isOpen={openSections[section.label] ?? false}
                  onToggle={() => toggleSection(section.label)}
                  pathname={location.pathname}
                  onNavigate={() => setSidebarOpen(false)}
                />
              </div>
            ))}

            {/* Utilities */}
            <div className="space-y-1">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                System
              </p>
              <NavLink
                to="/admin/settings"
                icon={Settings}
                label="Settings"
                isActive={location.pathname === "/admin/settings"}
                onClick={() => setSidebarOpen(false)}
              />
              <NavLink
                to="/products"
                icon={ArrowLeft}
                label="Back to Store"
                isActive={false}
                onClick={() => setSidebarOpen(false)}
              />
            </div>
          </nav>

          {/* User */}
          <div className="border-t border-border/50 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full rounded-lg p-2.5 hover:bg-muted/50 transition-colors duration-200">
                  <div className="size-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                    <span className="text-xs font-semibold text-primary">
                      {user ? getUserInitials(user.username) : "AD"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium truncate">
                      {user?.username || "Admin User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {user?.role || "ADMIN"}
                    </p>
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
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
        <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-card/50 backdrop-blur-sm px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-semibold">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

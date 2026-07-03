import { Search, ShoppingCart, User, Store, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleAdminClick = () => {
    if (isAuthenticated) {
      navigate("/admin");
    } else {
      navigate("/admin/login");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/products" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Store className="size-6" />
            <span className="font-semibold text-lg hidden sm:inline-block">Premium Store</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              title="Admin Panel"
              onClick={handleAdminClick}
            >
              <LayoutDashboard className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="size-5" />
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="size-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

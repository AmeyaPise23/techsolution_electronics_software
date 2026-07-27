import { Outlet, useLocation } from "react-router";

export function RootLayout() {
  const { pathname } = useLocation();
  // Admin uses an inner scroll container (AdminLayout <main>). Locking the
  // outer wrapper to viewport height on /admin/* prevents a second body-level
  // scrollbar from appearing. Storefront pages continue to scroll normally.
  const isAdmin = pathname.startsWith("/admin");
  return (
    <div
      className={
        isAdmin
          ? "h-screen overflow-hidden bg-background"
          : "min-h-screen bg-background"
      }
    >
      <Outlet />
    </div>
  );
}

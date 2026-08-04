import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { RepairOrdersView } from "../features/repair-orders/RepairOrdersView";
import {
  getRepairView,
  viewKeyForStatus,
} from "../features/repair-orders/views";

/**
 * Thin route wrapper. Picks the view config from `?view=<key>`, falling back
 * to the legacy `?status=<api-status>` param so old sidebar links keep working.
 * All rendering + fetching lives in <RepairOrdersView>.
 */
export function RepairOrdersList() {
  const [params] = useSearchParams();
  const viewParam = params.get("view");
  const statusParam = params.get("status");

  const view = useMemo(
    () => getRepairView(viewParam ?? viewKeyForStatus(statusParam)),
    [viewParam, statusParam]
  );

  return <RepairOrdersView view={view} />;
}

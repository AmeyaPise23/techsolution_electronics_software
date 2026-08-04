import { useCurrentActor } from "./useCurrentActor";
import { Action, can } from "../permissions";

export function usePermission(action: Action, resourceOwnerId?: string): boolean {
  const actor = useCurrentActor();
  return can(action, { actorId: actor.id, actorRole: actor.role, resourceOwnerId });
}

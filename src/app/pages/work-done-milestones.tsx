import { useEffect } from "react";
import { MilestonesView } from "../features/work-done/components/MilestonesView";
import { useScheduleStore } from "../features/work-done/store/scheduleStore";

export function WorkDoneMilestones() {
  const milestones = useScheduleStore(state => state.milestones);
  const fetchMilestones = useScheduleStore(state => state.fetchMilestones);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  return (
    <div className="flex h-full">
      <MilestonesView
        milestones={milestones.map((m) => ({
          ...m,
          taskCount: Math.floor(Math.random() * 10) + 1,
        }))}
        onSelectMilestone={(milestoneId) => {
          console.log("Selected milestone:", milestoneId);
        }}
      />
    </div>
  );
}

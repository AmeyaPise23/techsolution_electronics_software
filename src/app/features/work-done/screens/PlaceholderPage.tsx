import { Card } from "../../../components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export function PlaceholderPage({ title, phase, description }: PlaceholderProps) {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <Construction className="size-10 text-slate-400" />
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Landing in {phase}
      </span>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "@/components/shared/cards";
import { SkillGapChart } from "@/components/charts/charts";

export function DistrictGapCard({ data }) {
  const [district, setDistrict] = useState("all");
  const shown = district === "all" ? data : data.filter((d) => d.district === district);
  return (
    <SectionCard
      title="Skill Gap by District"
      action={
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger size="sm" aria-label="Filter district" className="w-32 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All districts</SelectItem>
            {data.map((d) => (
              <SelectItem key={d.district} value={d.district}>
                {d.district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <SkillGapChart data={shown} />
    </SectionCard>
  );
}

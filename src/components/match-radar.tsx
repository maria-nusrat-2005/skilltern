import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export function MatchRadar({
  scores,
  size = 200,
}: {
  scores: { label: string; value: number }[];
  size?: number;
}) {
  return (
    <div style={{ width: "100%", height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={scores} outerRadius="70%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { Card, CardContent } from "../ui/card";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>

        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default StatCard;

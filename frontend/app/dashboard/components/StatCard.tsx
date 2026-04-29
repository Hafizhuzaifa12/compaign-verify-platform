import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value }: any) {
  return (
    <Card className="p-4 shadow">
      <CardContent>
        <h2 className="text-sm text-gray-500">{title}</h2>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
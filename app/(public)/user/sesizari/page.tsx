import { MOCK_REPORTS } from "@/app/config/sesizari";
import UserReportCard from "@/app/ui/sesizare";

export default function SesizarileMelePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-dark-blue">Sesizările mele</h1>

      {MOCK_REPORTS.length === 0 ? (
        <p className="text-sm text-gray-400">Nu ai făcut nicio sesizare.</p>
      ) : (
        <div className="flex flex-wrap gap-3.75">
          {MOCK_REPORTS.map((report) => (
            <UserReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
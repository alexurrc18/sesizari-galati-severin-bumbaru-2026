interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-300 flex flex-col gap-2 transition-all">
      <span className="text-xs font-black text-blue uppercase tracking-widest">
        {title}
      </span>
      <span className="text-3xl font-bold text-dark-blue">
        {value}
      </span>
      {subtitle && (
        <span className="text-xs text-gray-400 font-medium">
          {subtitle}
        </span>
      )}
    </div>
  );
}
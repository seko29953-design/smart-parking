export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Overview
        </h1>
        <p className="text-sm text-slate-500">
          Welcome back! Here is a snapshot of your system performance.
        </p>
      </div>


      {/* Content Box Placeholder */}
      <div className="min-h-[300px]  border border-dashed border-slate-300 bg-white p-6 flex items-center justify-center text-slate-400">
        Chart or Table Content Goes Here
      </div>
    </div>
  );
}
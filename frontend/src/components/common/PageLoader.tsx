import React from 'react';

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200" />
        <div className="absolute inset-0 rounded-full border-[3px] border-green-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-500 text-sm font-medium">Loading…</p>
    </div>
  </div>
);

export default PageLoader;
export { PageLoader };

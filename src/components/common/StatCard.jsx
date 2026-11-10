import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, alert = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-black' : ''
      } ${alert ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${alert ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-black'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-black">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}


import React from 'react';

export default function LoadingSpinner({ message = 'Cargando información del inventario...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
        {message}
      </p>
    </div>
  );
}


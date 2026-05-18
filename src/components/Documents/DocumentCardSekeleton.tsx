import React from 'react';

const DocumentCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
      
      {/* Skeleton for Thumbnail */}
      <div className="relative h-48 flex justify-center overflow-hidden">
        <div className="w-3/4 h-full bg-gray-200 animate-pulse "></div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div className="space-y-2">
          <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded-md"></div>
          <div className="w-1/2 h-5 bg-gray-200 animate-pulse rounded-md"></div>
        </div>

        {/* Like Button Skeleton */}
        <div className="mt-3 flex justify-between items-center text-sm">
          <div className="w-24 h-8 bg-gray-200 animate-pulse rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCardSkeleton;

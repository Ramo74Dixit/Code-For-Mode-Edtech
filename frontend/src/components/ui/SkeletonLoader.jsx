import React from 'react';

const SkeletonLoader = ({ className = "", count = 1, type = "text" }) => {
  // Types: text, circular, rectangular, card
  
  const getBaseClasses = () => {
    switch (type) {
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'rounded-xl';
      default:
        return 'rounded';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className={`
            bg-slate-200 dark:bg-slate-800 animate-pulse 
            ${getBaseClasses()}
            ${type === 'text' ? 'h-4 w-full' : ''}
            ${type === 'circular' ? 'h-12 w-12' : ''}
            ${type === 'rectangular' ? 'h-32 w-full' : ''}
            ${type === 'card' ? 'h-64 w-full' : ''}
          `}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;

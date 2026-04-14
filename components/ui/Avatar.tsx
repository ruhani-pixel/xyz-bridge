'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
  ];

  // Simple hash for consistent color per name
  const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[charCodeSum % colors.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-black text-white shadow-sm ring-2 ring-white",
      bgColor,
      sizeClasses[size],
      className
    )}>
      {initials}
    </div>
  );
}

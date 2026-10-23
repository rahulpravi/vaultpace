'use client';

import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Tag,
  Car,
  Film,
  HeartPulse,
  DollarSign,
  Briefcase,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  Gift,
  Coffee,
  Plane,
  Home,
  Zap,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'utensils': Utensils,
  'tag': Tag,
  'car': Car,
  'film': Film,
  'heart-pulse': HeartPulse,
  'dollar-sign': DollarSign,
  'briefcase': Briefcase,
  'wallet': Wallet,
  'landmark': Landmark,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  'gift': Gift,
  'coffee': Coffee,
  'plane': Plane,
  'home': Home,
  'zap': Zap,
};

interface CategoryIconAvatarProps {
  iconName?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryIconAvatar: React.FC<CategoryIconAvatarProps> = ({
  iconName = 'tag',
  color = '#047857',
  size = 'md',
  className = '',
}) => {
  const IconComponent = ICON_MAP[iconName.toLowerCase()] || HelpCircle;

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }[size];

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 transition-transform ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${color}18`, // 10% opacity tint
        color: color,
        border: `1.5px solid ${color}30`,
      }}
      aria-label={iconName}
      role="img"
    >
      <IconComponent size={iconSizes} strokeWidth={2.2} />
    </div>
  );
};

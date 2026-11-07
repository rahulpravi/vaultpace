import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Coffee,
  Tag,
  Car,
  Film,
  Heart,
  HeartPulse,
  Briefcase,
  House,
  Gift,
  Smartphone,
  Tv,
  GraduationCap,
  Fuel,
  Dumbbell,
  Plane,
  PiggyBank,
  Wrench,
  PawPrint,
  Sparkles,
  Wifi,
  Wallet,
  Coins,
  TrendingUp,
  Zap,
  Ellipsis,
  HelpCircle,
} from 'lucide-react-native';

export interface CategoryIconOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'shopping-bag', label: 'Shopping', icon: ShoppingBag },
  { id: 'utensils', label: 'Food', icon: Utensils },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'tag', label: 'Retail', icon: Tag },
  { id: 'car', label: 'Travel', icon: Car },
  { id: 'fuel', label: 'Fuel', icon: Fuel },
  { id: 'plane', label: 'Flight', icon: Plane },
  { id: 'home', label: 'Home', icon: House },
  { id: 'heart', label: 'Care', icon: Heart },
  { id: 'heart-pulse', label: 'Health', icon: HeartPulse },
  { id: 'gift', label: 'Gift', icon: Gift },
  { id: 'smartphone', label: 'Mobile', icon: Smartphone },
  { id: 'tv', label: 'TV / Bills', icon: Tv },
  { id: 'film', label: 'Cinema', icon: Film },
  { id: 'briefcase', label: 'Work', icon: Briefcase },
  { id: 'graduation-cap', label: 'Education', icon: GraduationCap },
  { id: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { id: 'piggy-bank', label: 'Savings', icon: PiggyBank },
  { id: 'wrench', label: 'Services', icon: Wrench },
  { id: 'paw-print', label: 'Pets', icon: PawPrint },
  { id: 'sparkles', label: 'Luxury', icon: Sparkles },
  { id: 'wifi', label: 'Internet', icon: Wifi },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'coins', label: 'Cash', icon: Coins },
  { id: 'trending-up', label: 'Invest', icon: TrendingUp },
  { id: 'zap', label: 'Utility', icon: Zap },
  { id: 'more-horizontal', label: 'Other', icon: Ellipsis },
];

export const CATEGORY_COLOR_OPTIONS = [
  '#047857', // Emerald
  '#0284c7', // Sky Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#e11d48', // Rose
  '#d97706', // Amber / Orange
  '#0d9488', // Teal
  '#0891b2', // Cyan
  '#64748b', // Slate
  '#16a34a', // Bright Green
  '#9333ea', // Violet
];

export function getCategoryIconComponent(iconName?: string): React.ComponentType<any> {
  switch (iconName) {
    case 'shopping-bag':
      return ShoppingBag;
    case 'utensils':
      return Utensils;
    case 'coffee':
      return Coffee;
    case 'tag':
      return Tag;
    case 'car':
      return Car;
    case 'fuel':
      return Fuel;
    case 'plane':
      return Plane;
    case 'home':
    case 'house':
      return House;
    case 'heart':
      return Heart;
    case 'heart-pulse':
      return HeartPulse;
    case 'gift':
      return Gift;
    case 'smartphone':
      return Smartphone;
    case 'tv':
      return Tv;
    case 'film':
      return Film;
    case 'briefcase':
      return Briefcase;
    case 'graduation-cap':
      return GraduationCap;
    case 'dumbbell':
      return Dumbbell;
    case 'piggy-bank':
      return PiggyBank;
    case 'wrench':
      return Wrench;
    case 'paw-print':
      return PawPrint;
    case 'sparkles':
      return Sparkles;
    case 'wifi':
      return Wifi;
    case 'wallet':
      return Wallet;
    case 'coins':
      return Coins;
    case 'trending-up':
      return TrendingUp;
    case 'zap':
      return Zap;
    case 'more-horizontal':
    case 'ellipsis':
      return Ellipsis;
    default:
      return HelpCircle;
  }
}


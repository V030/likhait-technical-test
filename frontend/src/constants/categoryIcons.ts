import {
  ForkKnife,
  Car,
  ShoppingBag,
  FilmStrip,
  Receipt,
  Heart,
  GraduationCap,
  Airplane,
  User,
  Package,
  House,
  Barbell,
  Coffee,
  Gift,
  Briefcase,
  CreditCard,
  WifiHigh,
  Phone,
  MusicNote,
  GameController,
  PawPrint,
  Baby,
  Scissors,
  Wrench,
  BookOpen,
  Stethoscope,
  Bus,
  GasPump,
  Building,
} from "@phosphor-icons/react";

type PhosphorIcon = typeof Package;

export const ICON_REGISTRY: Record<string, PhosphorIcon> = {
  ForkKnife,
  Car,
  ShoppingBag,
  FilmStrip,
  Receipt,
  Heart,
  GraduationCap,
  Airplane,
  User,
  Package,
  House,
  Barbell,
  Coffee,
  Gift,
  Briefcase,
  CreditCard,
  WifiHigh,
  Phone,
  MusicNote,
  GameController,
  PawPrint,
  Baby,
  Scissors,
  Wrench,
  BookOpen,
  Stethoscope,
  Bus,
  GasPump,
  Building,
};

export const ICON_OPTIONS = Object.keys(ICON_REGISTRY);

const DEFAULT_CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  Food: ForkKnife,
  Transportation: Car,
  Shopping: ShoppingBag,
  Entertainment: FilmStrip,
  Bills: Receipt,
  Healthcare: Heart,
  Education: GraduationCap,
  Travel: Airplane,
  Personal: User,
  Other: Package,
};

export function getCategoryIconComponent(
  iconName?: string | null,
  categoryName?: string,
): PhosphorIcon {
  if (iconName && ICON_REGISTRY[iconName]) {
    return ICON_REGISTRY[iconName];
  }
  if (categoryName && DEFAULT_CATEGORY_ICONS[categoryName]) {
    return DEFAULT_CATEGORY_ICONS[categoryName];
  }
  return Package;
}

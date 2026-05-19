export type UserRole = 'client';
export type Language = 'uz' | 'ru';
export type ProductStatus = 'draft' | 'published';
export type ClientStatus = 'standard' | 'vip';
export type ProductVisibility = 'all' | 'vip';
export type TargetAudience = 'erkaklar' | 'ayollar' | 'bolalar';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  phone: string;
  messengerLink?: string;
  username: string;
  password: string;
  clientStatus: ClientStatus;
  createdAt: string;
  createdBy: 'self' | 'accountant';
}

export interface Product {
  id: string;
  modelNumber: string;
  variantNumber: string;
  category: string;
  image: string;
  secondaryImage?: string;
  price: number | null;
  oldPrice?: number | null;
  status: ProductStatus;
  isTrending: boolean;
  isNew: boolean;
  visibility: ProductVisibility;
  createdAt: string;
  createdBy: string;
  targetAudience?: TargetAudience;
  description?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  modelNumber: string;
  variantNumber: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  seen?: boolean;
  shippingAddress?: string;
  phoneNumber?: string;
}

export interface Category {
  id: string;
  uz: string;
  ru: string;
}

export interface Notification {
  id: string;
  orderId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface HomepageConfigItem {
  element_key: string;
  destination_segment: string;
  destination_category?: string;
  label: string;
}

export type DepartmentKey = 'men' | 'women' | 'kids';

export interface DepartmentTheme {
  key: DepartmentKey;
  label: string;
  bgColor: string;
  surfaceColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentColor: string;
  dividerColor: string;
  overlayOpacity: number;
  cardOverlayColor: string;
  ctaBorderColor: string;
  ctaTextColor: string;
  ctaPressedBg: string;
  headerBg: string;
  departmentBarBg: string;
  departmentActiveColor: string;
  departmentInactiveColor: string;
  navLinkColor: string;
  navLinkHoverColor: string;
  badgeBg: string;
  badgeText: string;
  heroHeadlineWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700';
  heroLetterSpacing: number;
  sectionTitleWeight: '300' | '400' | '500' | '600';
  sectionTitleSpacing: number;
  staircaseOffsets: number[];
  staircaseHeights: number[];
  masonryGap: number;
  editorialOverlayStrength: number;
}

export interface HeroBannerConfig {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  destinationUrl: string;
}

export type HeroDepartmentKey = 'all' | 'men' | 'women' | 'kids';

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBgColor: string;
  footerBgColor: string;
  bodyBgColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  heroOverlayOpacity: number;
  heroTextAlignment: 'left' | 'center' | 'right';
  sectionSpacing: number;
  contentMaxWidth: number;
  topBannerEnabled: boolean;
  topBannerText: string;
  topBannerBgColor: string;
  topBannerTextColor: string;
  ctaBorderRadius: number;
  ctaBgColor: string;
  ctaTextColor: string;
  philosophySectionVisible: boolean;
  newsletterSectionVisible: boolean;
  heroBanners: Record<HeroDepartmentKey, HeroBannerConfig>;
}

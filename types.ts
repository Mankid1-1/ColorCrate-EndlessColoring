
export enum AgeGroup {
  TODDLER = 'Toddler (1-3)',
  PRESCHOOL = 'Preschool (3-5)',
  SCHOOL_AGE = 'School Age (5-10)',
  TEEN = 'Teen/Adult (10+)'
}

export enum ArtStyle {
  CARTOON = 'Cute Cartoon',
  REALISTIC = 'Realistic Nature',
  MANDALA = 'Mandala Pattern',
  FANTASY = 'Fantasy & Magic',
  PIXEL = 'Pixel Art',
  MINIMALIST = 'Minimalist',
  ABSTRACT = 'Abstract Shapes',
  STAINED_GLASS = 'Stained Glass',
  KAWAII = 'Super Kawaii',
  COMIC = 'Comic Book Style'
}

export enum AppTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export enum BookSize {
  SINGLE = 1,
  SMALL = 4,
  MEDIUM = 12,
  LARGE = 28
}

export interface GenerationParams {
  theme: string;
  ageGroup: AgeGroup;
  style: ArtStyle;
  tier: AppTier;
  variationIndex?: number;
}

export interface PageData {
  id: string;
  originalUrl: string;
  modifiedUrl: string | null;
  promptUsed: string;
  createdAt: number;
}

// Creative Mode Types
export type EditorTool = 'move' | 'sticker' | 'text' | 'draw';

export interface EditorItem {
  id: string;
  type: 'sticker' | 'text' | 'path';
  content: string; // SVG path data or text string
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  color: string;
  // For paths
  points?: {x: number, y: number}[]; 
}

export interface BookState {
  theme: string;
  ageGroup: AgeGroup;
  style: ArtStyle;
  pages: PageData[];
  lastUpdated: number;
}

// Store Types
export interface Product {
  id: string;
  title: string;
  price: string;
  description: string;
  currency: string;
}

export type PurchaseStatus = 'idle' | 'loading' | 'success' | 'error';

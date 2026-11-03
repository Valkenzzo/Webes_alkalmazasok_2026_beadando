import { storageKey } from './data';
import type { Category } from './types';

const categoryImportKey = `${storageKey}-categories-imported-v1`;

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;
  const category = value as Category;
  return typeof category.id === 'string'
    && typeof category.name === 'string'
    && typeof category.color === 'string';
}

export function loadLegacyCategories(): Category[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return [];
    const categories = (parsed as { categories?: unknown }).categories;
    return Array.isArray(categories) ? categories.filter(isCategory) : [];
  } catch {
    return [];
  }
}

export function hasImportedLegacyCategories() {
  try {
    return localStorage.getItem(categoryImportKey) === 'true';
  } catch {
    return false;
  }
}

export function markLegacyCategoriesImported() {
  try {
    localStorage.setItem(categoryImportKey, 'true');
  } catch {
    // The import endpoint is idempotent if browser storage is unavailable.
  };
}
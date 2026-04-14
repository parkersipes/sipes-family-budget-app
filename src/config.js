// Both users share a single household. Not a secret — just a Firestore doc ID.
export const HOUSEHOLD_ID = 'sipes-family';

// Side income categories. Kept as short keys with display labels.
export const SIDE_INCOME_KINDS = [
  { key: 'return', label: 'Store return' },
  { key: 'gig', label: 'Side gig' },
  { key: 'sale', label: 'Sale' },
  { key: 'other', label: 'Other' },
];

export function sideIncomeLabel(kind) {
  const found = SIDE_INCOME_KINDS.find((k) => k.key === kind);
  return found ? found.label : 'Other';
}

// Curated palette for categories (user picks one when creating).
export const CATEGORY_PALETTE = [
  '#f5a524', // amber
  '#3bbf7a', // green
  '#4aa8ff', // blue
  '#c58bff', // violet
  '#ff7a8a', // rose
  '#6ad4c5', // teal
  '#e5484d', // red
  '#d9cf6b', // olive
  '#ff9a5a', // orange
  '#8ea0b5', // slate
  '#d5aa7a', // tan
  '#9be07a', // lime
];

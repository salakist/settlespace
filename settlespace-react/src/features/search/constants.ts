export const SEARCH_PARAMETER_KINDS = {
  FIXED: 'fixed',
  TEXT_INPUT: 'text-input',
  ASYNC_SUGGESTIONS: 'async-suggestions',
} as const;

export const SEARCH_SELECTION_MODES = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
} as const;

export const SEARCH_PLACEHOLDERS = {
  DEFAULT: 'Search...',
  TEXT_INPUT: 'Type a value...',
  ASYNC_SUGGESTIONS: 'Type to search...',
} as const;

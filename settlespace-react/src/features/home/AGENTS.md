# Home Feature AGENTS Metadata

## Status
Implemented.

## Role
Home feature provides the authenticated landing experience and top-level user guidance content.

## Responsibilities
- `src/features/home/components/` owns home-page presentation and feature-local composition.
- Keep home feature lightweight and presentation-focused unless explicit domain behavior is added.

## Key files
- `components/HomePage.tsx`

## Commands
- `npm run test:ci -- src/features/home`
- `npx eslint src/features/home --ext .ts,.tsx --max-warnings=0`

## Dependencies
- Shared UI/theme components from app shell and MUI

## Source-of-truth note
Cross-cutting frontend policy and quality-gate workflow are defined in `settlespace-react/AGENTS.md`.

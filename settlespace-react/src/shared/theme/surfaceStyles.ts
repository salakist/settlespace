import { SxProps, Theme } from '@mui/material/styles';

export const SURFACE_BORDER = '1px solid rgba(255,255,255,0.08)';
export const SURFACE_BORDER_STRONG = '1px solid rgba(255,255,255,0.1)';
export const SURFACE_SUBTLE_BACKGROUND = 'rgba(255,255,255,0.03)';
export const SURFACE_MUTED_BACKGROUND = 'rgba(255,255,255,0.02)';
export const SURFACE_INSET_BACKGROUND = 'rgba(255,255,255,0.04)';
export const BRAND_LOGO_SRC = `${process.env.PUBLIC_URL}/settlespace-logo.png`;
export const BRAND_HEADER_SRC = `${process.env.PUBLIC_URL}/settlespace-header.png`;

export const pageHeroSurfaceSx: SxProps<Theme> = {
  p: { xs: 3, sm: 4 },
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'rgba(255,255,255,0.1)',
  backgroundColor: SURFACE_SUBTLE_BACKGROUND,
  background: 'linear-gradient(135deg, rgba(144,202,249,0.08) 0%, rgba(255,255,255,0.03) 52%, rgba(244,143,177,0.06) 100%)',
};

export const authCardSurfaceSx: SxProps<Theme> = {
  ...pageHeroSurfaceSx,
  width: '100%',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.28)',
  background:
    'linear-gradient(135deg, rgba(144,202,249,0.12) 0%, rgba(255,255,255,0.04) 48%, rgba(244,143,177,0.1) 100%), rgba(13,19,33,0.92)',
};

export const panelSurfaceSx: SxProps<Theme> = {
  p: { xs: 2.5, sm: 3 },
  borderRadius: 2.5,
  border: SURFACE_BORDER,
  backgroundColor: SURFACE_SUBTLE_BACKGROUND,
};

export const insetSurfaceSx: SxProps<Theme> = {
  p: 2,
  borderRadius: 2,
  border: SURFACE_BORDER,
  backgroundColor: SURFACE_INSET_BACKGROUND,
};

export const listItemSurfaceSx: SxProps<Theme> = {
  p: 2,
  borderRadius: 2,
  border: SURFACE_BORDER,
  backgroundColor: SURFACE_MUTED_BACKGROUND,
};

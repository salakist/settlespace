import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';
import { pageHeroSurfaceSx, panelSurfaceSx } from '../../../shared/theme/surfaceStyles';

type HomePageProps = {
  displayName: string;
};

const HomePage = ({ displayName }: HomePageProps) => {
  const highlights = [
    {
      title: 'People directory',
      description: 'Keep profiles, roles, contact details, and addresses organised in one shared roster.',
    },
    {
      title: 'Transaction tracking',
      description: 'Record who paid whom, search activity quickly, and review the history attached to each exchange.',
    },
    {
      title: 'Debt follow-up',
      description: 'Surface outstanding balances so the team can spot what still needs to be settled.',
    },
  ];

  return (
    <Paper elevation={0} sx={pageHeroSurfaceSx}>
      <Stack spacing={3}>
        <Typography variant="overline" color="primary.main">
          Finance and relationship workspace
        </Typography>
        <Typography variant="h4" component="h1">
          Welcome back, {displayName}.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          SettleSpace gives you a single place to manage the people you work with, the transactions that connect them, and the debts that still need attention.
          Use the navigation to move between the directory, your personal profile, transaction history, and balance follow-up without losing context.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {highlights.map((highlight) => (
            <Paper
              key={highlight.title}
              elevation={0}
              sx={{
                ...panelSurfaceSx,
                flex: 1,
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h6">{highlight.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {highlight.description}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Access is role-aware, so administrators, managers, and standard users each see the actions that fit their responsibilities.
        </Typography>
      </Stack>
    </Paper>
  );
};

export default HomePage;
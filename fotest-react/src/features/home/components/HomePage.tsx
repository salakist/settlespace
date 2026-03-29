import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';

type HomePageProps = {
  displayName: string;
};

const HomePage = ({ displayName }: HomePageProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'rgba(255,255,255,0.1)',
        background: 'linear-gradient(180deg, rgba(30,30,30,0.92) 0%, rgba(18,18,18,0.98) 100%)',
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Welcome back, {displayName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          FoTest helps you manage people and their addresses in one place. Use the top navigation to browse the person directory,
          update your profile, and keep your information current.
        </Typography>
      </Stack>
    </Paper>
  );
};

export default HomePage;
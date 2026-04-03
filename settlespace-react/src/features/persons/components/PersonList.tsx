import React from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { Person } from '../../../shared/types';
import { listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  canEdit: (person: Person) => boolean;
  canDelete: (person: Person) => boolean;
}

const PersonList: React.FC<PersonListProps> = ({ persons, onEdit, onDelete, canEdit, canDelete }) => {
  return (
    <div>
      {persons.length === 0 ? (
        <Typography color="text.secondary">No persons found.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {persons.map((person) => {
            const personId = person.id;
            const secondaryDetails = [person.role, person.email, person.phoneNumber]
              .filter(Boolean)
              .join(' · ');

            return (
              <Paper
                key={personId ?? `${person.firstName}-${person.lastName}`}
                elevation={0}
                sx={listItemSurfaceSx}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1.5}
                >
                  <div>
                    <Typography variant="subtitle1">
                      {person.firstName} {person.lastName}
                    </Typography>
                    {secondaryDetails && (
                      <Typography variant="body2" color="text.secondary">
                        {secondaryDetails}
                      </Typography>
                    )}
                  </div>

                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => onEdit(person)} disabled={!canEdit(person)}>
                      Edit
                    </Button>
                    {personId ? (
                      <Button size="small" variant="outlined" color="secondary" onClick={() => onDelete(personId)} disabled={!canDelete(person)}>
                        Delete
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </div>
  );
};

export default PersonList;
import React, { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Alert, Chip, IconButton, Menu, MenuItem, Paper, Stack, Typography } from '@mui/material';
import { Person, PersonRole } from '../../../shared/types';
import { listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';
import { PERSON_LIST_TEXT } from '../constants';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
  onViewTransactions: (person: Person) => void;
  onViewDebts: (person: Person) => void;
  canEdit: (person: Person) => boolean;
  canDelete: (person: Person) => boolean;
}

function getRoleColor(role?: Person['role']): 'error' | 'warning' | 'info' | 'default' {
  switch (role) {
    case PersonRole.Admin:
      return 'error';
    case PersonRole.Manager:
      return 'warning';
    case PersonRole.User:
      return 'info';
    default:
      return 'default';
  }
}

const PersonList: React.FC<PersonListProps> = ({
  persons,
  onEdit,
  onDelete,
  onViewTransactions,
  onViewDebts,
  canEdit,
  canDelete,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, person: Person) => {
    setMenuAnchor(event.currentTarget);
    setActivePerson(person);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActivePerson(null);
  };

  const handleEditAction = () => {
    if (activePerson) {
      onEdit(activePerson);
    }
    handleCloseMenu();
  };

  const handleDeleteAction = () => {
    if (activePerson?.id) {
      onDelete(activePerson.id);
    }
    handleCloseMenu();
  };

  const handleViewTransactionsAction = () => {
    if (activePerson) {
      onViewTransactions(activePerson);
    }
    handleCloseMenu();
  };

  const handleViewDebtsAction = () => {
    if (activePerson) {
      onViewDebts(activePerson);
    }
    handleCloseMenu();
  };

  return (
    <div>
      {persons.length === 0 ? (
        <Alert severity="info">{PERSON_LIST_TEXT.EMPTY_STATE}</Alert>
      ) : (
        <>
          <Stack spacing={1.5}>
            {persons.map((person) => {
              const personId = person.id;
              const secondaryDetails = [person.email, person.phoneNumber]
                .filter(Boolean)
                .join(' · ');
              const displayName = person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim();

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
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                        <Typography variant="subtitle1">{displayName}</Typography>
                        {person.role && (
                          <Chip label={person.role} size="small" color={getRoleColor(person.role)} />
                        )}
                      </Stack>
                      {secondaryDetails && (
                        <Typography variant="body2" color="text.secondary">
                          {secondaryDetails}
                        </Typography>
                      )}
                    </Stack>

                    <IconButton
                      aria-label={`Open actions for ${displayName}`}
                      onClick={(event) => handleOpenMenu(event, person)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
            <MenuItem onClick={handleViewTransactionsAction}>{PERSON_LIST_TEXT.VIEW_TRANSACTIONS}</MenuItem>
            <MenuItem onClick={handleViewDebtsAction}>{PERSON_LIST_TEXT.VIEW_DEBTS}</MenuItem>
            <MenuItem onClick={handleEditAction} disabled={!activePerson || !canEdit(activePerson)}>
              {PERSON_LIST_TEXT.EDIT}
            </MenuItem>
            <MenuItem
              onClick={handleDeleteAction}
              disabled={!activePerson?.id || !activePerson || !canDelete(activePerson)}
            >
              {PERSON_LIST_TEXT.DELETE}
            </MenuItem>
          </Menu>
        </>
      )}
    </div>
  );
};

export default PersonList;
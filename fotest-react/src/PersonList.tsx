import React from 'react';
import { Button, Card, CardContent, CardActions, Typography, Stack } from '@mui/material';
import { Person } from './types';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

const PersonList: React.FC<PersonListProps> = ({ persons, onEdit, onDelete }) => {
  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Persons
      </Typography>
      {persons.length === 0 ? (
        <Typography>No persons found.</Typography>
      ) : (
        <Stack spacing={2}>
          {persons.map((person) => (
            <Card key={person.id ?? `${person.firstName}-${person.lastName}`}>
              <CardContent>
                <Typography variant="subtitle1">
                  {person.firstName} {person.lastName}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => onEdit(person)}>
                  Edit
                </Button>
                {person.id ? (
                  <Button size="small" color="error" onClick={() => onDelete(person.id!)}>
                    Delete
                  </Button>
                ) : null}
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </div>
  );
};

export default PersonList;
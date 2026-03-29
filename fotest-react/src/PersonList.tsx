import React from 'react';
import { Person } from './types';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

const PersonList: React.FC<PersonListProps> = ({ persons, onEdit, onDelete }) => {
  return (
    <div className="person-list">
      <h2>Persons</h2>
      {persons.length === 0 ? (
        <p>No persons found.</p>
      ) : (
        <ul>
          {persons.map((person) => (
            <li key={person.id}>
              {person.firstName} {person.lastName}
              <button onClick={() => onEdit(person)}>Edit</button>
              <button onClick={() => person.id && onDelete(person.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PersonList;
import React, { useState, useEffect } from 'react';
import { Person } from './types';

interface PersonFormProps {
  person?: Person;
  onSave: (person: Omit<Person, 'id'>) => void;
  onCancel: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onCancel }) => {
  const [firstName, setFirstName] = useState(person?.firstName || '');
  const [lastName, setLastName] = useState(person?.lastName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName });
    setFirstName('');
    setLastName('');
  };

  return (
    <form onSubmit={handleSubmit} className="person-form">
      <h3>{person ? 'Edit Person' : 'Add New Person'}</h3>
      <div>
        <label>First Name:</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Last Name:</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <button type="submit">{person ? 'Update' : 'Add'}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default PersonForm;
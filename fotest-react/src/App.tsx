import React, { useState, useEffect } from 'react';
import './App.css';
import { Person } from './types';
import { personApi } from './api';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import SearchBar from './SearchBar';

function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await personApi.getAll();
      setPersons(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadPersons();
      return;
    }
    try {
      setLoading(true);
      const response = await personApi.search(query);
      setPersons(response.data);
      setError(null);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (personData: Omit<Person, 'id'>) => {
    try {
      if (editingPerson?.id) {
        await personApi.update(editingPerson.id, personData);
      } else {
        await personApi.create(personData);
      }
      setEditingPerson(undefined);
      setShowForm(false);
      loadPersons();
    } catch (err) {
      setError('Failed to save person');
      console.error(err);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await personApi.delete(id);
        loadPersons();
      } catch (err) {
        setError('Failed to delete person');
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setEditingPerson(undefined);
    setShowForm(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>FoTest Person Manager</h1>
      </header>
      <main>
        <div className="container">
          <SearchBar onSearch={handleSearch} />
          <button onClick={() => setShowForm(true)} disabled={showForm}>
            Add New Person
          </button>
          {showForm && (
            <PersonForm
              person={editingPerson}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}
          <PersonList
            persons={persons}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

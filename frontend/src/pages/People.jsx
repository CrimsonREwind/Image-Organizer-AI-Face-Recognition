import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { peopleApi } from '../api';
import PersonCard from '../components/PersonCard';
import Modal from '../components/Modal';
import { PageLoader } from '../components/LoadingSpinner';

export default function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchPeople();
  }, [search]);

  const fetchPeople = async () => {
    try {
      const result = await peopleApi.getAll({ search });
      setPeople(result.data);
    } catch (error) {
      toast.error('Failed to fetch people');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const result = await peopleApi.create({ name: newName.trim() });
      toast.success('Person created');
      setPeople((prev) => [result.data, ...prev]);
      setNewName('');
      setIsCreating(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = (personId) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  };

  const handleUpdate = (updatedPerson) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">People</h1>
          <p className="text-gray-500 mt-1">{people.length} people in your library</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Person
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* People Grid */}
      {people.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-100">
            {search ? 'No people found' : 'No people yet'}
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            {search
              ? 'Try a different search term'
              : 'Add people to start organizing your photos'}
          </p>
          {!search && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary"
            >
              Add Your First Person
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
          setNewName('');
        }}
        title="Add Person"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter person's name"
              className="input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewName('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleCreate} className="btn-primary">
              Add Person
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { peopleApi } from '../api';
import Modal from './Modal';

export default function PersonCard({ person, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [deleteImages, setDeleteImages] = useState(false);

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const result = await peopleApi.update(person.id, { name: editName.trim() });
      toast.success('Person updated');
      setIsEditing(false);
      if (onUpdate) onUpdate(result.data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await peopleApi.delete(person.id, deleteImages);
      toast.success('Person deleted');
      setIsDeleting(false);
      if (onDelete) onDelete(person.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card group"
      >
        <Link to={`/people/${person.id}`}>
          <div className="aspect-square overflow-hidden bg-dark-400">
            {person.thumbnail_url ? (
              <img
                src={person.thumbnail_url}
                alt={person.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="h-20 w-20 text-gray-600" />
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link
                to={`/people/${person.id}`}
                className="font-semibold text-gray-100 hover:text-primary-400 truncate block"
              >
                {person.name}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {person.image_count} {person.image_count === 1 ? 'image' : 'images'}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditName(person.name);
                  setIsEditing(true);
                }}
                className="btn-ghost p-1.5"
                title="Edit person"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                title="Delete person"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Person"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleUpdate} className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        title="Delete Person"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete <strong>{person.name}</strong>?
          </p>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deleteImages}
              onChange={(e) => setDeleteImages(e.target.checked)}
              className="rounded bg-dark-400 border-dark-100 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-400">
              Also delete all {person.image_count} images
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleting(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrashIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';
import { imagesApi } from '../api';
import Modal from './Modal';

export default function ImageCard({ 
  image, 
  people = [], 
  onDelete, 
  onAssign, 
  showAssign = true,
  showPerson = true 
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await imagesApi.delete(image.id);
      toast.success('Image deleted');
      setShowDeleteModal(false);
      if (onDelete) onDelete(image.id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssign = async (personId) => {
    setIsAssigning(true);
    try {
      await imagesApi.assign(image.id, personId);
      toast.success(personId ? 'Image assigned' : 'Image unassigned');
      if (onAssign) onAssign(image.id, personId);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      const result = await imagesApi.reprocess(image.id);
      toast.success(result.message);
      if (onAssign) onAssign(image.id, result.matched_person);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card group relative"
    >
      <div className="aspect-square overflow-hidden bg-dark-400">
        <img
          src={image.url}
          alt={image.original_filename || 'Image'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Face indicator */}
      {image.has_face && (
        <div className="absolute top-2 left-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              image.is_identified
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            <UserIcon className="h-3 w-3 mr-1" />
            {image.face_count} {image.face_count === 1 ? 'face' : 'faces'}
          </span>
        </div>
      )}

      {/* Actions overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Person info */}
          {showPerson && image.person && (
            <Link
              to={`/people/${image.person.id}`}
              className="mb-2 block text-sm font-medium text-white hover:text-primary-400 truncate"
            >
              {image.person.name}
            </Link>
          )}

          <div className="flex items-center gap-2">
            {/* Assign dropdown */}
            {showAssign && (
              <Menu as="div" className="relative flex-1">
                <Menu.Button
                  disabled={isAssigning}
                  className="w-full btn-secondary text-sm py-1.5 flex items-center justify-center gap-1"
                >
                  {isAssigning ? (
                    'Assigning...'
                  ) : (
                    <>
                      <span className="truncate">
                        {image.person?.name || 'Assign'}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 flex-shrink-0" />
                    </>
                  )}
                </Menu.Button>
                <Menu.Items className="absolute bottom-full left-0 mb-1 w-full bg-dark-300 border border-dark-100 rounded-lg shadow-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleAssign(null)}
                        className={`w-full px-3 py-2 text-left text-sm ${
                          active ? 'bg-dark-200' : ''
                        } text-gray-400`}
                      >
                        Unassign
                      </button>
                    )}
                  </Menu.Item>
                  {people.map((person) => (
                    <Menu.Item key={person.id}>
                      {({ active }) => (
                        <button
                          onClick={() => handleAssign(person.id)}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            active ? 'bg-dark-200' : ''
                          } ${
                            image.person_id === person.id
                              ? 'text-primary-400'
                              : 'text-gray-100'
                          }`}
                        >
                          {person.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>
            )}

            {/* Reprocess button */}
            {image.has_face && !image.is_identified && (
              <button
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="btn-ghost p-1.5"
                title="Reprocess image"
              >
                <ArrowPathIcon 
                  className={`h-5 w-5 ${isReprocessing ? 'animate-spin' : ''}`} 
                />
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
              title="Delete image"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Image"
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-dark-400 flex-shrink-0">
              <img
                src={image.url}
                alt={image.original_filename || 'Image'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-gray-300">
                Are you sure you want to delete this image?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-2"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

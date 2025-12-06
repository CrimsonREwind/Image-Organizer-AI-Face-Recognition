import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { peopleApi } from '../api';
import ImageGrid from '../components/ImageGrid';
import Modal from '../components/Modal';
import { PageLoader } from '../components/LoadingSpinner';

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [images, setImages] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 30,
    total: 0,
    pages: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteImages, setDeleteImages] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id, pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imagesRes, peopleRes] = await Promise.all([
        peopleApi.getImages(id, {
          page: pagination.page,
          per_page: pagination.per_page,
        }),
        peopleApi.getAll(),
      ]);

      setPerson(imagesRes.person);
      setImages(imagesRes.data);
      setAllPeople(peopleRes.data);
      setPagination((prev) => ({
        ...prev,
        ...imagesRes.pagination,
      }));
    } catch (error) {
      toast.error('Failed to load person');
      navigate('/people');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const result = await peopleApi.update(id, { name: editName.trim() });
      toast.success('Person updated');
      setPerson(result.data);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await peopleApi.delete(id, deleteImages);
      toast.success('Person deleted');
      navigate('/people');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleImageDelete = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setPagination((prev) => ({
      ...prev,
      total: prev.total - 1,
    }));
    setPerson((prev) => ({
      ...prev,
      image_count: prev.image_count - 1,
    }));
  };

  const handleImageAssign = (imageId, personId) => {
    if (personId !== id) {
      // Image was reassigned to another person
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
      setPerson((prev) => ({
        ...prev,
        image_count: prev.image_count - 1,
      }));
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!person) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/people"
            className="btn-ghost p-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            {person.thumbnail_url && (
              <img
                src={person.thumbnail_url}
                alt={person.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-dark-100"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-100">{person.name}</h1>
              <p className="text-gray-500 mt-1">
                {person.image_count} {person.image_count === 1 ? 'image' : 'images'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(person.name);
              setIsEditing(true);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setIsDeleting(true)}
            className="btn-danger flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Image Grid */}
      <ImageGrid
        images={images}
        people={allPeople}
        loading={false}
        onDelete={handleImageDelete}
        onAssign={handleImageAssign}
        emptyMessage="No images for this person yet"
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.pages}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

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
    </div>
  );
}

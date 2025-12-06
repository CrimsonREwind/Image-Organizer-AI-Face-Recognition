import { useState, useEffect } from 'react';
import { imagesApi, peopleApi } from '../api';
import ImageGrid from '../components/ImageGrid';

export default function Unidentified() {
  const [images, setImages] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 30,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchData();
  }, [pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imagesRes, peopleRes] = await Promise.all([
        imagesApi.getAll({
          page: pagination.page,
          per_page: pagination.per_page,
          filter: 'unidentified',
        }),
        peopleApi.getAll(),
      ]);

      setImages(imagesRes.data);
      setPeople(peopleRes.data);
      setPagination((prev) => ({
        ...prev,
        ...imagesRes.pagination,
      }));
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setPagination((prev) => ({
      ...prev,
      total: prev.total - 1,
    }));
  };

  const handleAssign = (imageId, personId) => {
    if (personId) {
      // Remove from unidentified list when assigned
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Unidentified Faces</h1>
        <p className="text-gray-500 mt-1">
          {pagination.total} images with faces that need to be assigned to people
        </p>
      </div>

      {/* Tips Card */}
      {images.length > 0 && (
        <div className="card p-4 bg-yellow-500/10 border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            <strong>Tip:</strong> Assign these images to people using the dropdown menu.
            The AI will learn from your assignments to better identify faces in future uploads.
          </p>
        </div>
      )}

      {/* Image Grid */}
      <ImageGrid
        images={images}
        people={people}
        loading={loading}
        onDelete={handleDelete}
        onAssign={handleAssign}
        showPerson={false}
        emptyMessage="No unidentified faces. Great job!"
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
    </div>
  );
}

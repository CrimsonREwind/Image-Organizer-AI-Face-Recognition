import { useState, useEffect } from 'react';
import { imagesApi, peopleApi } from '../api';
import ImageGrid from '../components/ImageGrid';

export default function AllImages() {
  const [images, setImages] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 30,
    total: 0,
    pages: 0,
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [pagination.page, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imagesRes, peopleRes] = await Promise.all([
        imagesApi.getAll({
          page: pagination.page,
          per_page: pagination.per_page,
          filter,
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

  const handleAssign = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">All Images</h1>
          <p className="text-gray-500 mt-1">
            {pagination.total} images in your collection
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'identified', label: 'Identified' },
            { value: 'unidentified', label: 'Unidentified' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === option.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-300 text-gray-400 hover:bg-dark-200 hover:text-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      <ImageGrid
        images={images}
        people={people}
        loading={loading}
        onDelete={handleDelete}
        onAssign={handleAssign}
        emptyMessage="No images found"
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

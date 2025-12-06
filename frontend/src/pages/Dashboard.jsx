import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PhotoIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { statsApi } from '../api';
import StatCard from '../components/StatCard';
import { PageLoader } from '../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentImages, setRecentImages] = useState([]);
  const [unidentified, setUnidentified] = useState([]);
  const [topPeople, setTopPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentRes, unidentifiedRes, peopleRes] = await Promise.all([
        statsApi.getStats(),
        statsApi.getRecent(),
        statsApi.getUnidentified(),
        statsApi.getPeopleSummary(),
      ]);

      setStats(statsRes.data);
      setRecentImages(recentRes.data);
      setUnidentified(unidentifiedRes.data);
      setTopPeople(peopleRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your image collection and recognition stats
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Images"
          value={stats?.total_images || 0}
          icon={PhotoIcon}
          color="primary"
        />
        <StatCard
          title="People"
          value={stats?.total_people || 0}
          icon={UserGroupIcon}
          color="purple"
        />
        <StatCard
          title="Identified"
          value={stats?.identified_images || 0}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Unidentified Faces"
          value={stats?.unidentified_faces || 0}
          icon={QuestionMarkCircleIcon}
          color="yellow"
        />
      </div>

      {/* Progress Bar */}
      {stats?.total_images > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              Recognition Progress
            </span>
            <span className="text-sm text-gray-500">
              {stats?.identification_rate}% identified
            </span>
          </div>
          <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats?.identification_rate}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            />
          </div>
        </div>
      )}

      {/* People Grid */}
      {topPeople.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-100">People</h2>
            <Link
              to="/people"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {topPeople.map((person) => (
              <Link
                key={person.id}
                to={`/people/${person.id}`}
                className="card group overflow-hidden"
              >
                <div className="aspect-square bg-dark-400 overflow-hidden">
                  {person.thumbnail_url ? (
                    <img
                      src={person.thumbnail_url}
                      alt={person.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserGroupIcon className="h-12 w-12 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-100 truncate text-sm">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {person.image_count} images
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Uploads */}
      {recentImages.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-100">Recent Uploads</h2>
            <Link
              to="/images"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentImages.slice(0, 6).map((image) => (
              <div key={image.id} className="card overflow-hidden group">
                <div className="aspect-square bg-dark-400 overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.original_filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {image.person && (
                  <Link
                    to={`/people/${image.person.id}`}
                    className="p-2 block text-sm text-gray-400 hover:text-primary-400 truncate"
                  >
                    {image.person.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unidentified Faces */}
      {unidentified.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-100">
              Unidentified Faces
            </h2>
            <Link
              to="/unidentified"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {unidentified.slice(0, 6).map((image) => (
              <div key={image.id} className="card overflow-hidden group">
                <div className="aspect-square bg-dark-400 overflow-hidden relative">
                  <img
                    src={image.url}
                    alt={image.original_filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      {image.face_count} face{image.face_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {stats?.total_images === 0 && (
        <div className="card p-12 text-center">
          <PhotoIcon className="h-16 w-16 text-gray-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-100 mt-4">
            No images yet
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Start by uploading some images to organize your collection
          </p>
          <Link to="/upload" className="btn-primary">
            Upload Images
          </Link>
        </div>
      )}
    </div>
  );
}

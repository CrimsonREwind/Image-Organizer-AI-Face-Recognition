import { AnimatePresence } from 'framer-motion';
import ImageCard from './ImageCard';
import { PageLoader } from './LoadingSpinner';

export default function ImageGrid({ 
  images, 
  people = [], 
  loading = false, 
  onDelete, 
  onAssign,
  showAssign = true,
  showPerson = true,
  emptyMessage = 'No images found'
}) {
  if (loading) {
    return <PageLoader />;
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <AnimatePresence mode="popLayout">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            people={people}
            onDelete={onDelete}
            onAssign={onAssign}
            showAssign={showAssign}
            showPerson={showPerson}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

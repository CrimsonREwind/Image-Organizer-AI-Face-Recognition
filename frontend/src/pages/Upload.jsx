import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { imagesApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 16 * 1024 * 1024; // 16MB

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Max size is 16MB.`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a supported image type.`);
        }
      });
    });

    // Add accepted files with preview
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  const removeFile = (fileId) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults([]);

    try {
      const result = await imagesApi.upload(files, setProgress);
      setResults(result.results);
      
      const successCount = result.results.filter((r) => r.success).length;
      const facesCount = result.results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + (r.faces_detected || 0), 0);
      const matchedCount = result.results.filter((r) => r.matched_person).length;

      if (successCount === files.length) {
        toast.success(
          `Uploaded ${successCount} images. Found ${facesCount} faces, matched ${matchedCount}.`
        );
      } else {
        toast.error(
          `Uploaded ${successCount} of ${files.length} images. Some uploads failed.`
        );
      }

      // Clear successfully uploaded files
      const successfulFilenames = result.results
        .filter((r) => r.success)
        .map((r) => r.filename);
      
      setFiles((prev) =>
        prev.filter((f) => !successfulFilenames.includes(f.name))
      );
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Upload Images</h1>
        <p className="text-gray-500 mt-1">
          Upload images to automatically detect and organize faces
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`card border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-dark-100 hover:border-primary-500/50 hover:bg-dark-400/50'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon
          className={`h-16 w-16 mx-auto ${
            isDragActive ? 'text-primary-500' : 'text-gray-600'
          }`}
        />
        <p className="mt-4 text-lg font-medium text-gray-100">
          {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          or click to select files
        </p>
        <p className="mt-4 text-xs text-gray-600">
          Supports JPEG, PNG, GIF, WebP • Max 16MB per file
        </p>
      </div>

      {/* File Preview */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">
                Selected Files ({files.length})
              </h2>
              <button onClick={clearAll} className="btn-ghost text-sm">
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-dark-400">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="h-4 w-4 text-white" />
                  </button>
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {file.name}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary px-8 py-3 text-lg flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Uploading... {progress}%
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-6 w-6" />
                    Upload {files.length} {files.length === 1 ? 'Image' : 'Images'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      {uploading && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Uploading...</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-100">
              Upload Results
            </h2>

            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`card p-4 flex items-center gap-4 ${
                    result.success
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 truncate">
                      {result.filename}
                    </p>
                    {result.success ? (
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {result.faces_detected} face{result.faces_detected !== 1 ? 's' : ''} detected
                        </span>
                        {result.matched_person && (
                          <span className="text-green-400">• Matched</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-red-400">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/images')}
                className="btn-primary"
              >
                View All Images
              </button>
              <button onClick={clearAll} className="btn-secondary">
                Upload More
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

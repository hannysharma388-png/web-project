import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SubmissionModal = ({ isOpen, onClose, assignment, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onDrop = (acceptedFiles, fileRejections) => {
    setErrorMsg('');
    if (fileRejections.length > 0) {
      setErrorMsg('Invalid file. Ensure it is an Image/PDF under 10MB.');
      return;
    }
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);

    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const ObjectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(ObjectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  useEffect(() => {
    return () => {
      // revoke URL to avoid memory leaks
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async () => {
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMsg('');

    const formData = new FormData();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    formData.append('assignment', assignment._id);
    formData.append('student', currentUser.id || currentUser._id);
    formData.append('file', file);
    if (feedback) formData.append('feedback', feedback);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/academic/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setIsUploading(false);
      onSuccess(); // Close modal and show parent toast
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setErrorMsg(err.response?.data?.error || 'Upload failed. Please try again.');
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrorMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-100 dark:border-slate-700"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                <i className="fas fa-cloud-upload-alt text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{assignment.title}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Upload your submission file</p>
            </div>
            <button onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="mb-6">
            <div 
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isDragActive 
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                  : file ? 'border-gray-200 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-900/50' : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-slate-900/20'
              }`} 
            >
              <input {...getInputProps()} disabled={isUploading} />
              
              {isDragActive ? (
                <div className="py-8">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <i className="fas fa-arrow-down text-2xl"></i>
                  </div>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">Drop it here!</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                     {previewUrl ? (
                      <div className="relative rounded-xl overflow-hidden shadow-md">
                        <img src={previewUrl} alt="Preview" className="max-h-40 object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center shadow-sm border border-red-200/50 dark:border-red-500/20">
                        <i className="fas fa-file-pdf text-4xl"></i>
                      </div>
                    )}
                    {!isUploading && (
                      <button 
                        onClick={removeFile}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-slate-700 rounded-full shadow-lg text-gray-500 hover:text-red-500 flex items-center justify-center border border-gray-100 dark:border-slate-600 transition-colors"
                        title="Remove file"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-cloud-upload-alt text-2xl text-indigo-500"></i>
                  </div>
                  <p className="text-gray-700 dark:text-white font-bold text-lg mb-1">Drag & drop your file</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">or browse from your computer</p>
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-800 inline-flex px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                    <span>PDF</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                    <span>JPG/PNG</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                    <span>Max 10MB</span>
                  </div>
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r-lg"
                >
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                    <i className="fas fa-exclamation-circle pt-0.5"></i> {errorMsg}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Additional Comments (Optional)</label>
            <textarea 
              placeholder="Add any notes for the faculty..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
              disabled={isUploading}
            />
          </div>

          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <i className="fas fa-spinner fa-spin"></i> Uploading...
                  </span>
                  <span className="font-bold text-gray-700 dark:text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 p-0.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                    className="bg-indigo-500 h-full rounded-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full transform skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </motion.div>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 text-center font-medium">Please wait while we securely upload your file.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shadow-sm"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              className={`flex-1 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                isUploading || !file 
                  ? 'bg-indigo-400 dark:bg-indigo-500/50 shadow-none cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none hover:shadow-xl'
              }`}
              disabled={isUploading || !file}
            >
              {isUploading ? (
                <>Processing...</>
              ) : (
                <>
                  <i className="fas fa-paper-plane text-sm"></i> Submit Work
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionModal;

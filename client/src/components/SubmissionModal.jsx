import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

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
    formData.append('assignmentId', assignment._id);
    formData.append('studentId', JSON.parse(localStorage.getItem('user'))._id);
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
      setErrorMsg('Upload failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">{assignment.title}</h3>
        
        <div className="mb-6">
          <div 
            className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`} 
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-indigo-600 font-medium my-4">Drop your file here...</p>
            ) : previewUrl ? (
              <div className="flex flex-col items-center">
                <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg mb-2 shadow-sm" />
                <p className="text-sm font-medium text-gray-600 truncate w-full">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Click or drag to replace</p>
              </div>
            ) : file ? (
               <div className="flex flex-col items-center my-4">
                  <i className="fas fa-file-pdf text-4xl text-red-500 mb-2"></i>
                  <p className="text-sm font-medium text-gray-600 truncate w-full">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Click or drag to replace</p>
               </div>
            ) : (
              <div className="my-4">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3 block"></i>
                <p className="text-gray-600 font-medium">Drag & drop PDF/Image or click</p>
                <p className="text-sm text-gray-500 mt-1">Max file size: 10MB</p>
              </div>
            )}
          </div>
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
        </div>

        <textarea 
          placeholder="Additional comments (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full p-4 border border-gray-200 shadow-sm rounded-xl mb-6 h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={isUploading}
        />

        {isUploading && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1 text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className={`flex-1 text-white py-3 rounded-xl font-medium transition-all shadow-md ${
              isUploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
            }`}
            disabled={isUploading || !file}
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const SubmissionModal = ({ isOpen, onClose, assignment, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState('');

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': [] },
    maxFiles: 1
  });

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('assignmentId', assignment._id);
    formData.append('studentId', JSON.parse(localStorage.getItem('user'))._id);
    if (file) formData.append('file', file);
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6">{assignment.title}</h3>
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-indigo-400 transition-colors" {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-indigo-600 font-medium">Drop PDF here...</p>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2 block"></i>
              <p className="text-gray-600 font-medium">Drag & drop PDF or click</p>
              <p className="text-sm text-gray-500">Max 10MB</p>
              {file && <p className="mt-2 text-green-600 text-sm font-medium">Selected: {file.name}</p>}
            </>
          )}
        </div>
        <textarea 
          placeholder="Additional comments (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full p-3 border rounded-xl mb-6 h-24"
        />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-xl font-medium">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">Submit Assignment</button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal;

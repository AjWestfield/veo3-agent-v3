'use client';

import React from 'react';

export default function TestDragDrop() {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag enter');
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag over');
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drag leave');
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop', e.dataTransfer.files);
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl mb-4">Drag & Drop Test</h1>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragOver ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p className="text-center">
          {isDragOver ? 'Drop files here!' : 'Drag files here to test'}
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl mb-2">Dropped files:</h2>
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name} - {file.type}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-400">
        <p>Open the browser console to see drag events being logged.</p>
      </div>
    </div>
  );
}

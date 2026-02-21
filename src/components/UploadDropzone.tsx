"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFiles: (files: File[]) => void;
  loading: boolean;
}

export default function UploadDropzone({ onFiles, loading }: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    multiple: true,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-brand bg-red-50" : "border-gray-300 bg-white hover:border-brand hover:bg-red-50"}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      {loading ? (
        <p className="text-lg text-gray-500">⏳ Processing your file…</p>
      ) : isDragActive ? (
        <p className="text-lg text-brand font-medium">Drop it here! 📂</p>
      ) : (
        <>
          <div className="text-5xl mb-4">📄</div>
          <p className="text-xl font-semibold text-gray-700">
            Drop your CSV here
          </p>
          <p className="text-gray-400 mt-2">or click to browse</p>
          <p className="text-sm text-gray-400 mt-4">
            Accepts: Reservations CSV or Earnings CSV from Airbnb
          </p>
        </>
      )}
    </div>
  );
}

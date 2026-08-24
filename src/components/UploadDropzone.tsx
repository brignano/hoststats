"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "./icons";

interface Props {
  onFiles: (files: File[]) => void;
  loading: boolean;
  onCancel?: () => void;
}

export default function UploadDropzone({ onFiles, loading, onCancel }: Props) {
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
      aria-label="Upload your Airbnb CSV exports"
      aria-busy={loading}
      className={`
        border border-dashed rounded-lg p-s7 text-center cursor-pointer min-h-[220px]
        flex flex-col items-center justify-center
        transition-colors duration-fast ease-brand
        ${
          isDragActive
            ? "border-interactive bg-interactive-surface"
            : "border-line-strong bg-card hover:bg-surface-hover"
        }
        ${loading ? "opacity-60 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <p className="text-base text-ink-soft" role="status">
            Processing your files…
          </p>
        ) : isDragActive ? (
          <p className="text-base font-medium text-interactive-ink">Drop them here</p>
        ) : (
          <>
            <UploadIcon className="w-8 h-8 mb-s3 text-slate" />
            <p className="text-lg font-medium text-ink">Drop your CSVs here</p>
            <p className="text-sm text-slate mt-s1">or click to browse files</p>
            <p className="text-xs text-slate mt-s4 max-w-[34ch]">
              You can upload both your Reservations CSV and Earnings CSV at the same time
            </p>
          </>
        )}
      </div>
      {onCancel && !loading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="mt-s4 text-sm text-ink-soft underline hover:text-ink rounded-sm px-s2 py-s1"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

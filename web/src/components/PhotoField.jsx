import { useEffect, useMemo, useRef, useState } from "react";

export default function PhotoField({ file, onFileChange, existingImageUrl, editHint, dropzoneClassName = "" }) {
  const fileInputRef = useRef(null);
  const captureInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl]);
  const previewUrl = objectUrl || existingImageUrl || null;

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      return;
    }
    setCameraOpen(true);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError(
        "Impossible d'accéder à votre caméra (permission refusée ou indisponible). Fermez ceci et utilisez la zone d'importation à la place."
      );
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function switchCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Impossible de changer de caméra.");
    }
  }

  function shoot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        onFileChange(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChange(dropped);
  }

  return (
    <div className="photo-input">
      <label
        className={`dropzone${dropzoneClassName ? " " + dropzoneClassName : ""}${previewUrl ? " has-image" : ""}${dragging ? " drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
        />
        {!previewUrl && (
          <div className="dropzone-inner">
            <span className="dz-icon">＋</span>
            <span className="dz-text">Déposez une photo ou cliquez pour parcourir</span>
          </div>
        )}
        {previewUrl && (
          <>
            <img className="preview" src={previewUrl} alt="" />
            {editHint && <span className="edit-photo-hint">{editHint}</span>}
            <button
              type="button"
              className="retake-btn"
              aria-label="Retirer la photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFileChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              ✕
            </button>
          </>
        )}
      </label>

      <button type="button" className="camera-btn" onClick={openCamera}>
        <span className="cam-dot" />
        Prendre une photo
      </button>
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
      />

      {cameraOpen && (
        <div
          className="camera-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCamera();
          }}
        >
          <div className="camera-frame">
            <video ref={videoRef} autoPlay playsInline muted hidden={!!cameraError} />
            <canvas ref={canvasRef} hidden />
            {cameraError && <p className="camera-error">{cameraError}</p>}
            <div className="camera-controls">
              <button type="button" className="cam-icon-btn" aria-label="Fermer la caméra" onClick={closeCamera}>
                ✕
              </button>
              <button type="button" className="shutter" aria-label="Prendre la photo" onClick={shoot} />
              <button type="button" className="cam-icon-btn" aria-label="Changer de caméra" onClick={switchCamera}>
                ⟲
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";

export default function AudioField({ file, onFileChange }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState("");

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => objectUrl && URL.revokeObjectURL(objectUrl), [objectUrl]);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("L'enregistrement audio n'est pas pris en charge par ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes("mp4") ? "m4a" : "webm";
        onFileChange(new File([blob], `voice-${Date.now()}.${ext}`, { type }));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsedMs(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 200);
    } catch {
      setError("Impossible d'accéder au micro (permission refusée ou indisponible).");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }

  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="audio-input">
      {objectUrl ? (
        <div className="audio-preview">
          <audio controls src={objectUrl} />
          <button type="button" className="audio-remove-btn" aria-label="Supprimer la note vocale" onClick={() => onFileChange(null)}>
            ✕
          </button>
        </div>
      ) : recording ? (
        <button type="button" className="camera-btn recording" onClick={stopRecording}>
          <span className="rec-dot" />
          Arrêter l'enregistrement · {seconds}s
        </button>
      ) : (
        <button type="button" className="camera-btn" onClick={startRecording}>
          <span className="cam-dot" />
          🎤 Ajouter une note vocale (facultatif)
        </button>
      )}
      {error && <p className="audio-error">{error}</p>}
    </div>
  );
}

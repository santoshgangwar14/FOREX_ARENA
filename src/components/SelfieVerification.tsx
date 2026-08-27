import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  Camera,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SelfieVerificationProps {
  existingUrl?: string;
  disabled?: boolean;
  autoStart?: boolean;
  onStarted?: () => void;
  onVerified: (url: string) => void;
}

type Stage =
  | 'idle'
  | 'starting'
  | 'ready'
  | 'countdown'
  | 'uploading'
  | 'complete';

const COUNTDOWN_SECONDS = 3;

export default function SelfieVerification({
  existingUrl,
  disabled = false,
  autoStart = false,
  onStarted,
  onVerified,
}: SelfieVerificationProps) {
  const { currentUser } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef(COUNTDOWN_SECONDS);

  const [stage, setStage] = useState<Stage>(
    existingUrl ? 'complete' : 'idle'
  );
  const [countdown, setCountdown] = useState(
    COUNTDOWN_SECONDS
  );
  const [message, setMessage] = useState(
    existingUrl
      ? 'Live selfie completed.'
      : 'Start the camera check to continue.'
  );
  const [error, setError] = useState('');

  const stopCamera = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const captureBlob = async () => {
    const video = videoRef.current;

    if (
      !video ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      throw new Error(
        'Camera is not ready. Please try again.'
      );
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(
        'Unable to prepare the selfie capture.'
      );
    }

    // Mirror the front camera image so the saved result feels natural.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                'Unable to capture the selfie.'
              )
            );
            return;
          }

          resolve(blob);
        },
        'image/jpeg',
        0.88
      );
    });
  };

  const startVerification = async () => {
    if (disabled || !currentUser) return;

    setError('');
    setStage('starting');
    setMessage('Requesting camera permission...');
    onStarted?.();

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera access is not available in this browser.'
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        throw new Error(
          'Camera preview could not be created.'
        );
      }

      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }

        const handler = () => {
          video.removeEventListener(
            'loadedmetadata',
            handler
          );
          resolve();
        };

        video.addEventListener(
          'loadedmetadata',
          handler
        );
      });

      await video.play();

      setStage('ready');
      setMessage(
        'Center your face inside the guide and keep still.'
      );

      // Small delay lets the camera preview settle.
      window.setTimeout(() => {
        beginCountdown();
      }, 900);
    } catch (err: any) {
      console.error(
        'Selfie camera start failed:',
        err
      );

      stopCamera();
      setStage('idle');

      if (
        err?.name === 'NotAllowedError'
      ) {
        setError(
          'Camera permission was denied. Allow camera access for localhost and click Start again.'
        );
      } else if (
        err?.name === 'NotFoundError'
      ) {
        setError(
          'No camera was found on this device.'
        );
      } else {
        setError(
          err?.message ||
            'Unable to start the camera.'
        );
      }
    }
  };

  const beginCountdown = () => {
    countdownRef.current =
      COUNTDOWN_SECONDS;

    setCountdown(COUNTDOWN_SECONDS);
    setStage('countdown');
    setMessage(
      'Hold still while we capture your selfie.'
    );

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      countdownRef.current -= 1;

      setCountdown(
        countdownRef.current
      );

      if (countdownRef.current <= 0) {
        if (timerRef.current !== null) {
          window.clearInterval(
            timerRef.current
          );
          timerRef.current = null;
        }

        void finishCapture();
      }
    }, 1000);
  };

  const finishCapture = async () => {
    try {
      setStage('uploading');
      setMessage(
        'Securing your selfie...'
      );

      const blob = await captureBlob();

      if (!currentUser) {
        throw new Error(
          'You must be signed in.'
        );
      }

      const path =
        `kyc/${currentUser.uid}/selfie/` +
        `${Date.now()}-live-selfie.jpg`;

      const fileRef = ref(
        storage,
        path
      );

      const uploaded =
        await uploadBytes(
          fileRef,
          blob,
          {
            contentType:
              'image/jpeg',
            customMetadata: {
              uid: currentUser.uid,
              verificationType:
                'basic-live-selfie',
            },
          }
        );

      const url =
        await getDownloadURL(
          uploaded.ref
        );

      onVerified(url);
      setStage('complete');
      setMessage(
        'Live selfie captured successfully.'
      );

      stopCamera();
    } catch (err: any) {
      console.error(
        'Selfie capture/upload failed:',
        err
      );

      stopCamera();
      setStage('idle');
      setError(
        err?.code ===
          'storage/unauthorized'
          ? 'Selfie upload is not permitted by the current Storage rules.'
          : err?.message ||
              'Unable to complete selfie verification.'
      );
    }
  };

  const reset = () => {
    stopCamera();
    setError('');
    setCountdown(
      COUNTDOWN_SECONDS
    );
    setStage('idle');
    setMessage(
      'Start the camera check to continue.'
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#101318] overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
            Live identity check
          </p>

          <h3 className="text-base font-bold mt-1">
            Selfie verification
          </h3>
        </div>

        <ShieldCheck className="w-5 h-5 text-amber-400" />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5">

          <div className="rounded-2xl border border-zinc-800 bg-black overflow-hidden">
            <div className="relative aspect-video bg-[#07090c]">

              {stage === 'complete' &&
              existingUrl ? (
                <>
                  <img
                    src={existingUrl}
                    alt="Completed selfie verification"
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/75 px-3 py-2 text-[10px] font-bold text-emerald-300 backdrop-blur">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verification complete
                  </div>
                </>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className={`w-full h-full object-cover ${
                      stage === 'idle'
                        ? 'hidden'
                        : 'block'
                    }`}
                  />

                  {stage === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-14 h-14 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-3">
                        <Camera className="w-6 h-6 text-amber-400" />
                      </div>

                      <p className="text-sm font-semibold text-white">
                        Camera verification
                      </p>

                      <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                        Allow camera access, center your face,
                        and keep still for the capture.
                      </p>
                    </div>
                  )}

                  {stage !== 'idle' &&
                    stage !== 'complete' && (
                      <>
                        <div className="absolute inset-[12%_27%] rounded-[46%] border-2 border-amber-400/75 pointer-events-none" />

                        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[85%] rounded-lg bg-black/75 border border-zinc-700 px-3 py-2 text-[10px] font-semibold text-white text-center backdrop-blur">
                          {message}
                        </div>
                      </>
                    )}

                  {stage === 'countdown' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-black/70 border border-amber-400/70 flex items-center justify-center">
                        <span className="text-2xl font-bold text-amber-300">
                          {countdown}
                        </span>
                      </div>
                    </div>
                  )}

                  {stage === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 border-t border-rose-900/60 bg-rose-950/20 text-xs text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Before you start
              </p>

              <div className="mt-3 space-y-3">
                {[
                  'Use a device with a working camera.',
                  'Allow camera access when prompted.',
                  'Make sure only you are visible.',
                  'Keep your face centered and well lit.',
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] flex items-center justify-center text-zinc-500 shrink-0">
                      {index + 1}
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#0b0e12] p-3 text-[10px] text-zinc-600 leading-relaxed">
              This is a free browser-based selfie check.
              It is not a certified biometric KYC/liveness
              provider.
            </div>

            {stage === 'complete' ? (
              <button
                type="button"
                onClick={reset}
                disabled={disabled}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Recheck selfie
              </button>
            ) : (
              <>
                <button
                  id="start-live-selfie-btn"
                  type="button"
                  onClick={startVerification}
                  disabled={
                    disabled ||
                    stage === 'starting' ||
                    stage === 'ready' ||
                    stage === 'countdown' ||
                    stage === 'uploading'
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-50"
                >
                  {stage === 'starting' ||
                  stage === 'ready' ||
                  stage === 'countdown' ||
                  stage === 'uploading' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {stage === 'uploading'
                        ? 'Uploading...'
                        : 'Camera check running...'}
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      Start live selfie check
                    </>
                  )}
                </button>

                {stage !== 'idle' && (
                  <button
                    type="button"
                    onClick={reset}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 text-xs font-semibold hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel camera
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
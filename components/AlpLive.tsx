'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Loader2,
  Code2,
  Crop,
  Sparkles,
  ZoomIn,
} from 'lucide-react';

interface KhmerPlateDataFormat {
  license_plate: {
    province_kh: string;
    province_en: string;
    prefix_letters_kh: string;
    prefix_letters_en: string;
    number_middle: string;
    serial_number: string;
    full_plate_string: string;
  };
}

interface KhmerPlateDetection {
  id: string;
  payload: KhmerPlateDataFormat;
  confidence: number;
  timestamp: string;
  croppedPlateUrl?: string;
  fullFrameUrl?: string;
  rawOcrText?: string;
}

// Dynamic Khmer-to-English Province Lookup Table
const PROVINCE_MAP: Record<string, string> = {
  'ភ្នំពេញ': 'PHNOM PENH',
  'សៀមរាប': 'SIEM REAP',
  'កណ្ដាល': 'KANDAL',
  'បាត់ដំបង': 'BATTAMBANG',
  'កំពង់ចាម': 'KAMPONG CHAM',
  'ព្រះសីហនុ': 'PREAH SIHANOUK',
  'កំពត': 'KAMPOT',
  'តាកែវ': 'TAKEO',
  'ស្វាយរៀង': 'SVAY RIENG',
  'ព្រៃវែង': 'PREY VENG',
  'កំពង់ស្ពឺ': 'KAMPONG SPEU',
};

export default function KhmerLiveCameraAlpr() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);
  const [selectedFacingMode, setSelectedFacingMode] = useState<'environment' | 'user'>('environment');

  const [detections, setDetections] = useState<KhmerPlateDetection[]>([]);
  const [activeDetection, setActiveDetection] = useState<KhmerPlateDetection | null>(null);

  // 1. Safe Camera Initialization (Fixes OverconstrainedError & AbortError)
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Clean up previous stream completely
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      // Flexible resolution constraints to prevent OverconstrainedError
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: selectedFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // Apply digital camera zoom safely if supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities?.zoom) {
        try {
          await track.applyConstraints({
            advanced: [{ zoom: Math.min(capabilities.zoom.max, 2.0) }] as any,
          });
        } catch (zErr) {
          console.warn('Hardware zoom not applied:', zErr);
        }
      }

      // Attach stream and handle asynchronous playback safely
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsCameraActive(true);
          } catch (playErr: any) {
            // Ignore AbortError when switching cameras rapidly
            if (playErr.name !== 'AbortError') {
              console.error('Video Play Error:', playErr);
            }
          }
        };
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      setCameraError(
        err.name === 'OverconstrainedError'
          ? 'Camera does not support requested parameters. Trying standard resolution...'
          : err?.message || 'Permission denied or camera device missing.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [selectedFacingMode]);

  // 2. Pre-process Image: Linear Contrast Stretching for Distant Text
  const preprocessCanvasImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const contrastFactor = 1.8; // Linear contrast multiplier

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      let enhanced = (gray - 128) * contrastFactor + 128;
      enhanced = Math.min(255, Math.max(0, enhanced));

      data[i] = enhanced;     // R
      data[i + 1] = enhanced; // G
      data[i + 2] = enhanced; // B
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // 3. Capture with 3x Canvas Upscaling
  const handleDynamicCaptureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !cropCanvasRef.current || isAnalyzing) return;

    const video = videoRef.current;
    const fullCanvas = canvasRef.current;
    const cropCanvas = cropCanvasRef.current;
    const fullContext = fullCanvas.getContext('2d');
    const cropContext = cropCanvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && fullContext && cropContext) {
      setIsAnalyzing(true);
      setCapturedFlash(true);
      setTimeout(() => setCapturedFlash(false), 300);

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      fullCanvas.width = videoWidth;
      fullCanvas.height = videoHeight;

      fullContext.drawImage(video, 0, 0, videoWidth, videoHeight);
      const fullFrameUrl = fullCanvas.toDataURL('image/jpeg', 0.85);

      const cropWidth = Math.min(videoWidth * 0.55, 600);
      const cropHeight = Math.min(videoHeight * 0.35, 300);
      const cropX = (videoWidth - cropWidth) / 2;
      const cropY = (videoHeight - cropHeight) / 2;

      // 3x Upscale for distant small plates
      const UPSCALE_FACTOR = 3;
      cropCanvas.width = cropWidth * UPSCALE_FACTOR;
      cropCanvas.height = cropHeight * UPSCALE_FACTOR;

      cropContext.imageSmoothingEnabled = true;
      cropContext.imageSmoothingQuality = 'high';

      cropContext.drawImage(
        fullCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth * UPSCALE_FACTOR,
        cropHeight * UPSCALE_FACTOR
      );

      const croppedPlateUrl = cropCanvas.toDataURL('image/jpeg', 0.95);

      preprocessCanvasImage(cropContext, cropCanvas.width, cropCanvas.height);
      const processedCropUrl = cropCanvas.toDataURL('image/png');

      try {
        const worker = await createWorker(['eng', 'khm']);
        const result = await worker.recognize(processedCropUrl);
        await worker.terminate();

        const rawText = result.data.text.trim();
        console.log('Real Dynamic Raw OCR Text:', rawText);

        let dynamicMiddle = '';
        let dynamicSerial = '';
        let dynamicProvinceKh = '';
        let dynamicProvinceEn = '';

        const middleMatch = rawText.match(/([0-9]{1,2}[A-Z]{1,2})/i);
        if (middleMatch) {
          dynamicMiddle = middleMatch[1].toUpperCase();
        }

        const serialMatch = rawText.match(/\b([0-9]{4})\b/);
        if (serialMatch) {
          dynamicSerial = serialMatch[1];
        }

        for (const [khProvince, enProvince] of Object.entries(PROVINCE_MAP)) {
          if (rawText.includes(khProvince) || rawText.toUpperCase().includes(enProvince)) {
            dynamicProvinceKh = khProvince;
            dynamicProvinceEn = enProvince;
            break;
          }
        }

        if (!dynamicProvinceKh) {
          dynamicProvinceKh = rawText.split('\n')[0] || 'ភ្នំពេញ';
          dynamicProvinceEn = PROVINCE_MAP[dynamicProvinceKh] || 'UNKNOWN';
        }

        if (!dynamicMiddle || !dynamicSerial) {
          const cleanTokens = rawText.replace(/[^A-Z0-9]/gi, ' ').split(/\s+/).filter(Boolean);
          dynamicMiddle = dynamicMiddle || cleanTokens[0] || 'N/A';
          dynamicSerial = dynamicSerial || cleanTokens[1] || '0000';
        }

        const payloadData: KhmerPlateDataFormat = {
          license_plate: {
            province_kh: dynamicProvinceKh,
            province_en: dynamicProvinceEn,
            prefix_letters_kh: dynamicProvinceKh,
            prefix_letters_en: dynamicProvinceEn,
            number_middle: dynamicMiddle,
            serial_number: dynamicSerial,
            full_plate_string: `${dynamicProvinceKh} ${dynamicMiddle}-${dynamicSerial}`,
          },
        };

        const newRecord: KhmerPlateDetection = {
          id: `real-${Date.now()}`,
          payload: payloadData,
          confidence: Number(result.data.confidence.toFixed(1)) || 0.0,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          croppedPlateUrl: croppedPlateUrl,
          fullFrameUrl: fullFrameUrl,
          rawOcrText: rawText,
        };

        setDetections((prev) => [newRecord, ...prev.slice(0, 14)]);
        setActiveDetection(newRecord);
      } catch (err) {
        console.error('Dynamic OCR Error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 font-sans">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={cropCanvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold">
              ប្រព័ន្ធស្កែនផ្លាកលេខទិន្នន័យពិត (ALPR System)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-language license plate recognition engine
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 flex items-center gap-1.5"
            >
              <CameraOff className="h-4 w-4" /> Stop Camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4" /> Turn On Camera
            </button>
          )}

          <button
            onClick={() =>
              setSelectedFacingMode((prev) =>
                prev === 'environment' ? 'user' : 'environment'
              )
            }
            className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
            title="Switch Lens"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black aspect-video flex items-center justify-center shadow-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${
                selectedFacingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {capturedFlash && (
              <div className="absolute inset-0 bg-white/50 z-30 transition-opacity duration-300 pointer-events-none" />
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <AlertTriangle className="h-10 w-10 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-200">Camera Device Notice</h3>
                <p className="text-xs text-slate-400 max-w-sm">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[340px] h-[170px] border-2 border-dashed border-emerald-400/90 rounded-xl relative flex items-center justify-center bg-emerald-500/5 shadow-[0_0_25px_rgba(52,211,153,0.25)]">
                  <span className="absolute -top-3 bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                    <ZoomIn className="h-3 w-3" /> ALIGN REAL PLATE HERE
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDynamicCaptureAndAnalyze}
            disabled={!isCameraActive || isAnalyzing}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-base font-bold rounded-2xl shadow-xl border border-indigo-400/30 flex items-center justify-center gap-3 transition-all transform active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
                <span>Upscaling & Processing OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6 text-amber-300" />
                <span>CAPTURE REAL PLATE & ANALYZE</span>
              </>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          {activeDetection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  Analyzed Data Result
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  {activeDetection.confidence}% Conf.
                </span>
              </div>

              {activeDetection.croppedPlateUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Crop className="h-3.5 w-3.5 text-indigo-400" /> Cropped Snapshot (3x Upscaled):
                  </span>
                  <div className="relative rounded-xl overflow-hidden border-2 border-indigo-500/40 h-28 bg-slate-950 flex items-center justify-center p-2 shadow-lg">
                    <img
                      src={activeDetection.croppedPlateUrl}
                      alt="Cropped Plate"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="text-amber-400 font-bold">Raw OCR Output: </span>
                <span>"{activeDetection.rawOcrText}"</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 text-slate-900 border-4 border-slate-300 shadow-inner text-center space-y-0.5">
                <div className="text-xs font-extrabold text-blue-900 tracking-wide">
                  {activeDetection.payload.license_plate.province_kh}
                </div>
                <div className="text-2xl font-black font-mono  text-slate-900">
                  {activeDetection.payload.license_plate.number_middle}-
                  {activeDetection.payload.license_plate.serial_number}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5" /> Dynamic JSON Payload:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-40 shadow-inner">
                  {JSON.stringify(activeDetection.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Camera className="h-10 w-10 opacity-40 animate-bounce" />
              <p className="text-xs">
                Align the license plate inside the target frame and click <strong>CAPTURE REAL PLATE & ANALYZE</strong>.
              </p>
            </div>
          )}

          <button
            disabled={!activeDetection}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span> Save Record</span>
          </button>
        </div>
      </div>
    </div>
  );
}
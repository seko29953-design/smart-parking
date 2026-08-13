'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Loader2,
  Code2,
  Sparkles,
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
  capturedFrameUrl?: string;
  rawOcrText?: string;
}

export default function KhmerLiveCameraAlpr() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);
  const [selectedFacingMode, setSelectedFacingMode] = useState<'environment' | 'user'>('environment');

  const [detections, setDetections] = useState<KhmerPlateDetection[]>([]);
  const [activeDetection, setActiveDetection] = useState<KhmerPlateDetection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanCount, setScanCount] = useState(0);

  // 1. Initialize Camera Feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: selectedFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      setCameraError(err?.message || 'Permission denied or no camera device found.');
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

  // 2. Continuous Auto-Detection Loop
  useEffect(() => {
    if (!isCameraActive || !isAutoScanning) return;

    const interval = setInterval(() => {
      if (!isAnalyzing) {
        captureAndAnalyzeFrame();
      }
    }, 2500); // Scans and checks frame every 2.5s

    return () => clearInterval(interval);
  }, [isCameraActive, isAutoScanning, isAnalyzing]);

  // 3. Capture Frame + Analyze OCR + Format Data
  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      setIsAnalyzing(true);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameUrl = canvas.toDataURL('image/jpeg', 0.9);

      try {
        // Run Client-Side OCR Engine
        const worker = await createWorker('eng');
        const result = await worker.recognize(frameUrl);
        await worker.terminate();

        const rawText = result.data.text.toUpperCase();
        console.log('Raw OCR Text Captured:', rawText);

        // Regex for Cambodian Plate Format: e.g. "2Z-0648", "2I-9999", "1A-8888"
        const plateMatch = rawText.match(/([0-9][A-Z]{1,2})[- ]?([0-9]{4})/i);

        if (plateMatch) {
          // Trigger visual flash feedback on detection
          setCapturedFlash(true);
          setTimeout(() => setCapturedFlash(false), 400);

          const middle = plateMatch[1].toUpperCase();
          const serial = plateMatch[2];

          // Province matching logic
          let provinceKh = 'ភ្នំពេញ';
          let provinceEn = 'PHNOM PENH';

          if (rawText.includes('SIEM') || rawText.includes('REAP') || rawText.includes('សៀមរាប')) {
            provinceKh = 'សៀមរាប';
            provinceEn = 'SIEM REAP';
          } else if (rawText.includes('KANDAL') || rawText.includes('កណ្ដាល')) {
            provinceKh = 'កណ្ដាល';
            provinceEn = 'KANDAL';
          } else if (rawText.includes('BATTAMBANG') || rawText.includes('បាត់ដំបង')) {
            provinceKh = 'បាត់ដំបង';
            provinceEn = 'BATTAMBANG';
          }

          // Build precise requested JSON Payload
          const payloadData: KhmerPlateDataFormat = {
            license_plate: {
              province_kh: provinceKh,
              province_en: provinceEn.charAt(0) + provinceEn.slice(1).toLowerCase(),
              prefix_letters_kh: provinceKh,
              prefix_letters_en: provinceEn,
              number_middle: middle,
              serial_number: serial,
              full_plate_string: `${provinceKh} ${middle}-${serial}`,
            },
          };

          const newRecord: KhmerPlateDetection = {
            id: `ocr-${Date.now()}`,
            payload: payloadData,
            confidence: Number(result.data.confidence.toFixed(1)) || 95.0,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            capturedFrameUrl: frameUrl,
            rawOcrText: rawText.trim(),
          };

          setDetections((prev) => [newRecord, ...prev.slice(0, 14)]);
          setActiveDetection(newRecord);
          setScanCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error('OCR Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const filteredHistory = detections.filter((d) => {
    const p = d.payload.license_plate;
    return (
      p.full_plate_string.includes(searchTerm) ||
      p.number_middle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.serial_number.includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-indigo-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              ប្រព័ន្ធស្កែនផ្លាកលេខខ្មែរ (Auto Detection & Analysis)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Auto-captures video frame upon plate detection and parses structured JSON payload
          </p>
        </div>

        {/* Camera Control Actions */}
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
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAutoScanning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isAutoScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAutoScanning ? 'Pause Auto-Capture' : 'Resume Auto-Capture'}
          </button>

          <button
            onClick={() =>
              setSelectedFacingMode((prev) =>
                prev === 'environment' ? 'user' : 'environment'
              )
            }
            className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 text-xs"
            title="Switch Facing Lens"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Stream with Auto Capture Overlay */}
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

            {/* Flash visual indicator when a plate is captured */}
            {capturedFlash && (
              <div className="absolute inset-0 bg-white/40 z-30 transition-opacity duration-300 pointer-events-none" />
            )}

            {/* Error Overlay */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <AlertTriangle className="h-10 w-10 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-200">Camera Access Error</h3>
                <p className="text-xs text-slate-400 max-w-sm">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Live Indicator Overlays */}
            {isCameraActive && (
              <>
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-300 font-bold">AUTO SCAN ACTIVE</span>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-amber-400 ml-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing Frame...
                    </span>
                  )}
                </div>

                {/* Target Bounding Frame Box */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-80 h-44 border-2 border-dashed border-emerald-400/80 rounded-xl relative flex items-center justify-center bg-emerald-500/5 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
                    <span className="absolute -top-3 bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 text-[10px] font-mono rounded">
                      AUTO-CAPTURE ZONE
                    </span>
                    {isAutoScanning && (
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Manual Scan Action */}
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={captureAndAnalyzeFrame}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg border border-indigo-400/30 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-300" />
                    )}
                    <span>{isAnalyzing ? 'Analyzing...' : 'Manual Snapshot'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Total Plate Captures</span>
              <div className="text-xl font-bold text-white mt-1">{scanCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Analysis Engine</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">Live OCR</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400">Captured Status</span>
              <div className="text-xl font-bold text-indigo-400 mt-1">
                {activeDetection ? activeDetection.payload.license_plate.number_middle : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Analyzed Data View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          {activeDetection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  លទ្ធផលស្កែន (Captured Data)
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  {activeDetection.confidence}% Conf.
                </span>
              </div>

              {/* Snapshot Frame */}
              {activeDetection.capturedFrameUrl && (
                <div className="relative rounded-lg overflow-hidden border border-slate-800 h-28 bg-black">
                  <img
                    src={activeDetection.capturedFrameUrl}
                    alt="Captured Plate Frame"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-slate-300">
                    Snapshot Frame
                  </span>
                </div>
              )}

              {/* Cambodian Plate Card */}
              <div className="p-4 rounded-xl bg-slate-100 text-slate-900 border-4 border-slate-300 shadow-inner text-center space-y-1">
                <div className="text-sm font-extrabold text-blue-900 tracking-wide">
                  {activeDetection.payload.license_plate.province_kh}
                </div>
                <div className="text-3xl font-black font-mono tracking-widest text-slate-900">
                  {activeDetection.payload.license_plate.number_middle}-
                  {activeDetection.payload.license_plate.serial_number}
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-1 border-t border-slate-300">
                  {activeDetection.payload.license_plate.prefix_letters_en}
                </div>
              </div>

              {/* JSON Analysis Result */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" /> Parsed JSON:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeDetection.timestamp}
                  </span>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed shadow-inner max-h-48">
                  {JSON.stringify(activeDetection.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Camera className="h-10 w-10 opacity-40 animate-bounce" />
              <p className="text-xs">
                Camera is scanning... Bring plate into frame to capture and analyze data automatically.
              </p>
            </div>
          )}

          <div>
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

      {/* History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-200">
              ប្រវត្តិស្កែន (Captured Log History)
            </h3>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
              {filteredHistory.length} records
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Snapshot</th>
                <th className="px-4 py-3">Full Plate String</th>
                <th className="px-4 py-3">Middle</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.map((item) => {
                const plate = item.payload.license_plate;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setActiveDetection(item)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2">
                      {item.capturedFrameUrl ? (
                        <img
                          src={item.capturedFrameUrl}
                          alt="thumb"
                          className="w-12 h-8 object-cover rounded border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-8 bg-slate-800 rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-400 text-sm">
                      {plate.full_plate_string}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">
                      {plate.number_middle}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">
                      {plate.serial_number}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{plate.province_en}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      {item.confidence}%
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{item.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
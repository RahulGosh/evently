"use client"

import { useState, useRef, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, RefreshCw, ImageIcon, Key, Scan } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { getScannedTickets, scanTicket } from "@/lib/actions/ticket.action";
import { Html5Qrcode } from "html5-qrcode";
import { TicketScan } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import ScannedTicketsList, { ExtendedTicketScan } from "@/components/shared/employer/scannedTicketList";

type EmployerTicketScannerProps = {
  params: Promise<{ id: string }>;
};

const EmployerTicketScanner = ({ params }: EmployerTicketScannerProps) => {
  const { userId, isLoaded } = useAuth();
  const searchParams = useSearchParams()

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRetryRef = useRef<NodeJS.Timeout | null>(null);
  const [eventId, setEventId] = useState<string>("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [loading, setLoading] = useState(false);
  const limit = 3;
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    ticketId?: string;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{
    ticketId: string;
    timestamp: Date;
    success: boolean;
    message: string;
  }>>([]);
  const [scannedTickets, setScannedTickets] = useState<TicketScan[]>([]);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<string>("prompt");

  // Check camera permission status on mount
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Check if permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermissionStatus(result.state);
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setCameraPermissionStatus(result.state);
          });
        }
      } catch (error) {
        // Silent fail - we'll handle permissions when the camera is accessed
      }
    };
    
    checkCameraPermissions();
  }, []);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolved = await params;
        setEventId(resolved.id);
      } catch (error) {
        // Don't log this error to console
        setScanResult({
          success: false,
          message: "Error resolving event parameters"
        });
      }
    };
    
    resolveParams();
  }, [params]);

const validTickets = scannedTickets.filter((ticket) => ticket.isValid) as ExtendedTicketScan[];

  // Fetch scanned tickets when eventId changes
  useEffect(() => {
    if (!eventId) return;
    
    const fetchScannedTickets = async () => {
      setLoading(true);
      try {
        const { scannedTickets, totalPages } = await getScannedTickets(eventId, page, limit);
        setScannedTickets(scannedTickets);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Error loading scanned tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScannedTickets();
  }, [eventId, page]);

  // Extract ticket ID from barcode data
  const extractTicketId = (data: string) => {
    // Attempt to parse as JSON in case the QR code contains a JSON object
    try {
      const jsonData = JSON.parse(data);
      // Check if there's an id field in the JSON
      if (jsonData.id) return jsonData.id;
      if (jsonData.ticketId) return jsonData.ticketId;
      if (jsonData.orderId) return jsonData.orderId;
    } catch (e) {
      // Not JSON, continue with normal processing
    }
    
    // If data contains a URL, extract the last part as possible ticket ID
    if (data.includes('/') && !data.includes(' ')) {
      return data.split('/').pop() || data;
    }
    
    // Return the raw data as fallback
    return data;
  };

  // Process scan result with improved error handling
  const processScanResult = async (ticketId: string) => {
    setIsScanning(true);
    setScanResult(null);
  
    try {
      if (!userId) {
        setScanResult({
          success: false,
          message: "User not authenticated",
          ticketId,
        });
        setIsScanning(false);
        return;
      }
  
      // Use fetch to call the API route
      const response = await fetch("/api/scanTicket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          scannerId: userId,
          eventId,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setScanResult({
          success: true,
          message: "Ticket validated successfully!",
          ticketId,
        });
  
        const { scannedTickets, totalPages } = await getScannedTickets(eventId, page, limit);
        const validTickets = scannedTickets.filter((ticket) => ticket.isValid);
        setScannedTickets(scannedTickets);
        setTotalPages(totalPages);
      } else {
        setScanResult({
          success: false,
          message: data.message || "Error validating ticket",
          ticketId,
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: "Error processing scan",
        ticketId,
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  // Handle file upload for barcode scanning
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    scanImageFile(file);
  };

  // Enhanced camera access with persistent permissions
  const handleCameraCapture = async () => {
    try {
      setIsScanning(true);
      
      // Request camera with persistent permissions
      const constraints = { 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
      // Create a video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve);
        };
      });
  
      // Create an overlay container
      const videoContainer = document.createElement("div");
      videoContainer.style.position = "fixed";
      videoContainer.style.top = "0";
      videoContainer.style.left = "0";
      videoContainer.style.width = "100vw";
      videoContainer.style.height = "100vh";
      videoContainer.style.backgroundColor = "rgba(0,0,0,0.9)";
      videoContainer.style.zIndex = "9999";
      videoContainer.style.display = "flex";
      videoContainer.style.flexDirection = "column";
      videoContainer.style.justifyContent = "center";
      videoContainer.style.alignItems = "center";
      
      // Add a capture button
      const captureButton = document.createElement("button");
      captureButton.textContent = "Capture";
      captureButton.style.position = "absolute";
      captureButton.style.bottom = "50px";
      captureButton.style.padding = "12px 24px";
      captureButton.style.backgroundColor = "#4CAF50";
      captureButton.style.color = "white";
      captureButton.style.border = "none";
      captureButton.style.borderRadius = "4px";
      captureButton.style.fontSize = "16px";
      captureButton.style.cursor = "pointer";
      
      // Add a close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "✕";
      closeButton.style.position = "absolute";
      closeButton.style.top = "20px";
      closeButton.style.right = "20px";
      closeButton.style.backgroundColor = "rgba(0,0,0,0.5)";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "50%";
      closeButton.style.width = "40px";
      closeButton.style.height = "40px";
      closeButton.style.fontSize = "20px";
      closeButton.style.cursor = "pointer";
      closeButton.style.display = "flex";
      closeButton.style.justifyContent = "center";
      closeButton.style.alignItems = "center";
      
      // Create a viewfinder overlay
      const viewfinder = document.createElement("div");
      viewfinder.style.position = "absolute";
      viewfinder.style.border = "2px solid #4CAF50";
      viewfinder.style.width = "80%";
      viewfinder.style.maxWidth = "300px";
      viewfinder.style.height = "200px";
      viewfinder.style.boxShadow = "0 0 0 5000px rgba(0, 0, 0, 0.5)";
      viewfinder.style.borderRadius = "8px";
      
      // Add everything to the DOM
      videoContainer.appendChild(video);
      videoContainer.appendChild(viewfinder);
      videoContainer.appendChild(captureButton);
      videoContainer.appendChild(closeButton);
      document.body.appendChild(videoContainer);
      
      // Update permission status
      setCameraPermissionStatus("granted");
      
      // Save camera permission status to localStorage
      try {
        localStorage.setItem('cameraPermissionGranted', 'true');
      } catch (err) {
        // Silent fail if localStorage is not available
      }
  
      // Handle capture button click
      captureButton.addEventListener("click", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "captured-photo.png", { type: "image/png" });
            
            // Clean up the UI before scanning
            stream.getTracks().forEach((track) => track.stop());
            document.body.removeChild(videoContainer);
            
            // Process the image
            await scanImageFile(file);
          }
        }, "image/png");
      });
      
      // Handle close button click
      closeButton.addEventListener("click", () => {
        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(videoContainer);
        setIsScanning(false);
      });
      
    } catch (error) {
      // Handle permission denied
      setCameraPermissionStatus("denied");
      
      try {
        localStorage.removeItem('cameraPermissionGranted');
      } catch (err) {
        // Silent fail
      }
      
      setScanResult({
        success: false,
        message: "Camera access denied. Please check your browser settings and grant camera permissions."
      });
      setIsScanning(false);
    }
  };

  // Handle captured image
  const handleCapturedImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    scanImageFile(file);
  };

  // Scan image file with improved error handling
  const scanImageFile = (file: File) => {
    setIsScanning(true);
    
    try {
      // Create a temporary scanner if needed
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode("qr-scanner-container");
      }
      
      qrScannerRef.current.scanFile(file, true)
        .then((decodedText) => {
          const ticketId = extractTicketId(decodedText);
          if (ticketId) {
            processScanResult(ticketId);
          }
        })
        .catch(() => {
          // Don't log the error to console
          setScanResult({
            success: false,
            message: "Could not detect barcode in image. Please try another image or manual entry."
          });
          setIsScanning(false);
        });
    } catch (error) {
      // If any unexpected error occurs, handle it in UI
      setScanResult({
        success: false,
        message: "Error processing image. Please try again."
      });
      setIsScanning(false);
    }
  };

  // Manual ticket ID input
  const [manualTicketId, setManualTicketId] = useState("");
  
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketId.trim()) return;
    
    await processScanResult(manualTicketId.trim());
    setManualTicketId("");
  };

// Function to request and renew permissions
const requestCameraPermission = async () => {
  try {
    // Be explicit about what we're requesting - use environment camera when available
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    // Immediately release the camera
    stream.getTracks().forEach(track => track.stop());
    
    setCameraPermissionStatus("granted");
    
    try {
      localStorage.setItem('cameraPermissionGranted', 'true');
    } catch (err) {
      // Silent fail if localStorage is not available
    }
    
    // Show success message
    setScanResult({
      success: true,
      message: "Camera permission granted!"
    });
    
    return true;
  } catch (error) {
    // Check if this is a NotAllowedError (permission denied)
    const isDenied = (error as Error).name === "NotAllowedError";
    
    setCameraPermissionStatus("denied");
    
    // Show more helpful error message
    setScanResult({
      success: false,
      message: isDenied 
        ? "Camera permission denied. Please go to your browser settings to enable camera access."
        : "Could not access camera. Please try a different browser or device."
    });
    
    return false;
  }
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const handleAlternativeCameraCapture = () => {
  // For mobile browsers that support capture attribute
  if (captureInputRef.current) {
    captureInputRef.current.click();
  }
};

// Check for stored permission on component mount
useEffect(() => {
  const checkStoredPermission = async () => {
    try {
      const storedPermission = localStorage.getItem('cameraPermissionGranted');
      
      if (storedPermission === 'true') {
        // Verify that permission is still valid
        try {
          // Quick permission check - get and immediately release the camera
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          
          // Stop all tracks immediately
          stream.getTracks().forEach(track => track.stop());
          
          // Update permission state
          setCameraPermissionStatus("granted");
        } catch (error) {
          // Permission was revoked in browser settings
          localStorage.removeItem('cameraPermissionGranted');
          setCameraPermissionStatus("denied");
        }
      }
    } catch (error) {
      // Silent fail - localStorage might not be available
    }
  };
  
  checkStoredPermission();
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop().catch(() => {
          // Silently handle errors to prevent console logs
        });
      } catch {
        // Ignore cleanup errors
      }
    }
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    if (cameraRetryRef.current) {
      clearTimeout(cameraRetryRef.current);
    }
  };
}, []);

// Show loading state while Clerk is loading
if (!isLoaded) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading scanner...</p>
      </div>
    </div>
  );
}

// Show sign-in prompt if user is not authenticated
if (!userId) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md mx-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-6">
          Please sign in to access the ticket scanner.
        </p>
        <a
          href="/sign-in"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Sign In
        </a>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Event Ticket Scanner
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Scan and validate tickets for Event #{eventId}
          </p>
        </header>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Scanner Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Scanner Card Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Scan size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                  Ticket Scanner
                </h2>
                <span className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                  {cameraPermissionStatus === "granted" ? "Ready" : "Setup Required"}
                </span>
              </div>
            </div>

            {/* Camera Status Panel */}
            <div className={`p-4 border-b ${
              cameraPermissionStatus === "granted" 
                ? "bg-green-50 text-green-800" 
                : cameraPermissionStatus === "denied"
                ? "bg-red-50 text-red-800"
                : "bg-yellow-50 text-yellow-800"
            }`}>
              <div className="flex items-center gap-3">
                {cameraPermissionStatus === "granted" ? (
                  <CheckCircle size={20} className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                ) : cameraPermissionStatus === "denied" ? (
                  <AlertCircle size={20} className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <RefreshCw size={20} className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                )}
                <div>
                  <p className="text-sm sm:text-base font-medium">
                    {cameraPermissionStatus === "granted" 
                      ? "Camera Ready" 
                      : cameraPermissionStatus === "denied"
                      ? "Camera Blocked" 
                      : "Camera Access Needed"}
                  </p>
                  <p className="text-xs sm:text-sm">
                    {cameraPermissionStatus === "granted" 
                      ? "You can now scan tickets" 
                      : "Please allow camera access to scan tickets"}
                  </p>
                </div>
              </div>

              {cameraPermissionStatus !== "granted" && (
                <div className="mt-3">
                  <button
                    onClick={requestCameraPermission}
                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    <RefreshCw size={14} className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                    Grant Permission
                  </button>

                  {isMobileDevice() && cameraPermissionStatus === "denied" && (
                    <div className="mt-3 text-xs sm:text-sm bg-white/50 p-2 sm:p-3 rounded-lg">
                      <p className="font-medium mb-1">Mobile Camera Help:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open browser settings</li>
                        <li>Find site permissions</li>
                        <li>Allow camera access</li>
                        <li>Refresh this page</li>
                      </ol>
                      <button
                        onClick={handleAlternativeCameraCapture}
                        className="mt-2 inline-flex items-center px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs sm:text-sm"
                      >
                        Try Alternative Method
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scanner View */}
            <div className="p-4 sm:p-5">
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative border-2 border-dashed border-gray-300">
                <div 
                  id="qr-scanner-container" 
                  ref={scannerContainerRef} 
                  className="w-full h-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Scan size={36} className="text-gray-400 mb-2 w-8 h-8 sm:w-10 sm:h-10" />
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium">
                    Use camera or upload to scan tickets
                  </p>
                </div>
              </div>

              {/* Scanner Controls */}
              <div className="grid grid-cols-2 gap-3 mt-4 sm:mt-5">
                <button
                  onClick={handleCameraCapture}
                  disabled={isScanning || cameraPermissionStatus === "denied"}
                  className={`flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all text-xs sm:text-sm ${
                    isScanning || cameraPermissionStatus === "denied"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <ImageIcon size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Take Photo</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className={`flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all text-xs sm:text-sm ${
                    isScanning
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Upload size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Upload Image</span>
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="file"
                  ref={captureInputRef}
                  onChange={handleCapturedImage}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="p-4 sm:p-5 border-t">
              <h3 className="flex items-center gap-2 text-base sm:text-lg font-medium text-gray-700 mb-3">
                <Key size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
                Manual Entry
              </h3>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value)}
                  placeholder="Enter ticket ID..."
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!manualTicketId.trim() || isScanning}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                    !manualTicketId.trim() || isScanning
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Validate
                </button>
              </form>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={`p-4 border-t ${
                scanResult.success 
                  ? "bg-green-50 text-green-800" 
                  : "bg-red-50 text-red-800"
              }`}>
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle size={20} className="mt-0.5 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold">
                      {scanResult.success ? "Validation Successful" : "Validation Failed"}
                    </h3>
                    <p className="text-xs sm:text-sm">{scanResult.message}</p>
                    {scanResult.ticketId && (
                      <p className="text-xs sm:text-sm mt-1 opacity-80">
                        Ticket ID: <span className="font-mono">{scanResult.ticketId}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - History and Tickets */}
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Scans Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 sm:p-5 text-white">
                <h2 className="text-lg sm:text-xl font-semibold">Recent Scans</h2>
              </div>
              <div className="divide-y">
                {scanHistory.length > 0 ? (
                  scanHistory.map((scan, index) => (
                    <div key={index} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {scan.success ? (
                          <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <p className="text-sm sm:text-base font-medium text-gray-800">{scan.ticketId}</p>
                            <span className="text-[10px] xs:text-xs text-gray-500">
                              {scan.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">{scan.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 sm:p-6 text-center text-gray-500">
                    <p className="text-sm sm:text-base">No scans recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Valid Tickets Card */}
            {validTickets.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-5 text-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-semibold">Valid Tickets</h2>
                    <span className="text-xs sm:text-sm bg-white/20 px-2 sm:px-3 py-1 rounded-full">
                      {validTickets.length} verified
                    </span>
                  </div>
                </div>
                <ScannedTicketsList
                  scannedTickets={validTickets}
                  h2ScannedText="Valid Tickets"
                  length={validTickets.length}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 sm:p-5 text-white">
                  <h2 className="text-lg sm:text-xl font-semibold">Valid Tickets</h2>
                </div>
                <div className="p-4 sm:p-6 text-center text-gray-500">
                  <p className="text-sm sm:text-base">No valid tickets found yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
);
};

export default EmployerTicketScanner;
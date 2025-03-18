"use client"

import { useState, useRef, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, RefreshCw, ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { getScannedTickets, scanTicket } from "@/lib/actions/ticket.action";
import { Html5Qrcode } from "html5-qrcode";
import ScannedTicketsList from "@/components/shared/scannedTicketList";
import { TicketScan } from "@prisma/client";
import { useSearchParams } from "next/navigation";

type EmployerTicketScannerProps = {
  params: Promise<{ id: string }>;
};

const EmployerTicketScanner = ({ params }: EmployerTicketScannerProps) => {
  const { data: session } = useSession();
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

  const validTickets = scannedTickets.filter((ticket) => ticket.isValid);


  // Fetch scanned tickets when eventId changes
  useEffect(() => {
    if (!eventId) return;
    
    const fetchScannedTickets = async () => {
      setLoading(true);
      try {
        const { scannedTickets, totalPages } = await getScannedTickets(eventId, page, limit);
        const validTickets = scannedTickets.filter((ticket) => ticket.isValid);
        setScannedTickets(scannedTickets);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Error loading scanned tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScannedTickets();
  }, [eventId]);

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
      if (!session?.user.id) {
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
          scannerId: session.user.id,
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

return (
  <div className="container mx-auto p-4 max-w-3xl">
    <h1 className="text-2xl font-bold mb-6">Ticket Scanner - Event #{eventId}</h1>
    
    {/* Camera permission status indicator */}
    <div className={`mb-4 p-3 rounded-lg ${
  cameraPermissionStatus === "granted" 
    ? "bg-green-100 text-green-800" 
    : cameraPermissionStatus === "denied"
    ? "bg-red-100 text-red-800"
    : "bg-yellow-100 text-yellow-800"
}`}>
  <div className="flex items-center gap-2">
    {cameraPermissionStatus === "granted" ? (
      <CheckCircle size={18} />
    ) : cameraPermissionStatus === "denied" ? (
      <AlertCircle size={18} />
    ) : (
      <RefreshCw size={18} />
    )}
    <span>
      Camera permission: {cameraPermissionStatus === "granted" 
        ? "Granted" 
        : cameraPermissionStatus === "denied"
        ? "Denied" 
        : "Not requested"}
    </span>
  </div>
  
  {cameraPermissionStatus !== "granted" && (
    <>
      <button
        onClick={requestCameraPermission}
        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Grant camera permission
      </button>
      
      {isMobileDevice() && cameraPermissionStatus === "denied" && (
        <div className="mt-2 text-sm">
          <p>If you're having trouble with camera permissions:</p>
          <ol className="list-decimal pl-5 mt-1">
            <li>Go to your browser settings</li>
            <li>Find site settings or permissions</li>
            <li>Look for camera permissions</li>
            <li>Find this website and allow camera access</li>
            <li>Refresh this page</li>
          </ol>
          <button
            onClick={handleAlternativeCameraCapture}
            className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Try Alternative Camera Method
          </button>
        </div>
      )}
    </>
  )}
</div>
    
    {/* Camera View */}
    <div className="mb-8 bg-gray-100 rounded-lg overflow-hidden">
      <div className="relative aspect-video bg-black">
        <div 
          id="qr-scanner-container" 
          ref={scannerContainerRef} 
          className="w-full h-full" 
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">Use Take Photo or Upload Barcode to scan tickets</p>
        </div>
      </div>
      
      {/* Camera Controls */}
      <div className="p-4 flex justify-center items-center gap-4">
        <button
          onClick={handleCameraCapture}
          className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isScanning || cameraPermissionStatus === "denied"}
        >
          <ImageIcon size={18} />
          Take Photo
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          disabled={isScanning}
        >
          <Upload size={18} />
          Upload Barcode
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
    
    {/* Manual Ticket Entry */}
    <div className="mb-8 bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-3">Manual Ticket Entry</h2>
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manualTicketId}
          onChange={(e) => setManualTicketId(e.target.value)}
          placeholder="Enter ticket ID..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!manualTicketId.trim() || isScanning}
        >
          Validate
        </button>
      </form>
    </div>
    
    {/* Scan Result */}
    {scanResult && (
      <div className={`mb-8 p-4 rounded-lg ${
        scanResult.success ? "bg-green-100" : "bg-red-100"
      }`}>
        <div className="flex items-start gap-3">
          {scanResult.success ? (
            <CheckCircle className="text-green-600" />
          ) : (
            <AlertCircle className="text-red-600" />
          )}
          <div>
            <h3 className="font-semibold">
              {scanResult.success ? "Success" : "Error"}
            </h3>
            <p>{scanResult.message}</p>
            {scanResult.ticketId && (
              <p className="text-sm text-gray-600 mt-1">
                Ticket ID: {scanResult.ticketId}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
    
    {/* Recent Scans */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold">Recent Scans</h2>
      </div>
      <div className="divide-y">
        {scanHistory.length > 0 ? (
          scanHistory.map((scan, index) => (
            <div key={index} className="p-4 flex items-start gap-3">
              {scan.success ? (
                <CheckCircle className="text-green-600 mt-1" size={18} />
              ) : (
                <AlertCircle className="text-red-600 mt-1" size={18} />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{scan.ticketId}</p>
                  <span className="text-xs text-gray-500">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{scan.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No scans yet</div>
        )}
      </div>
    </div>

    {/* Scanned Tickets List */}
    {/* {scannedTickets.length > 0 && (
      <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold">
            Total Scanned Tickets ({scannedTickets.length}) - Valid Tickets (
            {scannedTickets.filter((ticket) => ticket.isValid).length})
          </h2>
        </div>
        <ScannedTicketsList
            scannedTickets={scannedTickets}
            h2ScannedText="Total Tickets Scanned"
          length={scannedTickets.length}
          page={page}
            totalPages={totalPages}
            onPageChange={setPage}
        />
      </div>
    )} */}

{/* {scannedTickets.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              Total Scanned Tickets ({scannedTickets.length}) - Valid Tickets ({validTickets.length})
            </h2>
          </div>
          <ScannedTicketsList
            scannedTickets={scannedTickets}
            h2ScannedText="Total Tickets Scanned"
            length={scannedTickets.length}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )} */}

      {/* ✅ Show only valid tickets */}
      {validTickets.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              Valid Scanned Tickets ({validTickets.length})
            </h2>
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
        // ✅ Handle empty valid tickets separately
        <div className="mt-8 text-center text-gray-500">
          <p>No valid tickets found</p>
        </div>
      )}
  </div>
);
};

export default EmployerTicketScanner;
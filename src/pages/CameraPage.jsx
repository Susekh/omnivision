import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../public/assets/css/CameraPage.css";
import api from "../api";
import ExifReader from "exifreader";

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null); // Track active stream for better cleanup

  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationError, setLocationError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [cameraType, setCameraType] = useState("environment");
  const [imageId, setImageId] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);

  const navigate = useNavigate();

  // Cleanup camera stream helper
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Get available camera devices
  useEffect(() => {
    const getCameraDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };

    getCameraDevices();
  }, []);

  // Start camera with optimized mobile-first constraints
  useEffect(() => {
    const startCamera = async () => {
      setIsCameraLoading(true);
      stopCameraStream();

      try {
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        let videoConstraints = {};

        // Smart device selection
        if (devices.length > 0) {
          const targetCamera =
            cameraType === "environment"
              ? devices.find(
                  (d) =>
                    d.label.toLowerCase().includes("back") ||
                    d.label.toLowerCase().includes("rear") ||
                    d.label.toLowerCase().includes("environment"),
                ) || devices[devices.length > 1 ? 1 : 0]
              : devices.find(
                  (d) =>
                    d.label.toLowerCase().includes("front") ||
                    d.label.toLowerCase().includes("user"),
                ) || devices[0];

          videoConstraints = { deviceId: { exact: targetCamera.deviceId } };
        } else {
          videoConstraints = {
            facingMode: { ideal: isMobile ? cameraType : "user" },
          };
        }

        // Responsive resolution for better mobile performance
        const width =
          window.innerWidth < 600 ? 640 : window.innerWidth < 1024 ? 960 : 1280;
        const height = Math.round((width * 9) / 16);

        const constraints = {
          video: {
            ...videoConstraints,
            width: { ideal: width, min: 320 },
            height: { ideal: height, min: 240 },
          },
        };

        console.log(
          "🎥 Requesting camera access with constraints:",
          constraints,
        );

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;

          // Handle metadata loaded
          videoRef.current.onloadedmetadata = () => {
            console.log(
              "📐 Video metadata loaded. Dimensions:",
              videoRef.current.videoWidth,
              "x",
              videoRef.current.videoHeight,
            );
            videoRef.current
              .play()
              .catch((err) => console.error("Error playing video:", err));
          };

          // Update loading state when playing
          videoRef.current.onplaying = () => {
            console.log("▶️ Video is now playing");
            setIsCameraLoading(false);
          };

          // Initial play attempt
          await videoRef.current.play().catch((err) => {
            console.error("Initial play failed:", err);
            setTimeout(() => videoRef.current?.play(), 100);
          });

          console.log(
            "✅ Camera access granted. Stream active:",
            stream.active,
          );
          console.log("🎬 Video tracks:", stream.getVideoTracks().length);
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setIsCameraLoading(false);
        setCameraError(
          `Unable to access camera: ${error.message}. Please grant camera permissions.`,
        );
      }
    };

    const timer = setTimeout(startCamera, 100);
    return () => {
      clearTimeout(timer);
      stopCameraStream();
    };
  }, [cameraType, devices, stopCameraStream]);

  // Extract EXIF metadata (optimized)
  const extractExifMetadata = useCallback(async (base64String) => {
    try {
      const binaryStr = atob(base64String);
      const uint8Array = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        uint8Array[i] = binaryStr.charCodeAt(i);
      }

      const tags = await ExifReader.load(uint8Array.buffer);
      console.log("📝 EXIF Data:", tags);
    } catch (error) {
      console.error("Error extracting EXIF:", error);
    }
  }, []);

  // Send image to server with better error handling
  const sendImageToServer = useCallback(
    async (base64String, latitude, longitude) => {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.error("❌ Invalid location data");
        alert("Failed to get valid location. Please enable GPS and try again.");
        return;
      }

      try {
        if (!base64String) {
          throw new Error("Invalid image: base64String is null or undefined.");
        }
        const timestamp = new Date().toISOString();
        const payload = {
          userId: "12345",
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
          timestamp,
          base64String,
        };

        console.log("📤 Sending data to server:", {
          location: { type: "Point", coordinates: [lng, lat] },
          timestamp,
          base64StringLength: base64String.length,
        });

        const response = await api.post("user/upload-image", payload, {
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 200) {
          console.log("✅ Image uploaded successfully!");
          setImageId(response.data.imageId);
        } else {
          console.error("❌ Upload failed");
          alert("Failed to upload image. Please try again.");
        }
      } catch (error) {
        console.error("❌ Upload error:", error.message);
        alert("Upload failed. Please check your connection.");
      }
    },
    [],
  );

  // Get user location with mobile-optimized settings
  const getLocation = useCallback(
    (imageBase64) => {
      if (!imageBase64 || !("geolocation" in navigator)) {
        setLocationError("Geolocation not available on this device.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude);
          const longitude = Number(position.coords.longitude);

          console.log("✅ Location acquired:", {
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          });

          if (isNaN(latitude) || isNaN(longitude)) {
            setLocationError("Invalid GPS coordinates received.");
            return;
          }

          setLocation({ latitude, longitude });
          setLocationError(null);
          sendImageToServer(imageBase64, latitude, longitude);
          // Hide processing loader
          setIsProcessing(false);

          // Show thank you message after upload
          setTimeout(() => {
            setShowThankYou(true);

            // Play audio with slight delay for better UX
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current
                  .play()
                  .catch((err) => console.error("Audio playback failed:", err));
              }
            }, 200);
          }, 1000);
        },
        (error) => {
          console.error("📍 Location error:", error);

          let message = "Location access is required to proceed.";
          if (error.code === error.PERMISSION_DENIED) {
            message = "Please allow location access to continue.";
          } else if (error.code === error.TIMEOUT) {
            message = "Location request timed out. Try again outdoors.";
          }

          setLocationError(message);
          setIsProcessing(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    },
    [sendImageToServer],
  );

  // Capture image from video feed
  const captureImage = useCallback(() => {
    // Show processing loader
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      console.error("Canvas or video not available");
      return;
    }

    // Play shutter sound
    const shutterSound = new Audio(
      "/images/camera-shutter-and-flash-combined-6827.mp3",
    );
    shutterSound.play().catch((err) => console.error("Audio failed:", err));

    // Capture image to canvas
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");
    const base64String = imageData.split(",")[1];

    console.log("📸 Image captured!");
    console.log(
      "🖼️ Captured image base64 (first 100 chars):",
      base64String.substring(0, 100) + "...",
    );
    console.log("📏 Image size (base64 length):", base64String.length);

    setCapturedImage(base64String);
    extractExifMetadata(base64String);
    getLocation(base64String);
  }, [extractExifMetadata, getLocation]);

  // Navigate to home and cleanup
  const handleHomeClick = useCallback(() => {
    stopCameraStream();
    navigate("/home", { replace: true });
  }, [navigate, stopCameraStream]);

  // Handle audio end - navigate to home
  const handleAudioEnd = useCallback(() => {
    setShowThankYou(false);
    stopCameraStream();
    navigate("/home", { replace: true });
  }, [navigate, stopCameraStream]);

  return (
    <section className="main camera-page">
      <div className="camera-space">
        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-feed"
        />

        {/* Loading Indicator */}
        {isCameraLoading && !cameraError && (
          <div className="camera-loading">
            <div className="loading-spinner" />
            <p>Loading camera...</p>
          </div>
        )}

        {/* Home Button */}
        <button
          onClick={handleHomeClick}
          className="home-button"
          title="Go to Home"
          aria-label="Go to Home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Capture Button */}
        <button
          onClick={captureImage}
          className="capture-button"
          aria-label="Capture Photo"
        />

        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Thank You Popup */}
        {showThankYou && (
          <div className="popup">
            <div className="popup-content">
              <div className="popup-icon">✓</div>
              <h2>Thank You for Reporting!</h2>
              <p>Your contribution helps make a better and safer society.</p>
              <audio ref={audioRef} preload="auto" onEnded={handleAudioEnd}>
                <source src="/images/thanksaudio.mp3" type="audio/mpeg" />
              </audio>
            </div>
          </div>
        )}

        {/* Processing Loader */}
        {isProcessing && (
          <div className="popup">
            <div className="popup-content">
              <div className="loading-spinner" />
              <p>Processing...</p>
            </div>
          </div>
        )}

        {/* Location Display */}
        {location.latitude && location.longitude && (
          <div className="location-display">
            <div className="location-icon">📍</div>
            <div className="location-info">
              <span className="location-label">Location:</span>
              <span className="location-coords">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {cameraError && <p className="error-message">{cameraError}</p>}
        {locationError && <p className="error-message">{locationError}</p>}
      </div>
    </section>
  );
};

export default CameraPage;

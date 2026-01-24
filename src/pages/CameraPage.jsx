import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../public/assets/css/CameraPage.css"; // Ensure you have a CSS file for styling
import api from "../api";
import ExifReader from "exifreader";


const CameraPage = () => {
 
  const videoRef = useRef(null); // Reference for the video element
  const canvasRef = useRef(null); // Reference for the canvas element
  const [capturedImage, setCapturedImage] = useState(null); // State to store the captured image
  const [location, setLocation] = useState({ latitude: null, longitude: null }); // State to store user's location
  const [locationError, setLocationError] = useState(null); // State to store location errors
  const [cameraError, setCameraError] = useState(null); // State to store camera errors
  const [devices, setDevices] = useState([]); // State to store available camera devices
  const [cameraType, setCameraType] = useState("environment");
  const [imageId, setImageId] = useState(null); //store uplaoded imageid
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const audioRef = useRef(null); // Reference for audio element

  const [exifData, setExifData] = useState(null);
  const [isCameraLoading, setIsCameraLoading] = useState(true);

  // Get available camera devices
  useEffect(() => {
    const getCameraDevices = async () => {
      try {
        // First request permission to access devices
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);
        console.log("Available cameras:", videoDevices);
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };

    getCameraDevices();
  }, []);

  // Start the camera based on the selected camera type
  useEffect(() => {
    const startCamera = async () => {
      setIsCameraLoading(true);
      try {
        // Stop any existing stream first
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

        // Simple constraints that work on all devices
        let videoConstraints = {};
        
        // Try to use deviceId if devices are available and we have a preference
        if (devices.length > 0) {
          if (cameraType === "environment") {
            // Try to find rear/back camera
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            if (backCamera) {
              videoConstraints = { deviceId: { exact: backCamera.deviceId } };
            } else if (devices.length > 1) {
              videoConstraints = { deviceId: { exact: devices[1].deviceId } };
            } else {
              videoConstraints = { facingMode: { ideal: "environment" } };
            }
          } else {
            // Use front camera or first available
            const frontCamera = devices.find(device => 
              device.label.toLowerCase().includes('front') || 
              device.label.toLowerCase().includes('user')
            );
            if (frontCamera) {
              videoConstraints = { deviceId: { exact: frontCamera.deviceId } };
            } else {
              videoConstraints = { deviceId: { exact: devices[0].deviceId } };
            }
          }
        } else {
          // Fallback: use facingMode (works on mobile, may not work on desktop)
          videoConstraints = { 
            facingMode: { ideal: isMobile ? "environment" : "user" }
          };
        }

        // Add width and height constraints
        const width =
          window.innerWidth < 600
            ? 640       // Mobile
            : window.innerWidth < 1024
            ? 960       // Tablet
            : 1280;     // Desktop

        const height = Math.round((width * 9) / 16);

        const constraints = {
          video: {
            ...videoConstraints,
            width: { ideal: width, min: 320 },
            height: { ideal: height, min: 240 },
          },
        };

        console.log("Requesting camera access with constraints:", constraints);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          
          // Force play the video
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Video is playing");
              })
              .catch(err => {
                console.error("Error playing video:", err);
                // Try again after a short delay
                setTimeout(() => {
                  videoRef.current?.play().catch(e => console.error("Retry play failed:", e));
                }, 100);
              });
          }
          
          // Also handle when metadata is loaded
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded. Dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
            videoRef.current.play().catch(err => {
              console.error("Error playing video after metadata:", err);
            });
          };
          
          console.log("Camera access granted. Stream active:", stream.active);
          console.log("Video tracks:", stream.getVideoTracks().length);
          
          // Set loading to false once video starts playing
          videoRef.current.onplaying = () => {
            console.log("Video is now playing");
            setIsCameraLoading(false);
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setIsCameraLoading(false);
        setCameraError(
          `Unable to access the camera: ${error.message}. Please ensure permissions are granted.`
        );
      }
    };

    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      startCamera();
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraType, devices]);


  // Function to capture the image from the camera
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      console.error("Error: Canvas or video reference not available.");
      return;
    }

    const shutterSound = new Audio("/images/camera-shutter-and-flash-combined-6827.mp3"); // Ensure the path is correct
    shutterSound
      .play()
      .catch((err) => console.error("Audio playback failed:", err));

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");
    // console.log("Captured imageData:", imageData);

    const base64String = imageData.split(",")[1];

    console.log("Captured image:", base64String);
    
    extractExifMetadata(base64String);


    // Extract EXIF data
    // const imageexif = new Image();
    // imageexif.onload = () => {
    //   EXIF.getData(imageexif, function () {
    //     const allExifData = EXIF.getAllTags(this);
    //     console.log("EXIF data:", allExifData);
    //     setExifData(allExifData);
    //   });
    // };
    // imageexif.src = imageData;

    // Create a link element to download the image
    // const link = document.createElement("a");
    // link.href = imageData;
    // link.download = "captured-image.jpg";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    setCapturedImage(base64String);
    setShowPopup(true);

    // Wait for initial popup, then show thank you and play audio
    const popupTimeout = setTimeout(() => {
      setShowPopup(false);
      setShowThankYou(true);
    }, 1000);

    // Wait a bit longer before trying to play audio to ensure DOM is updated
    const audioTimeout = setTimeout(() => {
      if (audioRef.current) {
        try {
          // Reset audio to beginning
          audioRef.current.currentTime = 0;
          audioRef.current.load(); // Reload the audio source
          
          // Create a promise for audio playback
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log("✅ Audio playing successfully");
            }).catch(err => {
              console.error("❌ Audio playback failed:", err);
              // If audio fails, navigate after 3 seconds anyway
              setTimeout(() => {
                setShowThankYou(false);
                if (videoRef.current && videoRef.current.srcObject) {
                  const tracks = videoRef.current.srcObject.getTracks();
                  tracks.forEach(track => track.stop());
                }
                navigate("/home", { replace: true });
              }, 500);
            });
          }
        } catch (err) {
          console.error("❌ Error playing audio:", err);
        }
      }
    }, 3200); // Slightly delayed to ensure popup state is updated
  };

  // navigate("/");

  // Memoize the getLocation function with useCallback
  const getLocation = useCallback(() => {
    if (!capturedImage) {
      console.error("Error: No image captured before sending to server.");
      setLocationError("Please capture an image before sending.");
      return;
    }

    if (navigator.geolocation) {
      console.log("Requesting location access...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location access granted.");
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          console.log(
            "Location:",
            position.coords.latitude,
            position.coords.longitude
          );

          setLocationError(null);

          // Now send the image and location data
          sendImageToServer(
            capturedImage,
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          window.alert(error);
          setLocationError("Please enable location services to proceed.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, [capturedImage]);

  // Run getLocation() only when capturedImage is set
  useEffect(() => {
    if (capturedImage) {
      console.log("Image successfully captured. Now requesting location...");
      getLocation();
    }
  }, [capturedImage, getLocation]);

  // const sendImageToServer = async (base64String, latitude, longitude) => {
  //   const userId = "12345";
  //   const timestamp = new Date().toISOString();

  //   try {
  //     if (!base64String) {
  //       throw new Error("Invalid image: imageUrl is null or undefined.");
  //     }

  //     // Prepare JSON payload
  //     const payload = {
  //       userId,
  //       location: {
  //         type: "Point",
  //         coordinates: [longitude, latitude], // Ensure correct order
  //       },
  //       timestamp,
  //       base64String, // Send Base64 directly
  //     };

  //     // Send data to backend
  //     const response = await api.post("user/upload-image", payload, {
  //       headers: { "Content-Type": "application/json" },
  //     });

  //     if (response.status === 200) {
  //       console.log("✅ Image and location data uploaded successfully!");
  //       setImageId(response.data.imageId);
  //     } else {
  //       alert("❌ Failed to upload image and location data.");

  //       console.error("❌ Failed to upload image and location data.");
  //     }
  //   } catch (error) {
  //     // alert(error)
  //     console.error("❌ Error uploading image:", error.message);
  //   }
  // };
  const sendImageToServer = async (base64String, latitude, longitude) => {
    latitude = parseFloat(latitude);
  longitude = parseFloat(longitude);

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    console.error("❌ Invalid location data. Latitude or Longitude is NaN.");
    alert("Failed to get valid location. Please enable GPS and try again.");
    return;
  }
  
    const userId = '12345';
    const timestamp = new Date().toISOString();
  
    try {
      if (!base64String) {
        throw new Error("Invalid image: base64String is null or undefined.");
      }
  
      // Prepare JSON payload
      const payload = {


        userId,
         location : {
          type: "Point",
          coordinates: [
          longitude, latitude ] },
        timestamp,
        base64String, // Send Base64 directly
      };
  
      console.log("📤 Sending data to server:", payload);
  
      // Send data to backend
      console.log(window.location.origin , "api");
      const response = await api.post("user/upload-image", payload, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.status === 200) {
        console.log("✅ Image and location data uploaded successfully!");
        setImageId(response.data.imageId);
      } else {
        alert("❌ Failed to upload image and location data.");
        console.error("❌ Failed to upload image and location data.");
      }
    } catch (error) {
      console.error("❌ Error uploading image:", error.message);
    }
  };
  



  const extractExifMetadata = async (base64String) => {
    try {
        // Convert Base64 string to a binary format
        const binaryStr = atob(base64String);
        const len = binaryStr.length;
        const uint8Array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            uint8Array[i] = binaryStr.charCodeAt(i);
        }

        // Use ExifReader to load metadata
        const tags = await ExifReader.load(uint8Array.buffer);

        console.log("📝 Parsed EXIF Data:", tags);
        setExifData({
            latitude: tags.GPSLatitude?.description || "Not available",
            longitude: tags.GPSLongitude?.description || "Not available",
            timestamp: tags.DateTimeOriginal?.description || "Not available",
            cameraModel: tags.Model?.description || "Not available",
            make: tags.Make?.description || "Not available",
        });
    } catch (error) {
        console.error("[extractExifMetadata] Error extracting EXIF data:", error);
    }
};



  // const sendImageToServer = async (imageUrl, latitude, longitude) => {
  //   const userId = "12345";
  //   const timestamp = new Date().toISOString();

  //   try {
  //       if (!imageUrl) {
  //           throw new Error("Invalid image: imageUrl is null or undefined.");
  //       }

  //       // Prepare JSON payload
  //       const payload = {
  //           userId,
  //           latitude,
  //           longitude,
  //           timestamp,
  //           base64String: imageUrl, // Ensure it's a valid Base64 string
  //       };

  //       // Send data to backend
  //       const response = await api.post("/user/upload-image", payload, {
  //           headers: { "Content-Type": "application/json" },
  //       });

  //       if (response.status >= 200 && response.status < 300) {
  //           console.log("✅ Image and location data uploaded successfully!");
  //           if (typeof setImageId === "function") {
  //               setImageId(response.data.imageId); // Ensure setImageId is defined
  //           }
  //       } else {
  //           alert("❌ Failed to upload image and location data.");
  //           console.error("❌ Failed to upload image and location data:", response);
  //       }
  //   } catch (error) {
  //       alert(`❌ Error: ${error.message}`);
  //       console.error("❌ Error uploading image:", error?.response?.data || error.message);
  //   }
  // };

  const toggleCamera = () => {
    setCameraType((prevType) => (prevType === "user" ? "environment" : "user"));
  };

  const handleHomeClick = () => {
    // Stop any active camera streams
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    // Navigate to home and stay there
    navigate("/home", { replace: true });
  };

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
        ></video>
        
        {/* Loading indicator */}
        {isCameraLoading && !cameraError && (
          <div className="camera-loading">
            <div className="loading-spinner"></div>
            <p>Loading camera...</p>
          </div>
        )}

        {/* Home Button - Left side of capture button */}
        <button onClick={handleHomeClick} className="home-button" title="Go to Home">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>

        {/* Camera Shutter Button - Overlaid on video feed */}
        <button onClick={captureImage} className="capture-button"></button>

        {/* Hidden Canvas for Capturing Image */}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        {/* Image Upload Status - Hidden visually but kept for functionality */}
        {imageId && <p style={{ display: 'none' }}>✅ Image Uploaded Successfully! Image ID: {imageId}</p>}

        {/* Display Captured Image - Only show if needed */}
        {capturedImage && false && (
          <div className="captured-image">
            <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured" />
            <a
              href={`data:image/jpeg;base64,${capturedImage}`}
              download="captured-image.jpg"
              className="download-button"
            >
              Download Image
            </a>
          </div>
        )}

        {/* Thank You Message with Audio */}
        {showThankYou && (
          <div className="popup">
            <div className="popup-content">
              <div className="popup-icon">✓</div>
              <h2>Thank You for Reporting!</h2>
              <p>Your contribution helps make a better and safer society.</p>
              {/* Hidden audio element - plays automatically */}
              <audio 
                ref={audioRef}
                preload="auto"
                onEnded={() => {
                  // When audio ends, navigate to home
                  setShowThankYou(false);
                  if (videoRef.current && videoRef.current.srcObject) {
                    const tracks = videoRef.current.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                  }
                  navigate("/home", { replace: true });
                }}
              >
                <source src="/images/thanksaudio.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {/* Display User Location */}
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
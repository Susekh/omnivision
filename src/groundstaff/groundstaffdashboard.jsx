import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../public/assets/css/groundstaffDashboard.css";

const GroundStaffDashboard = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [groundStaffName, setGroundStaffName] = useState("");

  useEffect(() => {
    // Check if groundstaff is authenticated
    const token = localStorage.getItem("token");
    const storedAgencyId = localStorage.getItem("agencyId");
    const storedGroundStaffName = localStorage.getItem("groundStaffName");

    if (!token || !storedAgencyId) {
      navigate("/groundstafflogin");
      return;
    }

    setGroundStaffName(storedGroundStaffName || "Ground Staff");

    // Fetch tasks for the agency
    fetchTasks();
  }, [agencyId, navigate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");
      const storedAgencyId = localStorage.getItem("agencyId");

      const response = await api.get(
        `backend/groundstaff/tasks/${storedAgencyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setTasks(response.data.data || []);
        if (response.data.data && response.data.data.length > 0) {
          setSuccessMessage(
            `Found ${response.data.data.length} assigned task(s)`,
          );
        } else {
          setErrorMessage("No tasks assigned yet.");
        }
      }
    } catch (error) {
      console.error("[fetchTasks] Error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch tasks. Please try again.",
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("groundStaffId");
    localStorage.removeItem("groundStaffName");
    localStorage.removeItem("agencyId");
    localStorage.removeItem("mobileNumber");
    localStorage.removeItem("groundstaffLoginAttempts");
    localStorage.removeItem("groundstaffLoginBlockedUntil");

    setSuccessMessage("Logged out successfully!");
    setTimeout(() => {
      navigate("/groundstafflogin");
    }, 1000);
  };

  const handleTaskClick = (task) => {
    // Store task details for viewing
    localStorage.setItem("selectedTask", JSON.stringify(task));
    navigate(`/task-details/${task._id}`);
  };

  return (
    <section
      className="groundstaff-dashboard"
      style={{
        backgroundColor: "#b3d9ff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1
            style={{
              color: "#000",
              fontFamily: "'Poppins Bold', sans-serif",
              fontWeight: 700,
              fontSize: "28px",
              margin: 0,
            }}
          >
            Welcome, {groundStaffName}
          </h1>
          <p
            style={{
              color: "#666",
              margin: "5px 0 0 0",
              fontSize: "14px",
            }}
          >
            Agency ID: {localStorage.getItem("agencyId")}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          Logout
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div
          className="alert alert-danger"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div
          className="alert alert-success"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          {successMessage}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ color: "#666", fontSize: "16px" }}>
            Loading assigned tasks...
          </p>
        </div>
      ) : tasks && tasks.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              window.innerWidth > 1200
                ? "repeat(2, 1fr)"
                : window.innerWidth > 768
                  ? "repeat(1, 1fr)"
                  : "repeat(1, 1fr)",
            gap: "20px",
          }}
        >
          {tasks.map((task, index) => (
            <div
              key={task._id || index}
              onClick={() => handleTaskClick(task)}
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid #e0e0e0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Task Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      color: "#000",
                      fontSize: "18px",
                      fontWeight: "600",
                      margin: "0 0 5px 0",
                    }}
                  >
                    {task.event_id || `Task #${index + 1}`}
                  </h3>
                  <p
                    style={{
                      color: "#0066cc",
                      fontSize: "12px",
                      margin: 0,
                    }}
                  >
                    {task.incident_type || "Incident"}
                  </p>
                </div>
                <span
                  style={{
                    backgroundColor:
                      task.status === "Assigned"
                        ? "#ffc107"
                        : task.status === "In Progress"
                          ? "#17a2b8"
                          : task.status === "Completed"
                            ? "#28a745"
                            : "#6c757d",
                    color: "#fff",
                    padding: "5px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {task.status || "Assigned"}
                </span>
              </div>

              {/* Task Details */}
              <div style={{ marginBottom: "12px" }}>
                {task.description && (
                  <p
                    style={{
                      color: "#333",
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                    }}
                  >
                    <strong>Description:</strong> {task.description}
                  </p>
                )}

                {task.location && (
                  <p
                    style={{
                      color: "#333",
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                    }}
                  >
                    <strong>Location:</strong> {task.location}
                  </p>
                )}

                {task.timestamp && (
                  <p
                    style={{
                      color: "#333",
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                    }}
                  >
                    <strong>Time:</strong>{" "}
                    {new Date(task.timestamp).toLocaleString()}
                  </p>
                )}

                {task.ground_staff && (
                  <p
                    style={{
                      color: "#333",
                      fontSize: "14px",
                      margin: "0 0 8px 0",
                    }}
                  >
                    <strong>Assigned To:</strong> {task.ground_staff}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  width: "100%",
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "40px 20px",
            borderRadius: "8px",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{
              color: "#666",
              fontSize: "16px",
              margin: 0,
            }}
          >
            No tasks assigned at the moment. Check back later!
          </p>
        </div>
      )}

      {/* Refresh Button */}
      <div
        style={{
          marginTop: "30px",
          textAlign: "center",
        }}
      >
        <button
          onClick={fetchTasks}
          disabled={loading}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "12px 30px",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "14px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Refreshing..." : "Refresh Tasks"}
        </button>
      </div>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#fff",
          color: "#333",
          textAlign: "center",
          padding: "20px",
          marginTop: "auto",
          marginTop: "30px",
          borderRadius: "8px",
          fontSize: "12px",
        }}
      >
        <p style={{ margin: 0 }}>
          © 2026 OmniVision. All rights reserved by Neuradyne.
        </p>
      </footer>
    </section>
  );
};

export default GroundStaffDashboard;

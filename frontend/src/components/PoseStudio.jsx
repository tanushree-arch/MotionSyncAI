import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const EXERCISES = {
  Yoga: [
    {
      name: "Mountain Pose",
      emoji: "🧍",
      description: "Improve balance and standing posture.",
      instructions: "Stand straight, keep your feet together and relax your shoulders.",
    },
    {
      name: "Tree Pose",
      emoji: "🌳",
      description: "Improve balance and stability.",
      instructions: "Stand on one leg and place the other foot against your inner thigh.",
    },
    {
      name: "Warrior II",
      emoji: "⚔️",
      description: "Build strength and improve flexibility.",
      instructions: "Spread your legs, bend your front knee and extend both arms.",
    },
    {
      name: "Chair Pose",
      emoji: "🪑",
      description: "Strengthen your legs and core.",
      instructions: "Bend your knees as if sitting on a chair and raise your arms.",
    },
  ],
  Fitness: [
    {
      name: "Squats",
      emoji: "🏋️",
      description: "Strengthen your legs and glutes.",
      instructions: "Keep your back straight and lower your hips as if sitting down.",
    },
    {
      name: "Lunges",
      emoji: "🦵",
      description: "Improve leg strength and balance.",
      instructions: "Step forward, bend both knees and keep your upper body straight.",
    },
    {
      name: "Bicep Curls",
      emoji: "💪",
      description: "Train your arm muscles.",
      instructions: "Keep your elbows close to your body and curl your forearms upward.",
    },
    {
      name: "Side Stretch",
      emoji: "🙆",
      description: "Improve flexibility.",
      instructions: "Raise one arm and gently bend your upper body to the opposite side.",
    },
  ],
};

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10], [11, 12],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [27, 31],
  [24, 26], [26, 28], [28, 30], [28, 32],
];

function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);

  let angle = Math.abs((radians * 180) / Math.PI);

  if (angle > 180) {
    angle = 360 - angle;
  }

  return Math.round(angle);
}

export default function PoseStudio() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const repRef = useRef(0);
  const phaseRef = useRef("UP");
  const lastRepTimeRef = useRef(0);

  const [category, setCategory] = useState("Yoga");
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES.Yoga[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [status, setStatus] = useState("Camera is inactive");
  const [error, setError] = useState("");
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState("Ready");
  const [jointAngle, setJointAngle] = useState("--");

  const resetCounter = () => {
    repRef.current = 0;
    phaseRef.current = "UP";
    lastRepTimeRef.current = 0;

    setRepCount(0);
    setPhase("Ready");
    setJointAngle("--");
  };

  useEffect(() => {
    resetCounter();
  }, [selectedExercise]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  const selectCategory = (newCategory) => {
    setCategory(newCategory);
    setSelectedExercise(EXERCISES[newCategory][0]);
  };

  const drawPose = (landmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) {
      setLandmarkCount(0);
      return;
    }

    setLandmarkCount(landmarks.length);

    const points = landmarks[0];

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#d68bff";

    CONNECTIONS.forEach(([start, end]) => {
      const first = points[start];
      const second = points[end];

      if (
        first &&
        second &&
        (first.visibility ?? 1) > 0.3 &&
        (second.visibility ?? 1) > 0.3
      ) {
        ctx.beginPath();
        ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
        ctx.lineTo(second.x * canvas.width, second.y * canvas.height);
        ctx.stroke();
      }
    });

    points.forEach((point) => {
      if ((point.visibility ?? 1) > 0.3) {
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );

        ctx.fillStyle = "#ff83c8";
        ctx.fill();
      }
    });

    trackRepetitions(points);
  };

  const trackRepetitions = (points) => {
    let angle = null;

    const visible = (index) =>
      points[index] && (points[index].visibility ?? 1) > 0.5;

    if (selectedExercise.name === "Squats") {
      if (visible(23) && visible(25) && visible(27)) {
        angle = calculateAngle(points[23], points[25], points[27]);
      }
    }

    if (selectedExercise.name === "Lunges") {
      const leftVisible = visible(23) && visible(25) && visible(27);
      const rightVisible = visible(24) && visible(26) && visible(28);

      if (leftVisible && rightVisible) {
        const leftAngle = calculateAngle(points[23], points[25], points[27]);
        const rightAngle = calculateAngle(points[24], points[26], points[28]);
        angle = Math.min(leftAngle, rightAngle);
      } else if (leftVisible) {
        angle = calculateAngle(points[23], points[25], points[27]);
      } else if (rightVisible) {
        angle = calculateAngle(points[24], points[26], points[28]);
      }
    }

    if (selectedExercise.name === "Bicep Curls") {
      const leftVisible = visible(11) && visible(13) && visible(15);
      const rightVisible = visible(12) && visible(14) && visible(16);

      if (leftVisible && rightVisible) {
        const leftAngle = calculateAngle(points[11], points[13], points[15]);
        const rightAngle = calculateAngle(points[12], points[14], points[16]);
        angle = Math.min(leftAngle, rightAngle);
      } else if (leftVisible) {
        angle = calculateAngle(points[11], points[13], points[15]);
      } else if (rightVisible) {
        angle = calculateAngle(points[12], points[14], points[16]);
      }
    }

    if (angle === null) return;

    setJointAngle(angle);

    const now = Date.now();

    if (selectedExercise.name === "Bicep Curls") {
      if (angle < 65 && phaseRef.current === "UP") {
        phaseRef.current = "DOWN";
        setPhase("Contracted");
      } else if (angle > 150 && phaseRef.current === "DOWN") {
        if (now - lastRepTimeRef.current > 700) {
          repRef.current += 1;
          setRepCount(repRef.current);
          lastRepTimeRef.current = now;
        }

        phaseRef.current = "UP";
        setPhase("Extended");
      }
    } else {
      if (angle < 100 && phaseRef.current === "UP") {
        phaseRef.current = "DOWN";
        setPhase("Down");
      } else if (angle > 155 && phaseRef.current === "DOWN") {
        if (now - lastRepTimeRef.current > 700) {
          repRef.current += 1;
          setRepCount(repRef.current);
          lastRepTimeRef.current = now;
        }

        phaseRef.current = "UP";
        setPhase("Up");
      }
    }
  };

  const detectPose = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker) return;

    if (video.readyState >= 2) {
      const results = landmarker.detectForVideo(
        video,
        performance.now()
      );

      drawPose(results.landmarks);
    }

    animationRef.current = requestAnimationFrame(detectPose);
  };

  const startCamera = async () => {
    try {
      setError("");
      setLoading(true);
      setStatus("Starting camera...");
      resetCounter();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      if (!landmarkerRef.current) {
        setStatus("Loading AI pose detection...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.3,
            minPosePresenceConfidence: 0.3,
            minTrackingConfidence: 0.3,
          }
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      await video.play();

      setCameraActive(true);
      setStatus("AI camera is active");

      animationRef.current = requestAnimationFrame(detectPose);
    } catch (err) {
      console.error("Camera error:", err);
      setError(err.message || "Unable to start the camera.");
      setStatus("Camera could not start");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(animationRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setCameraActive(false);
    setLandmarkCount(0);
    setStatus("Camera is inactive");
    setPhase("Ready");
    setJointAngle("--");
  };

  const isRepExercise = ["Squats", "Lunges", "Bicep Curls"].includes(
    selectedExercise.name
  );

  return (
    <section className="pose-studio" id="studio">
      <div className="studio-heading">
        <span className="section-label">YOUR PERSONAL AI TRAINER</span>
        <h2>Motion <span>Studio</span></h2>
        <p>Select an exercise and let AI track your body movements.</p>
      </div>

      <div className="exercise-selection">
        <h3>Choose Your Workout</h3>

        <div className="exercise-categories">
          {["Yoga", "Fitness"].map((item) => (
            <button
              key={item}
              className={`category-button ${category === item ? "active" : ""}`}
              onClick={() => selectCategory(item)}
            >
              {item === "Yoga" ? "🧘" : "🏋️"} {item}
            </button>
          ))}
        </div>

        <div className="exercise-grid">
          {EXERCISES[category].map((exercise) => (
            <button
              key={exercise.name}
              className={`exercise-card ${
                selectedExercise.name === exercise.name
                  ? "selected-exercise"
                  : ""
              }`}
              onClick={() => setSelectedExercise(exercise)}
            >
              <span className="exercise-emoji">{exercise.emoji}</span>
              <strong>{exercise.name}</strong>
              <small>{exercise.description}</small>
            </button>
          ))}
        </div>

        <div className="selected-exercise-info">
          <span>SELECTED EXERCISE</span>
          <h3>{selectedExercise.emoji} {selectedExercise.name}</h3>
          <p>{selectedExercise.instructions}</p>
        </div>
      </div>

      <div className="camera-container">
        <div className="camera-header">
          <div>
            <h3>Live Pose Detection</h3>
            <p>Position yourself in front of your camera.</p>
          </div>

          <span className={`camera-status ${cameraActive ? "online" : ""}`}>
            <span className="status-dot"></span>
            {cameraActive ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        <div className="camera-screen">
          <video
            ref={videoRef}
            className="camera-video"
            autoPlay
            muted
            playsInline
            style={{ display: cameraActive ? "block" : "none" }}
          />

          <canvas
            ref={canvasRef}
            className="pose-canvas"
            style={{ display: cameraActive ? "block" : "none" }}
          />

          {!cameraActive && (
            <div className="camera-placeholder">
              <div className="camera-icon">📷</div>
              <h3>Your camera preview will appear here</h3>
              <p>Allow camera access when your browser asks.</p>
            </div>
          )}
        </div>

        <div className="camera-controls">
          {!cameraActive ? (
            <button
              className="camera-button"
              onClick={startCamera}
              disabled={loading}
            >
              {loading ? "Starting..." : "▶ Activate AI Camera"}
            </button>
          ) : (
            <button className="stop-button" onClick={stopCamera}>
              ■ Stop Camera
            </button>
          )}
        </div>

        <p className="camera-message">{status}</p>
        {error && <p className="camera-error">{error}</p>}

        <div className="pose-stats">
          <div className="pose-stat">
            <span>AI STATUS</span>
            <strong>{cameraActive ? "Active" : "Inactive"}</strong>
          </div>

          <div className="pose-stat">
            <span>LANDMARKS</span>
            <strong>{landmarkCount}/33</strong>
          </div>

          <div className="pose-stat">
            <span>EXERCISE</span>
            <strong>{selectedExercise.name}</strong>
          </div>
        </div>

        <div className="rep-counter-panel">
          <div className="rep-counter-heading">
            <div>
              <span className="rep-label">WORKOUT TRACKER</span>
              <h3>{isRepExercise ? "Repetition Counter" : "Pose Tracker"}</h3>
            </div>
            <span className="rep-icon">⚡</span>
          </div>

          {isRepExercise ? (
            <div className="rep-counter-content">
              <div className="rep-number">
                <strong>{repCount}</strong>
                <span>REPS</span>
              </div>

              <div className="rep-details">
                <div>
                  <span>Movement</span>
                  <strong>{phase}</strong>
                </div>

                <div>
                  <span>Joint Angle</span>
                  <strong>{jointAngle}{jointAngle !== "--" ? "°" : ""}</strong>
                </div>

                <button className="reset-reps-button" onClick={resetCounter}>
                  ↻ Reset Counter
                </button>
              </div>
            </div>
          ) : (
            <div className="pose-tracker-message">
              <span>🧘</span>
              <p>
                Rep counting is not needed for this yoga exercise.
                Your body landmarks are being tracked instead.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
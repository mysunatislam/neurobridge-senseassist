import { FaceLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface VisualKinematicBiomarkers {
  /** Landmark estimate scaled using an assumed adult interpupillary distance. */
  lipApertureMm: number | null;
  /** Landmark estimate scaled using an assumed adult interpupillary distance. */
  lipWidthMm: number | null;
  lipRoundingIndex: number | null;
  facialSymmetryPercent: number | null;
  /** Frame-to-frame change in the estimated lip aperture. */
  jawOpeningVelocityMmS: number | null;
  /** Not available without a validated temporal oral-motor model. */
  articulatoryGropingIndex: number | null;
  headYawDeg: number | null;
  headPitchDeg: number | null;
  headRollDeg: number | null;
  /** Rolling head-pose stability proxy, not a clinical posture score. */
  posturalStabilityScore: number | null;
  gazeDirection: 'CENTER' | 'AVERTED_LEFT' | 'AVERTED_RIGHT' | 'UP' | 'DOWN';
  /** Unavailable: head pose alone cannot establish eye fixation. */
  fixationStabilityPct: number | null;
  /** Landmark-derived estimate after a minimum observation interval. */
  blinkRatePerMin: number | null;
  cognitiveGazeAversion: boolean;
  handGestureActive: boolean;
  /** Repeated hand-motion onset cadence, when enough events are observed. */
  gestureCadenceBpm: number | null;
  /** Unavailable here because this camera-only service has no speech clock. */
  handSpeechSyncIndex: number | null;
  handCoordinates: { x: number; y: number };
  isFaceDetected: boolean;
  landmarksCount: number;
}

// MediaPipe 468 Face Landmark Indices
const UPPER_LIP_CENTER = 13;
const LOWER_LIP_CENTER = 14;
const LIP_CORNER_LEFT = 61;
const LIP_CORNER_RIGHT = 291;
const NOSE_TIP = 1;
const LEFT_EYE = 33;
const RIGHT_EYE = 263;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_UPPER = 159;
const LEFT_EYE_LOWER = 145;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_UPPER = 386;
const RIGHT_EYE_LOWER = 374;
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

const ASSUMED_INTERPUPILLARY_DISTANCE_MM = 63;
const BLINK_EYE_ASPECT_THRESHOLD = 0.18;
const MIN_BLINK_OBSERVATION_MS = 10_000;
const POSE_STABILITY_WINDOW_MS = 2_000;
const HAND_CADENCE_WINDOW_MS = 20_000;

// Outer lip contour
const LIP_OUTER_CONTOUR = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// Hand Bone Connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

export class MediaPipeVisionService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isTracking = false;
  private onBiomarkersUpdate: ((biomarkers: VisualKinematicBiomarkers) => void) | null = null;

  private faceLandmarker: FaceLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private previousFaceSample: { timestampMs: number; lipApertureMm: number } | null = null;
  private smoothedJawVelocityMmS: number | null = null;
  private headPoseHistory: Array<{ timestampMs: number; yaw: number; pitch: number; roll: number }> = [];
  private faceObservationStartedAtMs: number | null = null;
  private eyeWasClosed = false;
  private blinkTimestampsMs: number[] = [];
  private previousHandSample: { timestampMs: number; x: number; y: number } | null = null;
  private handMotionActive = false;
  private handMotionOnsetsMs: number[] = [];

  public async startWebcamTracking(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onUpdate: (biomarkers: VisualKinematicBiomarkers) => void
  ): Promise<boolean> {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.onBiomarkersUpdate = onUpdate;
    this.resetTemporalMeasurements();

    try {
      // 1. Initialize Real MediaPipe Models
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1
      });

      // 2. Open User Webcam
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        if (this.videoElement.readyState >= 2) {
          this.videoElement.play().then(() => resolve()).catch(() => resolve());
        } else {
          this.videoElement.onloadeddata = () => {
            this.videoElement?.play().then(() => resolve()).catch(() => resolve());
          };
          // Fallback resolve after 1s
          setTimeout(resolve, 1000);
        }
      });
      this.isTracking = true;

      this.startRealTimeTrackingLoop();
      return true;
    } catch (err) {
      console.warn('Webcam or MediaPipe initialization failed:', err);
      return false;
    }
  }

  public stopTracking() {
    this.isTracking = false;
    this.resetTemporalMeasurements();
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  private resetTemporalMeasurements() {
    this.lastVideoTime = -1;
    this.previousFaceSample = null;
    this.smoothedJawVelocityMmS = null;
    this.headPoseHistory = [];
    this.faceObservationStartedAtMs = null;
    this.eyeWasClosed = false;
    this.blinkTimestampsMs = [];
    this.previousHandSample = null;
    this.handMotionActive = false;
    this.handMotionOnsetsMs = [];
  }

  private distance3d(a: { x: number; y: number; z?: number }, b: { x: number; y: number; z?: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
  }

  private updateBlinkRate(landmarks: Array<{ x: number; y: number; z?: number }>, timestampMs: number): number | null {
    const leftWidth = this.distance3d(landmarks[LEFT_EYE], landmarks[LEFT_EYE_INNER]);
    const rightWidth = this.distance3d(landmarks[RIGHT_EYE_INNER], landmarks[RIGHT_EYE]);
    if (leftWidth <= 0 || rightWidth <= 0) return null;

    const leftAspect = this.distance3d(landmarks[LEFT_EYE_UPPER], landmarks[LEFT_EYE_LOWER]) / leftWidth;
    const rightAspect = this.distance3d(landmarks[RIGHT_EYE_UPPER], landmarks[RIGHT_EYE_LOWER]) / rightWidth;
    const eyeAspect = (leftAspect + rightAspect) / 2;
    const eyesClosed = eyeAspect < BLINK_EYE_ASPECT_THRESHOLD;

    if (eyesClosed) {
      this.eyeWasClosed = true;
    } else if (this.eyeWasClosed) {
      this.blinkTimestampsMs.push(timestampMs);
      this.eyeWasClosed = false;
    }

    if (this.faceObservationStartedAtMs === null) this.faceObservationStartedAtMs = timestampMs;
    this.blinkTimestampsMs = this.blinkTimestampsMs.filter((blinkAt) => timestampMs - blinkAt <= 60_000);

    const observationMs = timestampMs - this.faceObservationStartedAtMs;
    if (observationMs < MIN_BLINK_OBSERVATION_MS) return null;
    const effectiveWindowMs = Math.min(observationMs, 60_000);
    return Math.round((this.blinkTimestampsMs.length * 60_000) / effectiveWindowMs);
  }

  private updatePoseStability(timestampMs: number, yaw: number, pitch: number, roll: number): number | null {
    this.headPoseHistory.push({ timestampMs, yaw, pitch, roll });
    this.headPoseHistory = this.headPoseHistory.filter(
      (sample) => timestampMs - sample.timestampMs <= POSE_STABILITY_WINDOW_MS
    );
    if (this.headPoseHistory.length < 5) return null;

    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const yawMean = mean(this.headPoseHistory.map((sample) => sample.yaw));
    const pitchMean = mean(this.headPoseHistory.map((sample) => sample.pitch));
    const rollMean = mean(this.headPoseHistory.map((sample) => sample.roll));
    const meanSquaredAngularJitter = mean(this.headPoseHistory.map((sample) =>
      ((sample.yaw - yawMean) ** 2 + (sample.pitch - pitchMean) ** 2 + (sample.roll - rollMean) ** 2) / 3
    ));
    const rmsAngularJitterDeg = Math.sqrt(meanSquaredAngularJitter);

    // UI-friendly proxy: 0 degrees of rolling jitter maps to 100 and 8+ degrees maps to 0.
    return Math.round(Math.max(0, Math.min(100, 100 - rmsAngularJitterDeg * 12.5)));
  }

  private updateJawVelocity(timestampMs: number, lipApertureMm: number): number | null {
    let velocity: number | null = null;
    if (this.previousFaceSample) {
      const elapsedSec = (timestampMs - this.previousFaceSample.timestampMs) / 1000;
      if (elapsedSec > 0 && elapsedSec <= 0.5) {
        const instantaneous = Math.abs(lipApertureMm - this.previousFaceSample.lipApertureMm) / elapsedSec;
        this.smoothedJawVelocityMmS = this.smoothedJawVelocityMmS === null
          ? instantaneous
          : this.smoothedJawVelocityMmS * 0.7 + instantaneous * 0.3;
        velocity = Number(this.smoothedJawVelocityMmS.toFixed(1));
      }
    }
    this.previousFaceSample = { timestampMs, lipApertureMm };
    return velocity;
  }

  private updateHandCadence(timestampMs: number, x: number, y: number): number | null {
    if (this.previousHandSample) {
      const elapsedSec = (timestampMs - this.previousHandSample.timestampMs) / 1000;
      if (elapsedSec > 0 && elapsedSec <= 0.5) {
        const speed = Math.hypot(x - this.previousHandSample.x, y - this.previousHandSample.y) / elapsedSec;
        if (!this.handMotionActive && speed >= 0.35) {
          this.handMotionActive = true;
          this.handMotionOnsetsMs.push(timestampMs);
        } else if (this.handMotionActive && speed <= 0.12) {
          this.handMotionActive = false;
        }
      }
    }
    this.previousHandSample = { timestampMs, x, y };
    this.handMotionOnsetsMs = this.handMotionOnsetsMs.filter(
      (onsetAt) => timestampMs - onsetAt <= HAND_CADENCE_WINDOW_MS
    );

    if (this.handMotionOnsetsMs.length < 2) return null;
    const intervals = this.handMotionOnsetsMs.slice(1).map(
      (onsetAt, index) => onsetAt - this.handMotionOnsetsMs[index]
    );
    const meanIntervalMs = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return meanIntervalMs > 0 ? Math.round(60_000 / meanIntervalMs) : null;
  }

  private startRealTimeTrackingLoop() {
    const processFrame = () => {
      if (!this.isTracking || !this.videoElement || !this.canvasElement || !this.canvasCtx) return;

      const video = this.videoElement;
      const canvas = this.canvasElement;
      const ctx = this.canvasCtx;

      // Sync canvas dimensions
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const width = canvas.width || 640;
      const height = canvas.height || 480;

      if (video.readyState >= 2) {
        this.lastVideoTime = video.currentTime;
        const now = performance.now();

        // 1. ALWAYS DRAW THE ACTUAL LIVE WEBCAM VIDEO FRAME (Mirrored natural view)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -width, 0, width, height);
        ctx.restore();

        let faceDetected = false;
        let handDetected = false;
        let lipApertureMm: number | null = null;
        let lipWidthMm: number | null = null;
        let symmetryPct: number | null = null;
        let jawOpeningVelocityMmS: number | null = null;
        let headYaw: number | null = null;
        let headPitch: number | null = null;
        let headRoll: number | null = null;
        let poseStabilityScore: number | null = null;
        let blinkRatePerMin: number | null = null;
        let gestureCadenceBpm: number | null = null;
        let gazeDir: 'CENTER' | 'AVERTED_LEFT' | 'AVERTED_RIGHT' | 'UP' | 'DOWN' = 'CENTER';
        let handPos = { x: 0, y: 0 };
        let landmarksCount = 0;

        // 2. Process Face Landmarks on Actual Video Frame
        if (this.faceLandmarker) {
          const faceResult = this.faceLandmarker.detectForVideo(video, now);

          if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
            faceDetected = true;
            const lm = faceResult.faceLandmarks[0];
            landmarksCount = lm.length;

            // Mirrored X coordinates to match mirrored camera view: (1 - x) * width
            const toX = (x: number) => (1 - x) * width;
            const toY = (y: number) => y * height;

            const upperLip = { x: toX(lm[UPPER_LIP_CENTER].x), y: toY(lm[UPPER_LIP_CENTER].y) };
            const lowerLip = { x: toX(lm[LOWER_LIP_CENTER].x), y: toY(lm[LOWER_LIP_CENTER].y) };
            const leftCorner = { x: toX(lm[LIP_CORNER_LEFT].x), y: toY(lm[LIP_CORNER_LEFT].y) };
            const rightCorner = { x: toX(lm[LIP_CORNER_RIGHT].x), y: toY(lm[LIP_CORNER_RIGHT].y) };
            const nose = { x: toX(lm[NOSE_TIP].x), y: toY(lm[NOSE_TIP].y) };
            const leftEye = { x: toX(lm[LEFT_EYE].x), y: toY(lm[LEFT_EYE].y) };
            const rightEye = { x: toX(lm[RIGHT_EYE].x), y: toY(lm[RIGHT_EYE].y) };

            const eyeSpanPixels = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
            const hasIrisCenters = lm.length > RIGHT_IRIS_CENTER;
            const ipdPixels = hasIrisCenters
              ? Math.hypot(
                toX(lm[RIGHT_IRIS_CENTER].x) - toX(lm[LEFT_IRIS_CENTER].x),
                toY(lm[RIGHT_IRIS_CENTER].y) - toY(lm[LEFT_IRIS_CENTER].y)
              )
              : 0;

            const aperturePixels = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);
            const widthPixels = Math.hypot(rightCorner.x - leftCorner.x, rightCorner.y - leftCorner.y);

            if (ipdPixels > 1) {
              const mmPerPixel = ASSUMED_INTERPUPILLARY_DISTANCE_MM / ipdPixels;
              lipApertureMm = Number((aperturePixels * mmPerPixel).toFixed(1));
              lipWidthMm = Number((widthPixels * mmPerPixel).toFixed(1));
              jawOpeningVelocityMmS = this.updateJawVelocity(now, lipApertureMm);
            }

            const distLeft = Math.hypot(leftCorner.x - nose.x, leftCorner.y - nose.y);
            const distRight = Math.hypot(rightCorner.x - nose.x, rightCorner.y - nose.y);
            const maxDist = Math.max(distLeft, distRight);
            if (maxDist > 0) {
              symmetryPct = Math.round((Math.min(distLeft, distRight) / maxDist) * 100);
            }

            if (eyeSpanPixels > 1) {
              headYaw = Number((((nose.x - (leftEye.x + rightEye.x) / 2) / eyeSpanPixels) * 45).toFixed(1));
              headPitch = Number((((nose.y - (leftEye.y + rightEye.y) / 2) / eyeSpanPixels - 0.45) * 60).toFixed(1));
              headRoll = Number(((Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI).toFixed(1));
              poseStabilityScore = this.updatePoseStability(now, headYaw, headPitch, headRoll);
              gazeDir = Math.abs(headYaw) > 12 ? (headYaw > 0 ? 'AVERTED_RIGHT' : 'AVERTED_LEFT') : 'CENTER';
            }

            blinkRatePerMin = this.updateBlinkRate(lm, now);

            // Draw Clean, Subtle, Non-Creepy Anatomical Reticles directly on face
            this.drawSubtleFaceReticles(ctx, lm, toX, toY, upperLip, lowerLip, leftCorner, rightCorner, leftEye, rightEye);
          }
        }

        if (!faceDetected) {
          this.previousFaceSample = null;
          this.smoothedJawVelocityMmS = null;
          this.headPoseHistory = [];
          this.faceObservationStartedAtMs = null;
          this.eyeWasClosed = false;
          this.blinkTimestampsMs = [];
        }

        // 3. Process Hand Landmarks on Actual Video Frame
        if (this.handLandmarker) {
          const handResult = this.handLandmarker.detectForVideo(video, now);

          if (handResult.landmarks && handResult.landmarks.length > 0) {
            handDetected = true;
            const hlm = handResult.landmarks[0];
            const toX = (x: number) => (1 - x) * width;
            const toY = (y: number) => y * height;

            handPos = { x: Math.round(toX(hlm[0].x)), y: Math.round(toY(hlm[0].y)) };
            gestureCadenceBpm = this.updateHandCadence(now, hlm[0].x, hlm[0].y);
            this.drawRealHandSkeletalMesh(ctx, hlm, toX, toY);
          }
        }

        if (!handDetected) {
          this.previousHandSample = null;
          this.handMotionActive = false;
          this.handMotionOnsetsMs = [];
        }

        // Notify biomarkers listener
        if (this.onBiomarkersUpdate) {
          this.onBiomarkersUpdate({
            lipApertureMm,
            lipWidthMm,
            lipRoundingIndex: lipApertureMm !== null && lipWidthMm !== null && lipWidthMm > 0
              ? Number((lipApertureMm / lipWidthMm).toFixed(2))
              : null,
            facialSymmetryPercent: symmetryPct,
            jawOpeningVelocityMmS,
            articulatoryGropingIndex: null,
            headYawDeg: headYaw,
            headPitchDeg: headPitch,
            headRollDeg: headRoll,
            posturalStabilityScore: poseStabilityScore,
            gazeDirection: gazeDir,
            fixationStabilityPct: null,
            blinkRatePerMin,
            cognitiveGazeAversion: headYaw !== null && Math.abs(headYaw) > 15,
            handGestureActive: handDetected,
            gestureCadenceBpm,
            handSpeechSyncIndex: null,
            handCoordinates: handPos,
            isFaceDetected: faceDetected,
            landmarksCount
          });
        }
      }

      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  }

  /**
   * Clean, subtle, professional overlays on the real video feed
   */
  private drawSubtleFaceReticles(
    ctx: CanvasRenderingContext2D,
    lm: any[],
    toX: (x: number) => number,
    toY: (y: number) => number,
    upperLip: { x: number; y: number },
    lowerLip: { x: number; y: number },
    leftCorner: { x: number; y: number },
    rightCorner: { x: number; y: number },
    leftEye: { x: number; y: number },
    rightEye: { x: number; y: number }
  ) {
    // 1. Subtle Lip Contour
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.85)'; // teal-400
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < LIP_OUTER_CONTOUR.length; i++) {
      const idx = LIP_OUTER_CONTOUR[i];
      const px = toX(lm[idx].x);
      const py = toY(lm[idx].y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 2. Lip-aperture landmark caliper (the UI labels the assumed IPD scale)
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)'; // rose-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(upperLip.x, upperLip.y);
    ctx.lineTo(lowerLip.x, lowerLip.y);
    ctx.stroke();

    // Aperture end ticks
    ctx.beginPath(); ctx.moveTo(upperLip.x - 4, upperLip.y); ctx.lineTo(upperLip.x + 4, upperLip.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lowerLip.x - 4, lowerLip.y); ctx.lineTo(lowerLip.x + 4, lowerLip.y); ctx.stroke();

    // 3. Subtle Eye Gaze Reticles
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)'; // sky-400
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(leftEye.x, leftEye.y, 5, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(rightEye.x, rightEye.y, 5, 0, 2 * Math.PI); ctx.stroke();
  }

  /**
   * Draws real skeletal bones directly on the user's actual hand landmarks
   */
  private drawRealHandSkeletalMesh(
    ctx: CanvasRenderingContext2D,
    hlm: any[],
    toX: (x: number) => number,
    toY: (y: number) => number
  ) {
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.9)';
    ctx.lineWidth = 2.5;

    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(toX(hlm[a].x), toY(hlm[a].y));
      ctx.lineTo(toX(hlm[b].x), toY(hlm[b].y));
      ctx.stroke();
    }

    for (const p of hlm) {
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.y), 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#F2A65A';
      ctx.fill();
    }
  }
}

export const mediaPipeVisionService = new MediaPipeVisionService();

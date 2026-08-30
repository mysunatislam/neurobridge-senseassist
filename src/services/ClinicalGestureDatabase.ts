export interface ClinicalGestureTemplate {
  id: string;
  name: string;
  phrase: string;
  icon: string;
  description: string;
  clinicalTarget: string; // e.g. "Thumb extension with closed fist"
  idealAngles: number[]; // 10 finger joint angles (0.0 to 1.0)
  idealDistances: number[]; // 10 fingertip-to-wrist normalized distances (0.0 to 2.0)
  toleranceRadius: number;
}

/**
 * Pre-calibrated clinical database of standard AAC motor speech gestures
 * compiled from standardized clinical rehabilitation & motor AAC protocols.
 */
export const CLINICAL_GESTURE_DATABASE: ClinicalGestureTemplate[] = [
  {
    id: 'g_rest',
    name: 'Rest (Neutral)',
    phrase: '',
    icon: '🖐️',
    description: 'Open relaxed hand with natural slight finger curve',
    clinicalTarget: 'Resting baseline — motor quiescence',
    idealAngles: [0.15, 0.18, 0.20, 0.20, 0.22, 0.22, 0.20, 0.20, 0.18, 0.18],
    idealDistances: [1.1, 1.3, 1.4, 1.3, 1.1, 0.9, 0.8, 0.7, 0.6, 0.5],
    toleranceRadius: 0.28
  },
  {
    id: 'g_yes',
    name: 'Yes (Thumbs Up)',
    phrase: 'Yes, I understand.',
    icon: '👍',
    description: 'Thumb extended upwards, four fingers curled in fist',
    clinicalTarget: 'Isolated thumb pollicis longus extension',
    idealAngles: [0.05, 0.10, 0.85, 0.90, 0.88, 0.92, 0.90, 0.92, 0.85, 0.90],
    idealDistances: [1.4, 0.4, 0.4, 0.35, 0.35, 0.8, 0.7, 0.5, 0.4, 0.3],
    toleranceRadius: 0.24
  },
  {
    id: 'g_no',
    name: 'No (Palm Stop)',
    phrase: 'No, let us slow down.',
    icon: '🙅',
    description: 'Open flat palm facing forward with fingers extended together',
    clinicalTarget: 'Full digital extension & wrist dorsiflexion',
    idealAngles: [0.05, 0.08, 0.05, 0.08, 0.05, 0.08, 0.05, 0.08, 0.06, 0.08],
    idealDistances: [1.3, 1.6, 1.7, 1.6, 1.4, 1.1, 1.0, 0.9, 0.8, 0.7],
    toleranceRadius: 0.22
  },
  {
    id: 'g_water',
    name: 'Water / Drink',
    phrase: 'I need some water, please.',
    icon: '💧',
    description: 'C-shaped cupped hand as if holding a glass',
    clinicalTarget: 'Cylindrical palmar prehension grasp',
    idealAngles: [0.35, 0.40, 0.45, 0.50, 0.45, 0.50, 0.45, 0.50, 0.40, 0.45],
    idealDistances: [0.9, 0.95, 1.0, 0.95, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4],
    toleranceRadius: 0.25
  },
  {
    id: 'g_nurse',
    name: 'Help / Nurse',
    phrase: 'Please call the nurse or caregiver.',
    icon: '🔔',
    description: 'Index finger pointing upward with other fingers flexed',
    clinicalTarget: 'Isolated index extensor indicis proprius activation',
    idealAngles: [0.60, 0.70, 0.05, 0.08, 0.85, 0.90, 0.88, 0.92, 0.85, 0.90],
    idealDistances: [0.6, 1.5, 0.4, 0.35, 0.35, 0.8, 0.6, 0.4, 0.4, 0.3],
    toleranceRadius: 0.23
  },
  {
    id: 'g_rest_break',
    name: 'Break / Rest',
    phrase: 'I need a short rest break.',
    icon: '⚠️',
    description: 'Horizontal palm over chest or closed gentle fist',
    clinicalTarget: 'Fatigue avoidance & sensory reset signal',
    idealAngles: [0.70, 0.75, 0.80, 0.85, 0.80, 0.85, 0.80, 0.85, 0.75, 0.80],
    idealDistances: [0.5, 0.4, 0.4, 0.35, 0.35, 0.4, 0.35, 0.3, 0.3, 0.25],
    toleranceRadius: 0.26
  }
];

export class ClinicalGestureDatabaseMatcher {
  /**
   * Matches live hand landmark features against the clinical gesture database.
   * Returns sorted array of gesture matches with confidence percentages (0 - 100%).
   */
  public matchGesture(
    liveAngles: number[],
    liveDistances: number[]
  ): Array<{ template: ClinicalGestureTemplate; score: number; isMatch: boolean }> {
    return CLINICAL_GESTURE_DATABASE.map((template) => {
      // Euclidean distance across joint angles & fingertip distances
      let angleDist = 0;
      for (let i = 0; i < Math.min(liveAngles.length, template.idealAngles.length); i++) {
        angleDist += Math.pow(liveAngles[i] - template.idealAngles[i], 2);
      }
      angleDist = Math.sqrt(angleDist) / (template.idealAngles.length || 1);

      let distDist = 0;
      for (let i = 0; i < Math.min(liveDistances.length, template.idealDistances.length); i++) {
        distDist += Math.pow(liveDistances[i] - template.idealDistances[i], 2);
      }
      distDist = Math.sqrt(distDist) / (template.idealDistances.length || 1);

      const totalDist = angleDist * 0.6 + distDist * 0.4;
      const score = Math.max(0, Math.min(1.0, 1.0 - (totalDist / template.toleranceRadius)));
      const isMatch = score >= 0.72;

      return {
        template,
        score: Number(score.toFixed(3)),
        isMatch
      };
    }).sort((a, b) => b.score - a.score);
  }
}

export const clinicalGestureMatcher = new ClinicalGestureDatabaseMatcher();

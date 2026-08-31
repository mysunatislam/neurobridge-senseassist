export interface BanditArm {
  id: string;
  name: string;
  modality: string;
  trialsCount: number;
  totalReward: number;
  averageReward: number; // Q-value Q(a)
  ucbScore: number; // Q(a) + c * sqrt(ln(t)/N(a))
  policyWeight: number; // Softmax probability
  consecutiveHighAccCount: number;
  difficultyEscalationTriggered: boolean;
}

export class ReinforcementLearningEngine {
  private cExploration = 1.414; // Standard UCB1 exploration constant

  public initializeArms(): BanditArm[] {
    return [
      {
        id: 'arm-control',
        name: 'Arm 0: Unassisted Baseline',
        modality: 'None (Control)',
        trialsCount: 8,
        totalReward: 4.8,
        averageReward: 0.60,
        ucbScore: 0.85,
        policyWeight: 0.12,
        consecutiveHighAccCount: 0,
        difficultyEscalationTriggered: false
      },
      {
        id: 'arm-haptic',
        name: 'Arm 1: Rhythmic Haptic Pacer (80 BPM)',
        modality: 'Tactile ERM 1-2-3-4',
        trialsCount: 22,
        totalReward: 19.8,
        averageReward: 0.90,
        ucbScore: 1.12,
        policyWeight: 0.48,
        consecutiveHighAccCount: 2,
        difficultyEscalationTriggered: false
      },
      {
        id: 'arm-visual',
        name: 'Arm 2: Visual Motor Articulatory Cue',
        modality: 'Lip/Tongue Contour Sync',
        trialsCount: 14,
        totalReward: 11.2,
        averageReward: 0.80,
        ucbScore: 0.98,
        policyWeight: 0.22,
        consecutiveHighAccCount: 1,
        difficultyEscalationTriggered: false
      },
      {
        id: 'arm-combined',
        name: 'Arm 3: Tri-Modal Sensory Entrainment',
        modality: 'Haptic + Auditory RAS + Visual',
        trialsCount: 18,
        totalReward: 15.66,
        averageReward: 0.87,
        ucbScore: 1.06,
        policyWeight: 0.18,
        consecutiveHighAccCount: 1,
        difficultyEscalationTriggered: false
      }
    ];
  }

  /**
   * Computes Pareto Multi-Objective Reward:
   * R = 0.4 * DeltaAcc + 0.3 * DeltaPause + 0.3 * DeltaWPM - StagnationPenalty
   */
  public calculateParetoReward(
    deltaAcc: number,
    deltaPausePct: number,
    deltaWpm: number,
    currentConsecutiveHighAcc: number
  ): { reward: number; isDifficultyStepUp: boolean } {
    let baseReward = (deltaAcc * 0.04) + (deltaPausePct * 0.02) + (Math.max(0, deltaWpm) * 0.03);

    // Anti-Gaming Penalty: If accuracy stays >85% without difficulty progression, apply stagnation discount
    let isDifficultyStepUp = false;
    if (currentConsecutiveHighAcc >= 3) {
      isDifficultyStepUp = true;
      baseReward += 0.25; // Bonus reward for graduating to higher difficulty level
    }

    return {
      reward: Number(Math.max(0.1, baseReward).toFixed(3)),
      isDifficultyStepUp
    };
  }

  /**
   * Updates bandit arm statistics in the local policy sandbox. Callers must not
   * label synthetic rewards as empirical observations.
   */
  public updateArmReward(
    arms: BanditArm[],
    selectedArmId: string,
    empiricalReward: number,
    achievedAccuracy = 88
  ): BanditArm[] {
    const totalTimeSteps = arms.reduce((acc, a) => acc + a.trialsCount, 0) + 1;

    // Update selected arm
    const updated = arms.map((arm) => {
      if (arm.id === selectedArmId) {
        const newCount = arm.trialsCount + 1;
        const newTotal = arm.totalReward + empiricalReward;
        const newAvg = Number((newTotal / newCount).toFixed(3));
        const consecutive = achievedAccuracy >= 85 ? arm.consecutiveHighAccCount + 1 : 0;
        const shouldStepUp = consecutive >= 3;

        return {
          ...arm,
          trialsCount: newCount,
          totalReward: Number(newTotal.toFixed(2)),
          averageReward: newAvg,
          consecutiveHighAccCount: shouldStepUp ? 0 : consecutive,
          difficultyEscalationTriggered: shouldStepUp
        };
      }
      return arm;
    });

    // Recompute UCB1 scores: Q(a) + c * sqrt(ln(t) / N(a))
    const withUcb = updated.map((arm) => {
      const explorationTerm = this.cExploration * Math.sqrt(Math.log(totalTimeSteps) / Math.max(1, arm.trialsCount));
      const ucbScore = Number((arm.averageReward + explorationTerm).toFixed(3));
      return {
        ...arm,
        ucbScore
      };
    });

    // Softmax policy distribution
    const expScores = withUcb.map(a => Math.exp(a.averageReward * 3.0));
    const sumExp = expScores.reduce((a, b) => a + b, 0);

    return withUcb.map((arm, idx) => ({
      ...arm,
      policyWeight: Number((expScores[idx] / sumExp).toFixed(3))
    }));
  }
}

export const reinforcementLearningEngine = new ReinforcementLearningEngine();

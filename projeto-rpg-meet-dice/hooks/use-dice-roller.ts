import { useState, useCallback } from 'react';
import { DiceRoll } from '@/lib/types';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

const DICE_SIDES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

export function useDiceRoller(playerName: string) {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  const rollDice = useCallback(
    (diceType: DiceType): DiceRoll => {
      const sides = DICE_SIDES[diceType];
      const result = Math.floor(Math.random() * sides) + 1;

      const roll: DiceRoll = {
        id: `${Date.now()}-${Math.random()}`,
        type: diceType,
        result,
        timestamp: new Date(),
        playerName,
      };

      setLastRoll(roll);
      setRolls((prev) => [roll, ...prev.slice(0, 9)]); // Manter últimos 10

      return roll;
    },
    [playerName]
  );

  const rollMultipleDice = useCallback(
    (quantity: number, diceType: DiceType): DiceRoll => {
      const sides = DICE_SIDES[diceType];
      const breakdown: number[] = [];
      let total = 0;

      for (let i = 0; i < quantity; i++) {
        const roll = Math.floor(Math.random() * sides) + 1;
        breakdown.push(roll);
        total += roll;
      }

      const roll: DiceRoll = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'multi',
        result: total,
        breakdown,
        timestamp: new Date(),
        playerName,
      };

      setLastRoll(roll);
      setRolls((prev) => [roll, ...prev.slice(0, 9)]);

      return roll;
    },
    [playerName]
  );

  const clearRolls = useCallback(() => {
    setRolls([]);
    setLastRoll(null);
  }, []);

  const getRecentRolls = useCallback((count: number = 5) => {
    return rolls.slice(0, count);
  }, [rolls]);

  return {
    rolls,
    lastRoll,
    rollDice,
    rollMultipleDice,
    clearRolls,
    getRecentRolls,
  };
}

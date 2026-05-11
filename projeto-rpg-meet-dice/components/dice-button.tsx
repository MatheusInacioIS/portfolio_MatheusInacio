import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DiceButtonProps {
  type: DiceType;
  onPress: (type: DiceType) => void;
  disabled?: boolean;
}

const DICE_LABELS: Record<DiceType, string> = {
  d4: 'D4',
  d6: 'D6',
  d8: 'D8',
  d10: 'D10',
  d12: 'D12',
  d20: 'D20',
  d100: 'D100',
};

export function DiceButton({ type, onPress, disabled = false }: DiceButtonProps) {
  const handlePress = async () => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(type);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
      className="bg-amber-700 px-4 py-3 rounded-lg items-center justify-center border border-amber-600"
    >
      <Text className="text-amber-100 font-bold text-base">{DICE_LABELS[type]}</Text>
    </Pressable>
  );
}

import { View, Text, Pressable, TextInput, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { DiceButton } from './dice-button';
import { DiceRoll } from '@/lib/types';
import * as Haptics from 'expo-haptics';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DicePanelProps {
  onRoll: (type: DiceType) => void;
  onRollMultiple: (quantity: number, type: DiceType) => void;
  lastRoll: DiceRoll | null;
  recentRolls: DiceRoll[];
  disabled?: boolean;
}

export function DicePanel({
  onRoll,
  onRollMultiple,
  lastRoll,
  recentRolls,
  disabled = false,
}: DicePanelProps) {
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [multipleInput, setMultipleInput] = useState('3d6');

  const handleMultipleRoll = async () => {
    const match = multipleInput.match(/^(\d+)d(\d+)$/i);
    if (!match) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const quantity = parseInt(match[1], 10);
    const diceNum = parseInt(match[2], 10);

    if (quantity < 1 || quantity > 100) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    let diceType: DiceType = 'd6';
    if (diceNum === 4) diceType = 'd4';
    else if (diceNum === 6) diceType = 'd6';
    else if (diceNum === 8) diceType = 'd8';
    else if (diceNum === 10) diceType = 'd10';
    else if (diceNum === 12) diceType = 'd12';
    else if (diceNum === 20) diceType = 'd20';
    else if (diceNum === 100) diceType = 'd100';

    onRollMultiple(quantity, diceType);
    setShowMultipleModal(false);
    setMultipleInput('3d6');
  };

  const formatRoll = (roll: DiceRoll): string => {
    if (roll.type === 'multi' && roll.breakdown) {
      return `${roll.breakdown.join('+')} = ${roll.result}`;
    }
    return `${roll.result}`;
  };

  return (
    <View className="gap-4">
      {/* Last Roll Display */}
      {lastRoll && (
        <View className="bg-amber-900 border-2 border-amber-600 rounded-lg p-4 items-center">
          <View>
            <Text className="text-amber-400 text-xs font-semibold uppercase">Último Dado</Text>
          </View>
          <View>
            <Text className="text-amber-100 text-4xl font-bold mt-2">{lastRoll.result}</Text>
          </View>
          <View>
            <Text className="text-amber-600 text-xs mt-1">
              {lastRoll.type === 'multi'
                ? `${lastRoll.breakdown?.length || 0}d${lastRoll.breakdown?.[0] || 6}`
                : lastRoll.type.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Dice Buttons Grid */}
      <View className="gap-2">
        <View>
          <Text className="text-amber-300 text-xs font-semibold uppercase">Rolar Dados</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <DiceButton type="d4" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <DiceButton type="d6" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <DiceButton type="d8" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <DiceButton type="d10" onPress={onRoll} disabled={disabled} />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <DiceButton type="d12" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <DiceButton type="d20" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <DiceButton type="d100" onPress={onRoll} disabled={disabled} />
          </View>
          <View className="flex-1">
            <View className="flex-1">
              <Pressable
                onPress={() => setShowMultipleModal(true)}
                disabled={disabled}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
                className="bg-amber-800 px-4 py-3 rounded-lg items-center justify-center border border-amber-700"
              >
                <Text className="text-amber-100 font-bold text-xs">MULTI</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Rolls */}
      {recentRolls.length > 0 && (
        <View className="gap-2">
          <View>
            <Text className="text-amber-300 text-xs font-semibold uppercase">Histórico</Text>
          </View>
          <FlatList
            scrollEnabled={false}
            data={recentRolls.slice(0, 3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View className="bg-amber-950 px-3 py-2 rounded border border-amber-800 flex-row justify-between items-center">
                <Text className="text-amber-600 text-xs">#{index + 1}</Text>
                <Text className="text-amber-100 font-semibold flex-1 text-center">
                  {formatRoll(item)}
                </Text>
                <Text className="text-amber-600 text-xs">
                  {item.type === 'multi' ? 'Multi' : item.type.toUpperCase()}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Multiple Dice Modal */}
      <Modal
        visible={showMultipleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMultipleModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-amber-950 border-2 border-amber-600 rounded-lg p-6 w-4/5 gap-4">
            <Text className="text-amber-300 font-bold text-lg">Rolar Múltiplos Dados</Text>

            <TextInput
              value={multipleInput}
              onChangeText={setMultipleInput}
              placeholder="ex: 3d6"
              placeholderTextColor="#8B7355"
              className="bg-amber-900 text-amber-100 px-4 py-3 rounded border border-amber-800 text-base font-mono"
              maxLength={10}
            />

            <Text className="text-amber-600 text-xs">Formato: {'{quantidade}d{lados}'}</Text>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowMultipleModal(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
                className="flex-1 bg-amber-800 px-4 py-3 rounded border border-amber-700 items-center"
              >
                <Text className="text-amber-100 font-bold">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleMultipleRoll}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
                className="flex-1 bg-amber-600 px-4 py-3 rounded items-center"
              >
                <Text className="text-amber-50 font-bold">Rolar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

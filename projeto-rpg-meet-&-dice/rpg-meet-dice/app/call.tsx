import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { JitsiMeetView } from '@/components/jitsi-meet-view';
import { DicePanel } from '@/components/dice-panel';
import { useDiceRoller } from '@/hooks/use-dice-roller';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

export default function CallScreen() {
  useKeepAwake(); // Manter tela ligada durante a chamada

  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = params.roomId as string;
  const playerName = params.playerName as string;
  const isCreator = params.isCreator === 'true';

  const [showDicePanel, setShowDicePanel] = useState(false);
  const { lastRoll, rollDice, rollMultipleDice, getRecentRolls } = useDiceRoller(playerName);

  const handleRoll = async (type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100') => {
    rollDice(type);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRollMultiple = async (quantity: number, type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100') => {
    rollMultipleDice(quantity, type);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLeaveCall = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <ScreenContainer className="p-0 bg-black">
      <View className="flex-1 bg-black">
        {/* Jitsi Meet Video Area */}
        <View className="flex-1">
          <JitsiMeetView
            roomId={roomId}
            playerName={playerName}
            onReady={() => {
              console.log('Jitsi Meet pronto');
            }}
            onError={(error) => {
              console.error('Erro Jitsi:', error);
            }}
          />
        </View>

        {/* Dice Overlay - Bottom Right */}
        {lastRoll && (
          <View className="absolute bottom-20 right-4 bg-amber-950 border-2 border-amber-600 rounded-lg p-3 gap-1">
            <View>
              <Text className="text-amber-400 text-xs font-bold uppercase">Dado</Text>
            </View>
            <View>
              <Text className="text-amber-100 text-2xl font-bold">{lastRoll.result}</Text>
            </View>
            <View>
              <Text className="text-amber-600 text-xs">
                {lastRoll.type === 'multi'
                  ? `${lastRoll.breakdown?.length || 0}d${lastRoll.breakdown?.[0] || 6}`
                  : lastRoll.type.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Control Bar */}
        <View className="bg-amber-950 border-t border-amber-800 px-4 py-4 flex-row justify-between items-center gap-2">
          <Pressable
            onPress={() => setShowDicePanel(!showDicePanel)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="flex-1 bg-amber-700 px-4 py-3 rounded-lg items-center justify-center border border-amber-600"
          >
            <Text className="text-amber-100 font-bold">🎲 Dados</Text>
          </Pressable>

          <Pressable
            onPress={handleLeaveCall}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="flex-1 bg-red-600 px-4 py-3 rounded-lg items-center justify-center"
          >
            <Text className="text-white font-bold">Sair</Text>
          </Pressable>
        </View>
      </View>

      {/* Dice Panel Modal */}
      {showDicePanel && (
        <View className="absolute inset-0 bg-black/50 flex-1">
          <View className="flex-1" />
          <View className="bg-amber-950 border-t-2 border-amber-600 rounded-t-2xl p-6 max-h-2/3">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-amber-300 text-lg font-bold">Painel de Dados</Text>
              <Pressable
                onPress={() => setShowDicePanel(false)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text className="text-amber-400 text-2xl">✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <DicePanel
                onRoll={handleRoll}
                onRollMultiple={handleRollMultiple}
                lastRoll={lastRoll}
                recentRolls={getRecentRolls(5)}
              />
            </ScrollView>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

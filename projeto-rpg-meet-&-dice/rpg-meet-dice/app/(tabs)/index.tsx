import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { usePlayerSettings } from '@/hooks/use-player-settings';
import { useRecentRooms } from '@/hooks/use-recent-rooms';
import { RecentRoom } from '@/lib/types';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, updatePlayerName } = usePlayerSettings();
  const { recentRooms, addRecentRoom } = useRecentRooms();

  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState(settings.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlayerName(settings.name);
  }, [settings.name]);

  const validateRoomId = (id: string): boolean => {
    // Alfanumérico + hífen, 3-30 caracteres
    return /^[a-zA-Z0-9-]{3,30}$/.test(id);
  };

  const validatePlayerName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 20;
  };

  const handleCreateRoom = async () => {
    setError('');

    if (!validateRoomId(roomId)) {
      setError('Sala deve ter 3-30 caracteres (letras, números, hífen)');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validatePlayerName(playerName)) {
      setError('Nome deve ter 2-20 caracteres');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Salvar configurações do jogador
      await updatePlayerName(playerName.trim());

      // Adicionar à lista de salas recentes
      await addRecentRoom(roomId.toLowerCase(), playerName.trim());

      // Navegar para tela de chamada
      router.push({
        pathname: '/call',
        params: {
          roomId: roomId.toLowerCase(),
          playerName: playerName.trim(),
          isCreator: 'true',
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erro ao criar sala:', err);
      setError('Erro ao criar sala. Tente novamente.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setError('');

    if (!validateRoomId(roomId)) {
      setError('Sala deve ter 3-30 caracteres (letras, números, hífen)');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validatePlayerName(playerName)) {
      setError('Nome deve ter 2-20 caracteres');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Salvar configurações do jogador
      await updatePlayerName(playerName.trim());

      // Adicionar à lista de salas recentes
      await addRecentRoom(roomId.toLowerCase(), playerName.trim());

      // Navegar para tela de chamada
      router.push({
        pathname: '/call',
        params: {
          roomId: roomId.toLowerCase(),
          playerName: playerName.trim(),
          isCreator: 'false',
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erro ao entrar em sala:', err);
      setError('Erro ao entrar em sala. Tente novamente.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRecentRoom = async (room: RecentRoom) => {
    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      router.push({
        pathname: '/call',
        params: {
          roomId: room.roomId,
          playerName: room.playerName,
          isCreator: 'false',
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Erro ao entrar em sala recente:', err);
      setError('Erro ao entrar em sala. Tente novamente.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-gradient-to-b from-amber-900 to-amber-800 px-6 py-8 gap-2">
          <View>
            <Text className="text-4xl font-bold text-amber-100">RPG Meet</Text>
          </View>
          <View>
            <Text className="text-2xl font-bold text-amber-300">&</Text>
          </View>
          <View>
            <Text className="text-4xl font-bold text-amber-100">Dice</Text>
          </View>
          <View>
            <Text className="text-sm text-amber-200 mt-2">Videoconferência para RPG de Mesa</Text>
          </View>
        </View>

        {/* Form Section */}
        <View className="flex-1 px-6 py-8 gap-6">
          {/* Player Name Input */}
          <View className="gap-2">
            <View>
              <Text className="text-sm font-semibold text-amber-300">Seu Nome</Text>
            </View>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Digite seu nome"
              placeholderTextColor="#8B7355"
              maxLength={20}
              editable={!isLoading}
              className="bg-amber-950 text-amber-100 px-4 py-3 rounded-lg border border-amber-800 text-base"
            />
          </View>

          {/* Room ID Input */}
          <View className="gap-2">
            <View>
              <Text className="text-sm font-semibold text-amber-300">Nome da Sala</Text>
            </View>
            <TextInput
              value={roomId}
              onChangeText={(text) => setRoomId(text.toLowerCase())}
              placeholder="ex: campanha-aventura-01"
              placeholderTextColor="#8B7355"
              maxLength={30}
              editable={!isLoading}
              className="bg-amber-950 text-amber-100 px-4 py-3 rounded-lg border border-amber-800 text-base"
            />
            <View>
              <Text className="text-xs text-amber-600">Letras, números e hífen (3-30 caracteres)</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-900 px-4 py-3 rounded-lg border border-red-700">
              <Text className="text-red-100 text-sm">{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            <Pressable
              onPress={handleCreateRoom}
              disabled={isLoading}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="bg-amber-600 px-6 py-4 rounded-lg items-center justify-center"
            >
              {isLoading ? (
                <ActivityIndicator color="#FEF3C7" size="small" />
              ) : (
                <Text className="text-amber-50 font-bold text-base">Criar Sala</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleJoinRoom}
              disabled={isLoading}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="bg-amber-700 px-6 py-4 rounded-lg items-center justify-center border border-amber-600"
            >
              {isLoading ? (
                <ActivityIndicator color="#FEF3C7" size="small" />
              ) : (
                <Text className="text-amber-50 font-bold text-base">Entrar em Sala</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Recent Rooms Section */}
        {recentRooms.length > 0 && (
          <View className="px-6 pb-8 gap-3">
            <Text className="text-sm font-semibold text-amber-300">Salas Recentes</Text>
            <FlatList
              scrollEnabled={false}
              data={recentRooms}
              keyExtractor={(item) => item.roomId}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleJoinRecentRoom(item)}
                  disabled={isLoading}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                  className="bg-amber-950 px-4 py-3 rounded-lg border border-amber-800 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-amber-100 font-semibold">{item.roomId}</Text>
                    <Text className="text-amber-600 text-xs mt-1">{item.playerName}</Text>
                  </View>
                  <Text className="text-amber-500 text-xs">→</Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

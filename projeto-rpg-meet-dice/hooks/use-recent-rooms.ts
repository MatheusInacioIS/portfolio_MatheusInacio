import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecentRoom } from '@/lib/types';

const RECENT_ROOMS_KEY = '@rpg_meet_dice:recent_rooms';

export function useRecentRooms() {
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar salas recentes ao montar
  useEffect(() => {
    loadRecentRooms();
  }, []);

  const loadRecentRooms = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(RECENT_ROOMS_KEY);
      if (data) {
        const rooms: RecentRoom[] = JSON.parse(data);
        // Ordenar por data mais recente
        rooms.sort((a, b) => new Date(b.lastJoined).getTime() - new Date(a.lastJoined).getTime());
        setRecentRooms(rooms.slice(0, 5)); // Manter apenas as 5 mais recentes
      }
    } catch (error) {
      console.error('Erro ao carregar salas recentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addRecentRoom = async (roomId: string, playerName: string) => {
    try {
      const newRoom: RecentRoom = {
        roomId,
        playerName,
        lastJoined: new Date(),
      };

      const data = await AsyncStorage.getItem(RECENT_ROOMS_KEY);
      let rooms: RecentRoom[] = data ? JSON.parse(data) : [];

      // Remover se já existe e adicionar no início
      rooms = rooms.filter((r) => r.roomId !== roomId);
      rooms.unshift(newRoom);

      // Manter apenas as 5 mais recentes
      rooms = rooms.slice(0, 5);

      await AsyncStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
      setRecentRooms(rooms);
    } catch (error) {
      console.error('Erro ao adicionar sala recente:', error);
    }
  };

  const clearRecentRooms = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_ROOMS_KEY);
      setRecentRooms([]);
    } catch (error) {
      console.error('Erro ao limpar salas recentes:', error);
    }
  };

  return {
    recentRooms,
    isLoading,
    addRecentRoom,
    clearRecentRooms,
    reload: loadRecentRooms,
  };
}

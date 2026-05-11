import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerSettings } from '@/lib/types';

const PLAYER_SETTINGS_KEY = '@rpg_meet_dice:player_settings';

const DEFAULT_SETTINGS: PlayerSettings = {
  name: 'Jogador',
  videoQuality: 'medium',
  soundEnabled: true,
  theme: 'dark',
};

export function usePlayerSettings() {
  const [settings, setSettings] = useState<PlayerSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações ao montar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(PLAYER_SETTINGS_KEY);
      if (data) {
        const savedSettings = JSON.parse(data);
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<PlayerSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const updatePlayerName = async (name: string) => {
    await updateSettings({ name });
  };

  const updateVideoQuality = async (quality: 'low' | 'medium' | 'high') => {
    await updateSettings({ videoQuality: quality });
  };

  const toggleSound = async () => {
    await updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    await updateSettings({ theme });
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(PLAYER_SETTINGS_KEY);
  };

  return {
    settings,
    isLoading,
    updateSettings,
    updatePlayerName,
    updateVideoQuality,
    toggleSound,
    updateTheme,
    resetSettings,
  };
}

import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react';

interface JitsiMeetViewProps {
  roomId: string;
  playerName: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function JitsiMeetView({
  roomId,
  playerName,
  onReady,
  onError,
}: JitsiMeetViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar Jitsi Meet público (meet.jit.si) ou self-hosted
  const jitsiUrl = `https://meet.jit.si/${roomId}`;

  const jitsiConfig = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    enableWelcomePage: false,
    enableClosePage: false,
    disableProfile: true,
    disableInviteFunctions: true,
    disableRemoteControl: true,
    disablePolls: true,
    disableRaisedHandNotifications: true,
    disableChat: true,
    disableFilmstrip: false,
    disableShortcuts: true,
    disableNoisyMicWarning: true,
    disableShowMoreCardsButton: true,
    disableThirdPartyRequests: true,
    disableTileView: false,
    disableVideoBackground: true,
    disableLocalVideoFlip: false,
    disableScreenshotCapture: true,
    disableAudioLevels: false,
    disableRecordAudioNotification: true,
  };

  const jitsiInterface = {
    TOOLBAR_BUTTONS: [
      'microphone',
      'camera',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'chat',
      'recording',
      'livestreaming',
      'etherpad',
      'settings',
      'raisehand',
      'videoquality',
      'filmstrip',
      'invite',
      'feedback',
      'stats',
      'shortcuts',
      'tileview',
      'select-background',
      'download-logs',
    ],
    SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
    MOBILE_APP_PROMO: false,
    SHOW_WATERMARK: false,
    SHOW_BRAND_WATERMARK: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    LANG_DETECTION: true,
    SHOW_JITSI_WATERMARK: false,
    BRAND_WATERMARK_LINK: '',
    HIDE_INVITE_MORE_HEADER: true,
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://meet.jit.si/css/all.css">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #jaas-container {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
      </style>
    </head>
    <body>
      <div id="jaas-container"></div>
      <script src="https://meet.jit.si/external_api.js"></script>
      <script>
        const domain = "meet.jit.si";
        const options = {
          roomName: "${roomId}",
          width: "100%",
          height: "100%",
          parentNode: document.querySelector("#jaas-container"),
          userInfo: {
            displayName: "${playerName}",
          },
          configOverwrite: ${JSON.stringify(jitsiConfig)},
          interfaceConfigOverwrite: ${JSON.stringify(jitsiInterface)},
          onload: () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          },
        };

        const api = new JitsiMeetExternalAPI(domain, options);

        api.addEventListener("videoConferenceJoined", () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'joined' }));
        });

        api.addEventListener("readyToClose", () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'close' }));
        });

        api.addEventListener("participantJoined", (participant) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'participantJoined',
            data: participant 
          }));
        });

        api.addEventListener("participantLeft", (participant) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'participantLeft',
            data: participant 
          }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Jitsi Message:', message);

      switch (message.type) {
        case 'ready':
          setIsLoading(false);
          onReady?.();
          break;
        case 'error':
          setError(message.error);
          onError?.(message.error);
          break;
      }
    } catch (err) {
      console.error('Error parsing Jitsi message:', err);
    }
  };

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center gap-4">
        <Text className="text-red-400 text-base font-semibold">Erro ao conectar</Text>
        <Text className="text-red-300 text-sm text-center px-4">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {isLoading && (
        <View className="absolute inset-0 bg-black items-center justify-center z-50">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="text-amber-300 text-base mt-4">Conectando ao Jitsi Meet...</Text>
        </View>
      )}

      <WebView
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        scalesPageToFit={false}
        startInLoadingState
        renderLoading={() => <View />}
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
          setError('Erro ao carregar Jitsi Meet');
          onError?.('Erro ao carregar Jitsi Meet');
        }}
      />
    </View>
  );
}

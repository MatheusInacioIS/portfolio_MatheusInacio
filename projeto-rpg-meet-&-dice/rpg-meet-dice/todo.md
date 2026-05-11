# RPG Meet & Dice - TODO

## Fase 1: Setup e Integração Jitsi
- [x] Instalar dependências (jitsi-meet-sdk, react-native-webrtc)
- [x] Configurar Jitsi Meet SDK no projeto
- [x] Criar componente JitsiMeetView wrapper
- [x] Testar conexão básica ao Jitsi Meet

## Fase 2: Tela Inicial (Home)
- [x] Criar layout da home screen
- [x] Implementar campo de entrada para nome da sala
- [x] Implementar campo de entrada para nome do jogador
- [x] Botão "Criar Sala" funcional
- [x] Botão "Entrar em Sala" funcional
- [x] Salvar histórico de salas em AsyncStorage
- [x] Exibir salas recentes na home

## Fase 3: Tela de Chamada (Video Call)
- [x] Criar layout da tela de chamada
- [x] Integrar Jitsi Meet na tela
- [ ] Implementar controles de áudio/vídeo
- [x] Botão de sair da chamada
- [x] Manter tela ligada durante chamada (keep-awake)
- [x] Exibir nome do jogador na chamada

## Fase 4: Sistema de Rolagem de Dados
- [x] Criar componente DiceButton (d4, d6, d8, d10, d12, d20, d100)
- [x] Implementar lógica de rolagem (Math.random)
- [ ] Criar animação de dado rolando
- [ ] Implementar som de efeito ao rolar
- [x] Criar componente DiceResult com exibição animada
- [x] Implementar histórico de rolls (últimas 3-5)
- [x] Criar modal para "Rolar Múltiplos" (ex: 3d6)
- [x] Calcular breakdown para múltiplos dados

## Fase 5: Overlay de Dados na Chamada
- [x] Criar componente VideoOverlay
- [x] Exibir último resultado do dado no overlay
- [x] Exibir histórico de rolls no overlay
- [x] Posicionar overlay no canto inferior direito
- [x] Tornar overlay transparente e não-intrusivo
- [x] Implementar timestamp para cada roll

## Fase 6: Tema RPG e Polimento
- [x] Atualizar paleta de cores (marrom, ouro, preto)
- [x] Aplicar tema a todos os componentes
- [ ] Adicionar ícones temáticos (dados, pergaminho)
- [x] Criar logo/ícone do app
- [ ] Animar transições entre telas
- [ ] Testar responsividade em diferentes tamanhos

## Fase 7: Configurações e Persistência
- [ ] Criar tela de Settings
- [ ] Salvar nome do jogador
- [ ] Salvar preferências de qualidade de vídeo
- [ ] Salvar preferências de som
- [ ] Salvar preferência de tema
- [ ] Carregar preferências ao abrir app

## Fase 8: Testes e Entrega
- [ ] Testar em dispositivo Android real
- [ ] Testar fluxo completo: criar sala → entrar → rolar dados
- [ ] Testar múltiplos participantes
- [ ] Verificar performance durante chamada
- [ ] Gerar APK de desenvolvimento
- [ ] Documentar instruções de instalação

## Bugs Conhecidos
(Nenhum identificado no momento)

## Notas
- Usar AsyncStorage para persistência local
- Jitsi Meet é self-hosted (sem API key necessária)
- Dados rolados são apenas visuais no overlay (não sincronizados entre participantes ainda)

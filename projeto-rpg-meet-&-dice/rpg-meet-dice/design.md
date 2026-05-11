# RPG Meet & Dice - Design de Interface

## Visão Geral
Aplicativo Android para videoconferência de RPG de mesa integrado ao Jitsi Meet com sistema de rolagem de dados em tempo real durante as chamadas.

## Orientação e Usabilidade
- **Orientação**: Portrait (9:16)
- **Uso**: Uma mão (botões acessíveis na metade inferior da tela)
- **Padrão**: Seguir Apple Human Interface Guidelines para consistência iOS

## Paleta de Cores (Tema RPG)
- **Primária**: `#8B4513` (Marrom escuro - pergaminho)
- **Secundária**: `#D4AF37` (Ouro - moedas/tesouro)
- **Background**: `#1a1a1a` (Preto profundo)
- **Surface**: `#2d2d2d` (Cinza escuro - cards)
- **Foreground**: `#E8D7C3` (Bege claro - texto)
- **Accent**: `#FF6B35` (Laranja - dados críticos)
- **Success**: `#2ECC71` (Verde - sucesso)
- **Error**: `#E74C3C` (Vermelho - erro)

## Lista de Telas

### 1. **Home Screen** (Tela Inicial)
**Conteúdo Principal:**
- Logo/título do app (RPG Meet & Dice)
- Campo de entrada para nome da sala (ex: "Campanha-Aventura-01")
- Campo para nome do jogador
- Dois botões principais:
  - "Criar Sala" (primário)
  - "Entrar em Sala" (secundário)
- Histórico de salas recentes (últimas 3-5)

**Funcionalidade:**
- Validar nome da sala (alfanumérico + hífen)
- Salvar nome do jogador em AsyncStorage
- Navegar para tela de chamada ao criar/entrar

---

### 2. **Video Call Screen** (Tela de Chamada)
**Conteúdo Principal:**
- **Área de vídeo**: Jitsi Meet embedded (80% da tela)
- **Overlay de dados**: Canto inferior direito
  - Resultado do último dado rolado
  - Histórico de 3 últimos rolls (stack visual)
  - Timestamp de cada roll

**Funcionalidade:**
- Integração ao Jitsi Meet SDK
- Exibir vídeo dos participantes
- Controles de áudio/vídeo
- Botão para sair da chamada

---

### 3. **Dice Roller Panel** (Painel de Rolagem)
**Conteúdo Principal:**
- Grid 2x4 de botões de dados:
  - d4, d6, d8, d10
  - d12, d20, d100, Rolar Múltiplos
- Resultado animado (número grande + efeito visual)
- Campo para quantidade (ex: "3d6")
- Botão "Rolar" (grande, destaque)
- Histórico de rolls (lista deslizável)

**Funcionalidade:**
- Animar resultado do dado
- Som de efeito ao rolar
- Enviar resultado para overlay da chamada
- Persistir histórico na sessão

---

### 4. **Settings Screen** (Configurações)
**Conteúdo Principal:**
- Nome do jogador (editável)
- Qualidade de vídeo (baixa/média/alta)
- Volume de efeitos sonoros
- Tema (claro/escuro)
- Sobre o app

**Funcionalidade:**
- Salvar preferências em AsyncStorage
- Aplicar mudanças em tempo real

---

## Fluxos de Usuário Principais

### Fluxo 1: Criar e Entrar em Sala
1. Usuário abre app → Home Screen
2. Digita nome da sala + nome do jogador
3. Toca "Criar Sala"
4. App conecta ao Jitsi Meet
5. Navega para Video Call Screen
6. Painel de dados fica visível no overlay

### Fluxo 2: Rolar Dados Durante Chamada
1. Usuário em Video Call Screen
2. Toca botão de dado (ex: d20)
3. Dado rola com animação
4. Resultado exibido no overlay (ex: "19")
5. Som de efeito toca
6. Resultado aparece no histórico

### Fluxo 3: Rolar Múltiplos Dados
1. Usuário toca "Rolar Múltiplos"
2. Abre modal com campo de entrada (ex: "3d6")
3. Toca "Rolar"
4. App calcula resultado (ex: "14 = 4+5+5")
5. Exibe no overlay com breakdown

---

## Componentes Principais

| Componente | Descrição |
|-----------|-----------|
| **RoomInput** | Campo para nome da sala + validação |
| **PlayerNameInput** | Campo para nome do jogador |
| **DiceButton** | Botão individual de dado (d4-d100) |
| **DicePanel** | Grid de botões de dados |
| **DiceResult** | Exibição animada de resultado |
| **DiceHistory** | Lista de rolls recentes |
| **JitsiMeetView** | Componente de vídeo (Jitsi SDK) |
| **VideoOverlay** | Overlay com dados + histórico |

---

## Animações e Feedback

| Ação | Feedback |
|-----|----------|
| Rolar dado | Rotação 3D + escala (0.9 → 1.1) |
| Resultado | Fade in + slide up |
| Toque em botão | Escala 0.97 + haptic light |
| Sucesso | Haptic success + cor verde |
| Erro | Haptic error + cor vermelha |

---

## Estrutura de Dados

### Room
```typescript
interface Room {
  id: string;           // "campanha-aventura-01"
  createdAt: Date;
  participants: string[]; // nomes dos jogadores
}
```

### DiceRoll
```typescript
interface DiceRoll {
  id: string;
  type: "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100" | "multi";
  result: number;
  breakdown?: number[]; // para multi-dados
  timestamp: Date;
  playerName: string;
}
```

### PlayerSettings
```typescript
interface PlayerSettings {
  name: string;
  videoQuality: "low" | "medium" | "high";
  soundEnabled: boolean;
  theme: "light" | "dark";
}
```

---

## Próximas Etapas
1. Implementar tela inicial com validação
2. Integrar Jitsi Meet SDK
3. Desenvolver painel de dados com animações
4. Criar overlay de resultados
5. Polir UI com tema RPG
6. Testar em dispositivo Android

# 🐉 RPG Meet & Dice  
### Reúna sua party. Role os dados. Viva a aventura.

**RPG Meet & Dice** é uma plataforma online criada para mestres e jogadores de RPG de mesa organizarem campanhas e sessões em tempo real — com videoconferência integrada, gerenciamento de campanhas, sistema de salas privadas e rolagem de dados em uma única interface imersiva.

`TypeScript` `React` `tRPC` `License`

---

# ✨ Proposta de Valor — Por que o RPG Meet & Dice é único?

Grande parte das plataformas de RPG online exige múltiplas ferramentas abertas ao mesmo tempo: Discord para voz, outro app para fichas, outro para rolagem de dados e mais um para organizar campanhas.

O **RPG Meet & Dice** centraliza tudo em uma única experiência.

| Recurso | RPG Meet & Dice | Plataformas tradicionais |
|---|---|---|
| Criação de campanhas e sessões | ✅ | ⚠️ parcial |
| Videoconferência integrada com Jitsi Meet | ✅ | ❌ |
| Sistema de rolagem de dados em tempo real | ✅ | ⚠️ |
| Convite rápido por código ou QR Code | ✅ | ❌ |
| Organização de jogadores e personagens | ✅ | ⚠️ |
| Interface temática medieval dark fantasy | ✅ | ❌ |
| Sem plugins ou extensões | ✅ | ❌ |

Em resumo: crie campanhas, organize sessões, converse com sua party e role dados em tempo real — tudo dentro da mesma plataforma.

---

# 📸 Capturas de Tela / GIF de Funcionamento

Adicione aqui os screenshots ou GIFs da aplicação em funcionamento.

Sugestões de ferramentas:
- ScreenToGif (Windows)
- Kap (macOS)

```md
[ Screenshot — Landing Page ]
[ Screenshot — Dashboard de Campanhas ]
[ Screenshot — Sala de Sessão com Jitsi ]
[ Screenshot — Sistema de Rolagem de Dados ]
[ GIF — Criação de Campanha ]
[ GIF — Jogadores entrando via QR Code ]
```

---

# 🚀 Instruções de Uso

## Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado
- PostgreSQL configurado
- Variáveis de ambiente preenchidas

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/rpg-meet-dice.git

# 2. Entre na pasta
cd rpg-meet-dice

# 3. Instale as dependências
pnpm install

# 4. Configure as variáveis de ambiente
cp .env.example .env

# 5. Execute as migrações do banco
pnpm db:migrate

# 6. Inicie o projeto
pnpm dev
```

A aplicação estará disponível em:

```bash
http://localhost:5173
```

---

# 🎲 Como usar

## Criando uma campanha

1. Acesse o painel principal
2. Clique em **Criar Campanha**
3. Defina:
   - Nome da campanha
   - Descrição
   - Sistema RPG (D&D, Tormenta, Call of Cthulhu, etc.)
4. Convide jogadores via link ou QR Code

---

## Criando uma sessão

1. Entre na campanha desejada
2. Clique em **Nova Sessão**
3. Defina:
   - Nome da sessão
   - Data e horário
   - Número máximo de jogadores
4. Inicie a sessão em tempo real

---

## Durante a sessão

- Utilize a videoconferência integrada via **Jitsi Meet**
- Role dados usando comandos rápidos:

```bash
/d20
/2d6
/1d20+5
```

- Converse com a party pelo chat lateral
- Compartilhe mapas, links e anotações
- Controle jogadores conectados em tempo real

---

# 🔗 Preview

Escaneie o QR Code abaixo para acessar a demonstração online:

<p align="center">
  <img 
    src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://manus.im/app-preview/3U5gEJk4oK8ZBGRBqe5j6M?sessionId=zfc12mqdE8vzEWgPyCUKzy" 
    alt="QR Code RPG Meet & Dice"
    width="250"
  />
</p>

---

# 🛠️ Stack Tecnológica

## Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Radix UI

## Backend
- Node.js
- tRPC
- WebSocket

## Banco de Dados
- PostgreSQL
- Drizzle ORM

## Videoconferência
- Jitsi Meet Embed API

## Funcionalidades Extras
- QR Code para convites
- Sistema de rolagem de dados
- Gerenciamento de campanhas e sessões
- Chat em tempo real

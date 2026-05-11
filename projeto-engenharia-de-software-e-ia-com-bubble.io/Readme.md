# 🎯 Sistema de Gerenciamento de Solicitações de Reembolso

## 📖 Descrição
Sistema web desenvolvido utilizando a plataforma no-code Bubble.io para gerenciamento de solicitações de reembolso. O sistema permite que usuários criem, acompanhem e organizem pedidos de reembolso de forma simples e eficiente, com autenticação, controle de privacidade e fluxos automatizados.

---

## 🎯 Objetivo
Desenvolver uma aplicação funcional utilizando Bubble.io, aplicando conceitos de Engenharia de Software, modelagem de dados, workflows automatizados e boas práticas de organização de sistemas web sem programação tradicional.

---

## 🔗 Links do Projeto

| Link | Acesso |
|---|---|
| 🌐 Aplicativo Publicado | [Acessar Aplicativo](https://matheusinaciio16-96493.bubbleapps.io/version-test/?debug_mode=true) |

---

## 📝 Sobre o Projeto
O sistema foi criado para facilitar o controle de solicitações de reembolso, permitindo que usuários registrem pedidos contendo informações como categoria, descrição, valor e comprovantes.

A plataforma conta com:
- Sistema de autenticação de usuários
- Cadastro de solicitações
- Histórico de solicitações
- Controle de status
- Interface intuitiva
- Regras de privacidade para proteção dos dados

---

## 🗃️ Modelagem de Dados

| Tabela | Campos principais |
|---|---|
| Usuário | ID, nome, e-mail, senha, data_de_criação |
| Solicitação | ID, criador, título, descrição, valor, categoria, status, comprovante, data_de_criação |

---

## 🔒 Regras de Privacidade

- Apenas o criador da solicitação pode visualizar e editar seus próprios dados
- Usuários não possuem acesso às solicitações de outros usuários
- Dados protegidos através das regras de privacidade do Bubble.io

---

## ⚙️ Funcionalidades Implementadas

### 👤 Autenticação
- Cadastro de usuários
- Login e logout
- Controle de sessão

### 📄 Solicitações de Reembolso
- Criar nova solicitação
- Visualizar histórico
- Atualizar status
- Upload de comprovantes
- Organização por categorias

### 🔄 Navegação e Workflows
- Redirecionamento entre páginas
- Atualização dinâmica de informações
- Modais de criação e visualização
- Cancelamento e envio de operações

---

## 🚨 Gestão de Limitações — Estratégia de Saída (Vendor Lock-in)

O Bubble.io possui dependência da plataforma para hospedagem e gerenciamento do sistema. Como estratégia de saída futura, o projeto poderá ser migrado para uma stack tradicional.

### 📦 Exportação de Dados
- Utilização da Data API do Bubble
- Exportação das tabelas em JSON ou CSV

### 💻 Possível Migração

| Camada | Tecnologia |
|---|---|
| Front-end | React.js |
| Back-end | Node.js + Express |
| Banco de Dados | PostgreSQL ou MongoDB |
| Autenticação | Firebase Auth ou Auth0 |
| Armazenamento | Amazon S3 |

---

## 🛠️ Tecnologias Utilizadas

- Bubble.io
- No-Code
- Workflows Automatizados
- Banco de Dados Bubble
- Engenharia de Software

---

## 📚 Matéria
Engenharia de Software & Produto

---

## 👨‍💻 Autor
Desenvolvido por **Matheus Inácio**.

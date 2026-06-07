# 🩺 Vitus – Sistema de Prontuário Eletrônico

![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 📌 Sobre o Projeto

O **Vitus** é um sistema de prontuário eletrônico desenvolvido como Trabalho de Conclusão de Curso em **Engenharia de Software** na **Associação Educacional Dom Bosco (AEDB)** — Resende, RJ.

O objetivo do sistema é centralizar o histórico clínico de pacientes em uma única plataforma, permitindo o registro e consulta de informações médicas por diferentes profissionais de saúde, com controle de acesso por perfil, rastreabilidade de atendimentos e conformidade com a **Lei Geral de Proteção de Dados (LGPD)**.

A aplicação segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com foco em organização, escalabilidade e facilidade de manutenção.

> **Autor:** Carlos Gabriel Miranda da Silva e Gustavo Pimentel de Andrade  
> **Curso:** Engenharia de Software — 7º Período  
> **Instituição:** Associação Educacional Dom Bosco (AEDB) — Resende, RJ  
> **Repositório:** [github.com/gabmiranda7/Vitus](https://github.com/gabmiranda7/Vitus)

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Back-end | ASP.NET Core (.NET 10) + C# |
| Front-end | React 19 + TypeScript + Vite 8 |
| UI | Material UI v9 |
| ORM | Entity Framework Core |
| Banco de Dados | PostgreSQL |
| Autenticação | JWT (JSON Web Tokens) |
| Validação | FluentValidation |
| Testes | xUnit + Moq + FluentAssertions |
| Containerização | Docker + Docker Compose |
| Versionamento | Git + GitHub |

---

## 👥 Perfis de Usuário

O Vitus possui três perfis de acesso, cada um com permissões específicas:

### 🟦 Recepcionista
Responsável pela gestão administrativa do sistema.
- Cadastrar, editar e excluir pacientes
- Cadastrar médicos
- Agendar e cancelar consultas
- Visualizar o dashboard geral

### 🟧 Enfermeiro
Responsável pelo acompanhamento e triagem dos pacientes.
- Realizar triagem (pressão arterial, temperatura, observações)
- Acompanhar pacientes em espera
- Visualizar prontuários
- Visualizar o dashboard geral

### 🟩 Médico
Responsável pelo atendimento clínico.
- Visualizar e gerenciar sua agenda diária
- Iniciar, anotar e finalizar consultas
- Emitir receitas com medicamentos
- Visualizar prontuários completos de pacientes
- Buscar prontuário por paciente

---

## 🔄 Fluxo Clínico

O fluxo de atendimento segue os seguintes estados:

```
Agendada → Em Triagem → Aguardando Atendimento → Em Atendimento → Finalizada
                                                                 ↘ Cancelada
```

1. A **Recepcionista** agenda a consulta → status `Agendada`
2. O **Enfermeiro** inicia a triagem, registra sinais vitais → status `Em Triagem` → `Aguardando Atendimento`
3. O **Médico** inicia o atendimento → status `Em Atendimento`
4. O **Médico** registra anotações clínicas, emite receitas e finaliza → status `Finalizada`

---

## 🔒 Privacidade e LGPD

O Vitus foi desenvolvido com atenção à **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**:

- O cadastro de pacientes exige **consentimento explícito** antes de qualquer coleta de dados pessoais
- Campos sensíveis como CPF, Cartão SUS, data de nascimento, filiação e informações médicas adicionais são **opcionais**
- O paciente pode solicitar a **exclusão de seus dados** a qualquer momento
- O acesso aos dados clínicos é restrito por perfil — somente Médicos e Enfermeiros visualizam prontuários
- Dados de escrita (cadastro, edição, exclusão de pacientes) são restritos exclusivamente à Recepcionista

---

## 🧱 Arquitetura

O projeto segue Clean Architecture, separando responsabilidades em camadas independentes:

### Camadas do Back-end

```
src/
├── Vitus.API            → Controllers, middlewares, configuração JWT, DI
├── Vitus.Application    → Use Cases, regras de fluxo, interfaces
├── Vitus.Communication  → DTOs de requisição e resposta (Request/Response JSON)
├── Vitus.Domain         → Entidades, enums, regras de negócio puras, exceções
└── Vitus.Infrastructure → EF Core, DbContext, implementações de repositórios
```

### Dependências entre Camadas

| Camada | Depende de |
|---|---|
| API | Application, Communication |
| Application | Domain, Communication |
| Communication | — |
| Domain | — |
| Infrastructure | Domain |

### Front-end

```
web/
├── src/
│   ├── components/   → Layout, componentes reutilizáveis
│   ├── contexts/     → AuthContext (autenticação + tema)
│   ├── pages/        → Telas por domínio (consultas, pacientes, prontuários...)
│   ├── routes/       → Definição de rotas com PrivateRoute por perfil
│   ├── services/     → Instância Axios com interceptors
│   └── types/        → Interfaces TypeScript
```

---

## 🧠 Conceitos Aplicados

- **Clean Architecture** — separação de responsabilidades em camadas independentes
- **Domain-Driven Design (DDD)** — modelagem orientada ao domínio clínico
- **SOLID** — princípios aplicados nos Use Cases e repositórios
- **JWT** — autenticação stateless com controle de perfil via claims
- **FluentValidation** — validação de entrada com mensagens padronizadas
- **Conventional Commits** — padronização do histórico de commits
- **LGPD** — consentimento explícito e controle de acesso a dados sensíveis

---

## ⚙️ Variáveis de Ambiente

### `.env` (raiz do projeto — usado pelo Docker Compose)

```env
DB_USER=postgres
DB_PASS=suasenha
JWT_KEY=sua-chave-secreta-longa
```

### `web/.env` (usado localmente com Vite)

```env
VITE_API_URL=http://localhost:5000
```

> Em produção via Docker, o `VITE_API_URL` deve ser deixado vazio — o nginx faz o proxy automaticamente para `/api/`.

---

## ▶️ Como Executar

### 🐳 Via Docker (Recomendado)

A maneira mais simples de rodar toda a aplicação (API + banco + front-end) é via Docker.

**Pré-requisitos:** Git e Docker Desktop instalados.

```bash
# 1. Clone o repositório
git clone https://github.com/gabmiranda7/Vitus
cd Vitus

# 2. Crie o arquivo .env na raiz com as variáveis acima

# 3. Crie o arquivo web/.env com VITE_API_URL vazio

# 4. Suba os containers
docker-compose up --build
```

A aplicação estará disponível em `http://localhost:3000`.  
A documentação interativa da API (Scalar) estará em `http://localhost:5000/scalar/v1`.

---

### 💻 Execução Local (Desenvolvimento)

**Pré-requisitos:** .NET 10 SDK, Node.js 20+, PostgreSQL rodando localmente.

**Back-end:**
```bash
cd src/Vitus.API
dotnet run
```
> A API sobe em `http://localhost:5000`.

**Front-end:**
```bash
cd web
npm install
npm run dev
```
> O front sobe em `http://localhost:5173`.

---

## 🧪 Testes

A aplicação conta com testes automatizados utilizando **xUnit**, **Moq** e **FluentAssertions**, cobrindo os principais Use Cases do sistema.

```bash
cd tests/Vitus.Tests
dotnet test
```

### Cobertura atual

| Módulo | Casos testados |
|---|---|
| Auth | Login com sucesso, email inválido, senha inválida, perfil inválido, email duplicado, CRM provisório |
| Consultas | Criação, fluxo completo de status (Domain) |
| Médicos | Criação, listagem, busca por ID |
| Pacientes | Criação, listagem, busca por ID, edição, exclusão |

---

## 🗺️ Roadmap

- [x] Estrutura inicial do projeto
- [x] Configuração da arquitetura (Clean Architecture + DDD)
- [x] Autenticação e autorização (JWT + perfis)
- [x] Cadastro de pacientes (CRUD completo + LGPD)
- [x] Cadastro de médicos
- [x] Agendamento de consultas
- [x] Fluxo de status da consulta (Triagem → Atendimento → Finalização)
- [x] Registro de triagem com sinais vitais
- [x] Registro de receitas e medicamentos
- [x] Prontuário único por paciente com histórico completo
- [x] Busca de prontuário por paciente (Médico/Enfermeiro)
- [x] Agenda diária do médico
- [x] Dashboard com gráficos e estatísticas
- [x] Middleware de tratamento de erros
- [x] Validação de inputs (FluentValidation)
- [x] Testes automatizados
- [x] Containerização com Docker
- [x] Conformidade com LGPD
- [ ] Deploy em produção

---

## 📌 Status do Projeto

✅ Funcionalidades principais implementadas e testadas. Em fase de finalização para entrega do TCC.

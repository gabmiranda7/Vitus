# 🩺 Vitus – Sistema de Prontuário Eletrônico

![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 📌 Sobre o Projeto

O **Vitus** é um sistema de prontuário eletrônico desenvolvido com o objetivo de centralizar o histórico clínico de pacientes em uma única plataforma, permitindo o registro e consulta de informações médicas por diferentes profissionais de saúde.

A aplicação segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, com foco em organização, escalabilidade e facilidade de manutenção.

---

## 🚀 Stack Tecnológica

* **Back-end:** ASP.NET Core (C#)
* **Front-end:** Vite (React + TypeScript)
* **ORM:** Entity Framework Core
* **Banco de Dados:** PostgreSQL
* **Versionamento:** Git + GitHub
* **Containerização:** Docker

---

## 🧱 Arquitetura

O projeto é organizado em camadas, separando responsabilidades:

### 🔹 API
* Controllers
* Extensions (registro de serviços)
* Middlewares
* Configuração (`Program.cs`)
* Autenticação (JWT)

---

### 🔹 Application
* Use Cases (ex: `CreatePacienteUseCase`)
* Interfaces (ex: `IPacienteRepository`)
* Regras de fluxo

---

### 🔹 Communication
* DTOs (Request/Response)
* ViewModels
* Contratos da API

---

### 🔹 Domain
* Entidades (ex: `Paciente`, `Consulta`)
* Value Objects
* Regras de negócio puras

---

### 🔹 Infrastructure
* Entity Framework Core
* DbContext
* Implementações de repositórios
* Integrações externas

---

## 🔗 Dependências entre Camadas

| Camada         | Depende de                 |
| -------------- | -------------------------- |
| API            | Application, Communication |
| Application    | Domain, Communication      |
| Communication  | —                          |
| Domain         | —                          |
| Infrastructure | Domain                     |

---

## 🧠 Conceitos Aplicados

* Clean Architecture
* Domain-Driven Design (DDD)
* Separation of Concerns
* SOLID
* FluentValidation

---

## 📂 Estrutura - Back-end (ASP .NET)

```
src/
├── Vitus.API
├── Vitus.Application
├── Vitus.Communication
├── Vitus.Domain
└── Vitus.Infrastructure

tests/
```

## 📂 Estrutura - Front-end (Vite)

```
web/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ▶️ Como Executar

### Back-end

```bash
cd src
dotnet run --project Vitus.API
```

### Front-end

```bash
cd web
npm install
npm run dev
```

---

## 🧪 Testes

A aplicação conta com testes automatizados utilizando xUnit, assegurando a integridade das regras de negócio e contribuindo para a qualidade e evolução contínua do sistema.

---

## 🗺️ Roadmap

* [x] Estrutura inicial do projeto
* [x] Configuração da arquitetura (Clean Architecture + DDD)
* [x] Cadastro de pacientes (CRUD completo)
* [x] Cadastro de médicos (CRUD completo)
* [x] Agendamento de consultas
* [x] Fluxo de status da consulta (Triagem → Atendimento → Finalização)
* [x] Registro de triagem
* [x] Registro de receitas e medicamentos
* [x] Middleware de tratamento de erros
* [x] Autenticação e autorização (JWT)
* [x] Prontuário único por paciente
* [x] Busca de prontuário por paciente
* [x] Validação de inputs (FluentValidation)
* [x] Integração com front-end
* [x] Testes automatizados
* [ ] Containerização com Docker
* [ ] Deploy da aplicação

---

## 📌 Status do Projeto

🚧 As funcionalidades estão sendo implementadas de forma incremental, conforme definido no roadmap do projeto.

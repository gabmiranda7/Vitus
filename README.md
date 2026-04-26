# 🩺 Vitus – Sistema de Prontuário Eletrônico

![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
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
* **Front-end:** React
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

## 📂 Estrutura do Projeto

```
src/
 ├── Vitus.API
 ├── Vitus.Application
 ├── Vitus.Communication
 ├── Vitus.Domain
 └── Vitus.Infrastructure
tests/
```

---

## 🐳 Docker (em breve)

A aplicação será containerizada utilizando Docker para facilitar o ambiente de desenvolvimento e deploy.

---

## 🧪 Testes

O projeto contará com testes automatizados utilizando **xUnit**, garantindo a qualidade e confiabilidade das regras de negócio.

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
* [ ] Integração com front-end
* [ ] Containerização com Docker
* [ ] Testes automatizados
* [ ] Deploy da aplicação

---

## 📌 Status do Projeto

🚧 As funcionalidades estão sendo implementadas de forma incremental, conforme definido no roadmap do projeto.

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

O objetivo é centralizar o histórico clínico de pacientes em uma única plataforma, permitindo o registro e a consulta de informações médicas por diferentes profissionais de saúde, com controle de acesso por perfil, rastreabilidade das ações e atenção à **Lei Geral de Proteção de Dados (LGPD)**.

A aplicação segue os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**.

> **Autor:** Carlos Gabriel Miranda da Silva e Gustavo Pimentel de Andrade
> **Curso:** Engenharia de Software — 8º Período
> **Instituição:** Associação Educacional Dom Bosco (AEDB) — Resende, RJ
> **Repositório:** [github.com/gabmiranda7/Vitus](https://github.com/gabmiranda7/Vitus)

---

## 🚀 Stack Tecnológica

| Camada          | Tecnologia                                      |
| --------------- | ----------------------------------------------- |
| Back-end        | ASP.NET Core (.NET 10) + C#                     |
| Front-end       | React 19 + TypeScript + Vite 8                  |
| Mobile          | React Native 0.88 + Expo SDK 58                 |
| UI              | Material UI v9 (web) e React Native Paper (app) |
| ORM             | Entity Framework Core                           |
| Banco de Dados  | PostgreSQL                                      |
| Autenticação    | JWT (JSON Web Tokens)                           |
| Validação       | FluentValidation                                |
| Documentos      | OpenXML (receitas em Word)                      |
| IA              | Google Gemini (apoio à leitura de exames)       |
| Testes          | xUnit + Moq + FluentAssertions                  |
| Containerização | Docker + Docker Compose                         |

---

## 👥 Perfis de Usuário

Todo cadastro novo (Médico, Enfermeiro ou Recepcionista) nasce **pendente** e só consegue entrar depois de aprovado por um Administrador. O Administrador é criado manualmente (veja _Primeiro administrador_).

### 🟫 Administrador

- Aprovar ou recusar cadastros pendentes
- Desativar e reativar o acesso de usuários
- Consultar a trilha de auditoria, com filtros e exportação para Excel

### 🟦 Recepcionista

- Cadastrar, editar, inativar e reativar pacientes
- Agendar e cancelar consultas
- Consultar a lista de médicos

### 🟧 Enfermeiro

- Registrar a triagem (pressão arterial, temperatura e observações)
- Acompanhar a fila de pacientes
- Visualizar prontuários

### 🟩 Médico

- Ver apenas as próprias consultas e a agenda do dia
- Iniciar, anotar, finalizar e cancelar suas consultas
- Emitir receitas (comum ou especial) em Word, com validade para acompanhar vencimentos
- Registrar exames, anexar arquivos e pedir a análise por IA
- Visualizar prontuários completos

Todos os perfis podem editar o nome e a foto no próprio perfil.

---

## 🔄 Fluxo Clínico

```
Agendada → Em Triagem → Aguardando Atendimento → Em Atendimento → Finalizada
                                                                 ↘ Cancelada
```

1. A **Recepcionista** agenda a consulta → `Agendada`
2. O **Enfermeiro** registra os sinais vitais → `Em Triagem` → `Aguardando Atendimento` (a triagem é obrigatória para avançar)
3. O **Médico** responsável inicia o atendimento → `Em Atendimento`
4. O **Médico** registra anotações, receitas e exames, e finaliza → `Finalizada`

---

## 🔒 Segurança e LGPD

- **Autenticação:** JWT com expiração de 8 horas. A cada requisição o status do usuário é conferido, então desativar ou recusar uma conta derruba a sessão na hora.
- **Controle de acesso por perfil** e restrição do médico às próprias consultas.
- **Criptografia AES** por coluna nas anotações clínicas e nas observações de triagem (chave em `ENCRYPTION_KEY`).
- **Auditoria** de login, acesso a prontuários, anotações, receitas, exames, aprovações e alterações de pacientes.
- **Bloqueio de tentativas de login** (por e-mail) e **rate limiting** por IP.
- **Cadastro de pacientes:** consentimento explícito exigido pela API, CPF validado e sem duplicidade. CPF, cartão SUS e dados de filiação são opcionais.
- **Pacientes não são excluídos:** são inativados. O prontuário, as consultas e os exames ficam guardados (o paciente inativo some das listas de uso diário, não recebe novas consultas e pode ser reativado pela recepção).
- **Análise de exames por IA:** o servidor extrai o texto do PDF, remove dados pessoais (nome, filiação, CPF, cartão SUS, endereço, telefone, e-mail, data de nascimento e registros profissionais) e envia ao Gemini **somente o texto**, nunca o arquivo. Imagens e PDFs escaneados, sem texto selecionável, não são analisados. A remoção é automática e **não é infalível**: nomes que não constam do cadastro do paciente (como o de médicos e do laboratório) ou grafados de forma diferente podem permanecer. Use com essa ciência. O resultado é um apoio e não substitui a avaliação médica.

---

## 🧱 Arquitetura

### Back-end

```
src/
├── Vitus.API            → Controllers, middlewares, configuração JWT, DI
├── Vitus.Application    → Use Cases, validadores, regras de fluxo
├── Vitus.Communication  → DTOs de requisição e resposta
├── Vitus.Domain         → Entidades, enums, regras de negócio, exceções
└── Vitus.Infrastructure → EF Core, repositórios, arquivos, documentos, IA
```

| Camada         | Depende de                                 |
| -------------- | ------------------------------------------ |
| API            | Application, Communication, Infrastructure |
| Application    | Domain, Communication                      |
| Communication  | —                                          |
| Domain         | —                                          |
| Infrastructure | Domain                                     |

### Front-end

```
web/src/
├── components/   → Layout e componentes reutilizáveis
├── contexts/     → AuthContext (sessão, foto e tema)
├── pages/        → Telas por domínio
├── routes/       → Rotas protegidas por perfil
├── services/     → Instância Axios com interceptors
├── types/        → Interfaces TypeScript
└── utils/        → Funções auxiliares
```

### Mobile

```
mobile/src/
├── components/   → Modais e componentes reutilizáveis
├── contexts/     → AuthContext (sessão validada na abertura, foto de perfil)
├── navigation/   → Abas por perfil e pilhas de navegação
├── screens/      → Telas por funcionalidade (agenda, consultas, triagem, prontuário...)
├── services/     → Instância Axios (token, timeout e logout em sessão expirada)
├── theme/        → Cores, tema claro/escuro e helpers de avatar
├── types/        → Interfaces TypeScript
└── utils/        → Funções auxiliares (vencimento de receitas, auditoria, arquivos)
```

---

## ⚙️ Variáveis de Ambiente

Copie `.env.example` para `.env` na raiz do projeto (usado pelo Docker Compose):

| Variável              | Obrigatória | Descrição                                                                                         |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `DB_USER` / `DB_PASS` | Sim         | Credenciais do PostgreSQL                                                                         |
| `JWT_KEY`             | Sim         | Chave de assinatura dos tokens (longa e aleatória)                                                |
| `ENCRYPTION_KEY`      | Sim         | Chave da criptografia AES. **Guarde uma cópia: sem ela, os dados criptografados ficam ilegíveis** |
| `GEMINI_API_KEY`      | Não         | Habilita a análise de exames por IA                                                               |
| `VITE_API_URL`        | Não         | Deixe **vazio** no Docker: o nginx encaminha `/api` para a API                                    |
| `BIND_ADDRESS`        | Não         | Padrão `127.0.0.1`. Use `0.0.0.0` para acessar de outra máquina                                   |

Para desenvolvimento local do front, crie `web/.env` com `VITE_API_URL=http://localhost:5000`.

Para o aplicativo, crie `mobile/.env` com `EXPO_PUBLIC_API_URL` (veja _Aplicativo mobile_).

### Templates de receita

A geração de receitas usa dois modelos Word que **não ficam no repositório**, por serem documentos oficiais do órgão emissor. Crie a pasta `storage/templates/` na raiz do projeto e coloque nela:

- `receita_comum.docx`
- `receita_especial.docx`

Sem esses arquivos, a emissão de receitas falha. A pasta `storage/` está no `.gitignore`.

---

## ▶️ Como Executar

### 🐳 Via Docker (Recomendado)

**Pré-requisitos:** Git e Docker Desktop.

```bash
git clone https://github.com/gabmiranda7/Vitus
cd Vitus
cp .env.example .env     # edite e preencha as chaves
mkdir -p storage/templates   # coloque aqui os dois templates de receita
docker compose up --build
```

- Aplicação: `http://localhost:3000`
- Documentação da API (Scalar): `http://localhost:5000/scalar/v1`

Por padrão as portas só escutam em `127.0.0.1`.

### 💻 Execução Local (Desenvolvimento)

**Pré-requisitos:** .NET 10 SDK, Node.js 20+ e PostgreSQL.

```bash
# Back-end
cd src/Vitus.API
dotnet run            # http://localhost:5063

# Front-end
cd web
npm install
npm run dev           # http://localhost:5173
```

Configure `ConnectionStrings`, `JWT_KEY`, `ENCRYPTION_KEY` e `DB_USER`/`DB_PASS` por variáveis de ambiente ou _user secrets_.

### 📱 Aplicativo mobile

O app (Android e iOS) usa a mesma API do sistema web e tem abas por perfil: Médico (agenda, consultas, prontuários e receitas), Enfermeiro (consultas, triagem e prontuários), Recepcionista (consultas, pacientes e médicos) e Administrador (auditoria e aprovações). A sessão é sempre validada na API ao abrir o app.

**Pré-requisitos:** Node.js 20+, o app **Expo Go** no celular, celular e computador na **mesma rede Wi-Fi** e a API em execução.

```bash
cd mobile
npm install
# crie mobile/.env (veja abaixo) e inicie:
npx expo start
```

Escaneie o QR code com o Expo Go. O celular não enxerga o `localhost` do computador, então aponte a API para o **IP do computador na rede local** em `mobile/.env`:

```env
# API iniciada com "dotnet run" (escuta em 0.0.0.0)
EXPO_PUBLIC_API_URL=http://192.168.0.10:5063

# API iniciada pelo Docker (use BIND_ADDRESS=0.0.0.0 no .env da raiz, senão a porta 5000 só aceita o próprio computador)
# EXPO_PUBLIC_API_URL=http://192.168.0.10:5000
```

- Troque `192.168.0.10` pelo IP do seu computador. Se o celular não conectar, confira o firewall do sistema.
- A variável é lida na inicialização: depois de alterar o `.env`, reinicie com `npx expo start -c`.
- Para checar os tipos do TypeScript: `npm run typecheck`.

**Gerar o APK.** O `app.json` já define o identificador `com.gabmiranda7.vitus`. O projeto não traz `eas.json`: gere um com o EAS Build (`npx eas-cli build:configure`) e configure o perfil de teste para gerar `.apk`. Confira os comandos na documentação atual do EAS.

- Um APK de release **bloqueia HTTP puro**: a API precisa estar em **HTTPS**.
- `EXPO_PUBLIC_API_URL` é gravada no build. Se o endereço da API mudar, gere o APK de novo.
- Com o deploy descrito abaixo (nginx na frente do container `frontend`), o endereço é só o domínio, sem `/api`: `EXPO_PUBLIC_API_URL=https://seu-dominio.com.br`.

### Primeiro administrador

O cadastro público bloqueia o perfil Administrador. Para criar o primeiro, cadastre uma conta como Recepcionista e promova no banco:

```sql
UPDATE usuarios SET perfil = 'Administrador', status = 1 WHERE email = 'seu@email.com';
```

---

## 🌐 Deploy em servidor (VPS)

1. Copie os templates de receita para `storage/templates/` no servidor (por exemplo, com `scp`) e suba o projeto com `docker compose up -d --build` (as portas ficam em `127.0.0.1`).
2. Instale o nginx no servidor e use-o como proxy HTTPS na frente do container `frontend` (porta 3000):

```nginx
server {
    server_name seu-dominio.com.br;
    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 400s;
    }
}
```

3. Gere o certificado: `sudo certbot --nginx -d seu-dominio.com.br`.
4. Faça backup periódico do volume `postgres_data`, do volume `storage_data` (exames e fotos) e da `ENCRYPTION_KEY`.

---

## 🧪 Testes

```bash
cd tests/Vitus.Tests
dotnet test
```

Os testes são unitários (repositórios simulados) e cobrem:

| Módulo      | Casos testados                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Auth        | Login, cadastro, perfil e foto, aprovação e recusa, ativação e desativação, bloqueio de tentativas |
| Consultas   | Criação, fluxo de status, acesso por médico, triagem obrigatória, auditoria, validação de data     |
| Médicos     | Listagem (apenas contas aprovadas) e busca por ID                                                  |
| Pacientes   | Criação (CPF e consentimento), listagem, busca, edição, inativação e reativação                    |
| Prontuários | Acompanhamento de receitas                                                                         |
| Receitas    | Geração do documento, acompanhamento de vencimento                                                 |
| Triagens    | Registro de triagem (uma por consulta, com glicemia)                                               |
| Exames      | Anexo de arquivos, análise por IA e anonimização do texto enviado                                  |
| Auditoria   | Consulta de logs com filtros                                                                       |
| Domínio     | Validação de CPF                                                                                   |
| Validadores | Tamanho de textos criptografados, triagem e data de consulta                                       |

---

## 🗺️ Roadmap

- [x] Arquitetura (Clean Architecture + DDD)
- [x] Autenticação, perfis e aprovação de cadastros
- [x] Cadastro de pacientes com consentimento (LGPD)
- [x] Agendamento e fluxo de status das consultas
- [x] Triagem com sinais vitais
- [x] Receitas em Word com acompanhamento de validade
- [x] Prontuário único por paciente com histórico completo
- [x] Exames com anexos e análise de apoio por IA
- [x] Auditoria e exportação em Excel
- [x] Criptografia de dados clínicos sensíveis
- [x] Containerização com Docker
- [x] Aplicativo mobile (Android e iOS) com as mesmas funcionalidades do web
- [ ] Deploy em produção (VPS, HTTPS)
- [ ] Geração do APK de produção
- [ ] Pipeline de CI/CD
- [ ] Recuperação de senha por e-mail
- [ ] Validação de senha forte

---

## 📌 Status do Projeto

✅ Funcionalidades principais implementadas e testadas. Em fase de correções e finalização para a entrega do TCC.

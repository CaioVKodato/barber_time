# BarberTime — Sistema Distribuído (Entrega Final / Sprint 4)

Backend **Node.js + Express**, **PostgreSQL**, **JWT** e **RabbitMQ** (MOM) para o domínio de agendamento em barbearia, com **dois apps Flutter**: cliente (`mobile_client/`) e prestador (`mobile_provider/`). O fluxo completo cliente → MOM → prestador funciona de ponta a ponta com notificação assíncrona.

## Estrutura do repositório

```
BarberTime/
├─ backend/         # API Node.js, banco, mensageria, infra (.env, docker-compose)
├─ mobile_client/   # App Flutter cliente (Sprint 3)
├─ mobile_provider/ # App Flutter prestador/barbeiro (Sprint 4)
└─ docs/            # Documentação por sprint
```

> Todos os comandos de backend (`npm ...`, `docker compose ...`) devem ser executados **dentro de `backend/`**.

## Pré-requisitos

- Node.js 18+
- PostgreSQL acessível via `DATABASE_URL`
- Docker (para RabbitMQ) ou instância AMQP compatível

## Configuração

1. Em `backend/`, copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e `RABBITMQ_URL`.
2. Crie o banco vazio (ex.: `createdb barbertime`) e rode a migração:

```bash
cd backend
npm install
npm run db:migrate
```

3. Suba o RabbitMQ:

```bash
docker compose up -d
```

4. Em **dois terminais** (ambos em `backend/`), inicie o worker (consumidor) e a API (produtor):

```bash
# Terminal 1 — consumidor de notificações
npm run worker:notifications

# Terminal 2 — API REST
npm run dev
```

A API sobe em `http://localhost:3000`. Painel RabbitMQ do BarberTime: `http://localhost:15673` (usuário/senha `barbertime`). AMQP na porta **5673** (evita conflito com outras instâncias na 5672).

## Sprint 1 — Arquitetura e Backend REST

| Documento | Descrição |
|-----------|-----------|
| [PropostaDominioBarberTime.pdf](docs/sprint1/PropostaDominioBarberTime.pdf) | Proposta de domínio |
| [Diagrama de arquitetura](docs/sprint1/DiagramaArquiteturaBarberTime.png) | Componentes e protocolos |
| [schema-postgresql.pdf](docs/sprint1/schema-postgresql.pdf) | Schema do banco |
| [BACKEND_REST.pdf](docs/sprint1/BACKEND_REST.pdf) | Endpoints e regras REST |

## Documentação por sprint

Índice completo: [`docs/README.md`](docs/README.md)

### Sprint 2 — MOM

| Evento | Quando | Quem recebe |
|--------|--------|-------------|
| `appointment.requested` | Cliente solicita horário (`POST /appointments`) | Barbeiro |
| `appointment.confirmed` | Barbeiro aceita (`PATCH /barber/appointments/:id/confirm`) | Cliente |
| `appointment.rejected` | Barbeiro recusa (`PATCH /barber/appointments/:id/reject`) | Cliente |

Documentação (PDF): [`docs/README.md`](docs/README.md)

- **Sprint 2:** `docs/sprint2/ENTREGA_SPRINT2.pdf`, `EVENTOS_MOM.pdf`, `RELATORIO_INTEGRACAO_MOM.pdf`
- **Sprint 3:** `docs/sprint3/ENTREGA_SPRINT3.md`, `ARQUITETURA_MOBILE.md` — app em `mobile_client/`
- **Sprint 4:** `docs/sprint4/RelatorioTecnicoFinal_BarberTime.pdf`, `ArquiteturaPrestador_BarberTime.pdf`, `EntregaSprint4_BarberTime.pdf`, `Screencast_BarberTime_Sprint4.mp4` (vídeo da demonstração, ≈4min54s) — app em `mobile_provider/`

### App Flutter cliente (Sprint 3)

```bash
cd mobile_client
flutter pub get
flutter run
```

Instruções completas: [`mobile_client/README.md`](mobile_client/README.md)

### App Flutter prestador (Sprint 4)

```bash
cd mobile_provider
flutter pub get
flutter run
```

Login com conta de barbeiro (seed: `joao.barbeiro@barbertime.seed` / `senha123`). A fila de solicitações atualiza sozinha (polling de 8 s) e exibe badge + aviso de novas solicitações. Instruções completas: [`mobile_provider/README.md`](mobile_provider/README.md)

### Demonstração rápida

1. Worker rodando → crie um agendamento (Postman) → veja `[NOTIFICAÇÃO → BARBEIRO]` no terminal do worker.
2. Confirme como barbeiro → veja `[NOTIFICAÇÃO → CLIENTE]` no worker.
3. `GET /health` → `"rabbitmq": { "enabled": true, "connected": true }`.

### E-mail real (Gmail SMTP)

Com `EMAIL_ENABLED=true` no `.env`, o worker envia e-mail para a caixa do destinatário:

| Evento | Destinatário |
|--------|----------------|
| Nova solicitação | E-mail do **barbeiro** (`joao.barbeiro@barbertime.seed`, etc.) |
| Confirmação | E-mail do **cliente** (o cadastrado no app) |

Configure no `.env` (veja `.env.example`):

1. Google Account → Segurança → **Verificação em 2 etapas**
2. **Senhas de app** → gere uma para “BarberTime”
3. Preencha `SMTP_USER`, `SMTP_PASS` e `EMAIL_FROM=BarberTime <seu@gmail.com>`
4. Reinicie o worker: `npm run worker:notifications`

Para testar recebimento na **sua** caixa, cadastre-se no app com **seu e-mail real** e confirme o agendamento no Postman.

## Grade e expediente (`.env`)

Padrão alinhado à regra de negócio atual:

- **Domingo:** fechado (`CLOSED_ON_SUNDAY=true`).
- **Expediente:** `DAY_START_HOUR` / `DAY_END_HOUR` (padrão **9** às **20**), com slots de `SLOT_DURATION_MINUTES` (30).
- **Almoço:** sem atendimento entre `LUNCH_START_*` e `LUNCH_END_*` (padrão **12h–13h**). Desligue com `LUNCH_BREAK_ENABLED=false`.

Datas em `GET /availability/...` usam o fuso `SCHEDULE_TIMEZONE`. Respostas podem incluir `closedToday` e `closedReason: "sunday"` quando o dia for domingo.

## Fluxo de negócio

1. Cliente **cadastra** (`POST /auth/register`) e autentica.
2. Sistema expõe **barbeiros** e **horários livres**: `GET /barbers`, `GET /availability/day?date=` e/ou `GET /availability/available-slots?barberId=&date=`.
3. Cliente **solicita** horário: `POST /appointments` → status **`pending`** → evento **`appointment.requested`** no RabbitMQ.
4. Barbeiro (app `mobile_provider` ou Postman) **lista** pedidos `GET /barber/appointments?status=pending` e **aceita** `PATCH /barber/appointments/:id/confirm` → **`confirmed`** → evento **`appointment.confirmed`**, ou **recusa** `PATCH /barber/appointments/:id/reject` → **`cancelled`** → evento **`appointment.rejected`**.
5. Cliente **vê** os próprios agendamentos: `GET /appointments` (atualização assíncrona por polling).

### Login dos barbeiros (seed)

| Barbeiro | E-mail | Senha (dev) |
|----------|--------|-------------|
| João Barbeiro | `joao.barbeiro@barbertime.seed` | `senha123` |
| Maria Barbeira | `maria.barbeira@barbertime.seed` | `senha123` |

Use `POST /api/v1/auth/login` com esse e-mail; o JWT terá `role: barber` e você poderá chamar `GET/PATCH /api/v1/barber/...` para confirmar agendamentos feitos com o `barberId` do João (`11111111-...`) ou da Maria (`22222222-...`).

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Saúde da API + status RabbitMQ |
| `POST` | `/api/v1/auth/register` | Cadastro de cliente + JWT |
| `POST` | `/api/v1/auth/login` | Login + JWT |
| `GET` | `/api/v1/barbers` | Lista barbeiros ativos (`id` para agendar) |
| `POST` | `/api/v1/barbers/register` | Cadastro de barbeiro (usuário + `barbers`) + JWT |
| `GET` | `/api/v1/availability/day?date=` | Dia + todos os barbeiros + slots livres |
| `GET` | `/api/v1/availability/available-slots?barberId=&date=` | Horários livres de um barbeiro (`date`: `YYYY-MM-DD`) |
| `POST` | `/api/v1/appointments` | Solicitar agendamento → **`pending`** + evento MOM (Bearer cliente) |
| `GET` | `/api/v1/appointments` | Meus agendamentos (Bearer) |
| `PATCH` | `/api/v1/appointments/:id/reschedule` | Remarcar (`pending` ou `confirmed`) |
| `PATCH` | `/api/v1/appointments/:id/cancel` | Cancelar (`pending` ou `confirmed`) |
| `GET` | `/api/v1/barber/appointments?status=` | Fila do barbeiro: `pending` (padrão), `confirmed`, `all` |
| `PATCH` | `/api/v1/barber/appointments/:id/confirm` | Aceita pedido → **`confirmed`** + evento MOM (Bearer barbeiro) |
| `PATCH` | `/api/v1/barber/appointments/:id/reject` | Recusa pedido → **`cancelled`** + evento MOM (Bearer barbeiro) |

Documentação de testes: `backend/postman/BarberTime.postman_collection.json`.

## Estrutura de pastas (módulos)

- `backend/src/config` — ambiente e pool PostgreSQL
- `backend/src/controllers` — adaptadores HTTP
- `backend/src/services` — regras de negócio
- `backend/src/repositories` — acesso a dados
- `backend/src/messaging` — RabbitMQ (produtor, eventos, consumidor)
- `backend/src/workers` — processos assíncronos (notification worker)
- `backend/src/domain` — regras puras (ex.: grade de horários)
- `backend/src/middlewares`, `backend/src/utils`, `backend/src/errors`, `backend/src/routes`
- `backend/database` — migração e seeds SQL
- `mobile_client` — app Flutter cliente (Sprint 3)
- `mobile_provider` — app Flutter prestador/barbeiro (Sprint 4)
- `docs` — documentação por sprint (PDF); índice em `docs/README.md`

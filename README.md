# BarberTime — API (Sprint 2)

Backend **Node.js + Express**, **PostgreSQL**, **JWT** e **RabbitMQ** (MOM) para o domínio de agendamento em barbearia.

## Pré-requisitos

- Node.js 18+
- PostgreSQL acessível via `DATABASE_URL`
- Docker (para RabbitMQ) ou instância AMQP compatível

## Configuração

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET` e `RABBITMQ_URL`.
2. Crie o banco vazio (ex.: `createdb barbertime`) e rode a migração:

```bash
npm install
npm run db:migrate
```

3. Suba o RabbitMQ:

```bash
docker compose up -d
```

4. Em **dois terminais**, inicie o worker (consumidor) e a API (produtor):

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
| `appointment.confirmed` | Barbeiro confirma (`PATCH /barber/appointments/:id/confirm`) | Cliente |

Documentação (PDF): [`docs/README.md`](docs/README.md)

- **Sprint 2:** `docs/sprint2/ENTREGA_SPRINT2.pdf`, `EVENTOS_MOM.pdf`, `RELATORIO_INTEGRACAO_MOM.pdf`

### Demonstração rápida

1. Worker rodando → crie um agendamento (Postman) → veja `[NOTIFICAÇÃO → BARBEIRO]` no terminal do worker.
2. Confirme como barbeiro → veja `[NOTIFICAÇÃO → CLIENTE]` no worker.
3. `GET /health` → `"rabbitmq": { "enabled": true, "connected": true }`.

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
4. Barbeiro (conta `POST /barbers/register`) **lista** pedidos `GET /barber/appointments?status=pending` e **confirma** `PATCH /barber/appointments/:id/confirm` → **`confirmed`** → evento **`appointment.confirmed`**.
5. Cliente **vê** os próprios agendamentos: `GET /appointments`.

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
| `PATCH` | `/api/v1/barber/appointments/:id/confirm` | Confirma pedido → **`confirmed`** + evento MOM (Bearer barbeiro) |

Documentação de testes: `postman/BarberTime.postman_collection.json`.

## Estrutura de pastas (módulos)

- `src/config` — ambiente e pool PostgreSQL
- `src/controllers` — adaptadores HTTP
- `src/services` — regras de negócio
- `src/repositories` — acesso a dados
- `src/messaging` — RabbitMQ (produtor, eventos, consumidor)
- `src/workers` — processos assíncronos (notification worker)
- `src/domain` — regras puras (ex.: grade de horários)
- `src/middlewares`, `src/utils`, `src/errors`, `src/routes`
- `docs` — documentação por sprint (PDF); índice em `docs/README.md`

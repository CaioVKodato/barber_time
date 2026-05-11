# BarberTime — API (Sprint 1)

Backend **Node.js + Express**, **PostgreSQL** e **JWT** para o domínio de agendamento em barbearia.

## Pré-requisitos

- Node.js 18+ (recomendado; ESM compatível com 16+ em muitos ambientes)
- PostgreSQL acessível via `DATABASE_URL`

## Configuração

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET`.  
2. Crie o banco vazio (ex.: `createdb barbertime`) e rode a migração:

```bash
npm install
npm run db:migrate
npm run dev
```

A API sobe em `http://localhost:3000` (ou `PORT`).

## Grade e expediente (`.env`)

Padrão alinhado à regra de negócio atual:

- **Domingo:** fechado (`CLOSED_ON_SUNDAY=true`).  
- **Expediente:** `DAY_START_HOUR` / `DAY_END_HOUR` (padrão **9** às **20**), com slots de `SLOT_DURATION_MINUTES` (30).  
- **Almoço:** sem atendimento entre `LUNCH_START_*` e `LUNCH_END_*` (padrão **12h–13h**). Desligue com `LUNCH_BREAK_ENABLED=false`.

Datas em `GET /availability/...` usam o fuso `SCHEDULE_TIMEZONE`. Respostas podem incluir `closedToday` e `closedReason: "sunday"` quando o dia for domingo.

## Fluxo de negócio (sem front)

1. Cliente **cadastra** (`POST /auth/register`) e autentica.  
2. Sistema expõe **barbeiros** e **horários livres**: `GET /barbers`, `GET /availability/day?date=` (todos os barbeiros num dia) e/ou `GET /availability/available-slots?barberId=&date=`.  
3. Cliente **solicita** horário: `POST /appointments` → status **`pending`** (ainda não oficial).  
4. Barbeiro (conta `POST /barbers/register`) **lista** pedidos `GET /barber/appointments?status=pending` e **confirma** `PATCH /barber/appointments/:id/confirm` → status **`confirmed`**.  
5. Cliente **vê** os próprios agendamentos: `GET /appointments` (`pending` / `confirmed` / etc.).

### Login dos barbeiros (seed)

| Barbeiro | E-mail | Senha (dev) |
|----------|--------|----------------|
| João Barbeiro | `joao.barbeiro@barbertime.seed` | `senha123` |
| Maria Barbeira | `maria.barbeira@barbertime.seed` | `senha123` |

Use `POST /api/v1/auth/login` com esse e-mail; o JWT terá `role: barber` e você poderá chamar `GET/PATCH /api/v1/barber/...` para confirmar agendamentos feitos com o `barberId` do João (`11111111-...`) ou da Maria (`22222222-...`).

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/auth/register` | Cadastro de cliente + JWT |
| `POST` | `/api/v1/auth/login` | Login + JWT |
| `GET` | `/api/v1/barbers` | Lista barbeiros ativos (`id` para agendar) |
| `POST` | `/api/v1/barbers/register` | Cadastro de barbeiro (usuário + `barbers`) + JWT |
| `GET` | `/api/v1/availability/day?date=` | Dia + todos os barbeiros + slots livres |
| `GET` | `/api/v1/availability/available-slots?barberId=&date=` | Horários livres de um barbeiro (`date`: `YYYY-MM-DD`) |
| `POST` | `/api/v1/appointments` | Solicitar agendamento → **`pending`** (Bearer cliente) |
| `GET` | `/api/v1/appointments` | Meus agendamentos (Bearer) |
| `PATCH` | `/api/v1/appointments/:id/reschedule` | Remarcar (`pending` ou `confirmed`) |
| `PATCH` | `/api/v1/appointments/:id/cancel` | Cancelar (`pending` ou `confirmed`) |
| `GET` | `/api/v1/barber/appointments?status=` | Fila do barbeiro: `pending` (padrão), `confirmed`, `all` |
| `PATCH` | `/api/v1/barber/appointments/:id/confirm` | Confirma pedido → **`confirmed`** (Bearer barbeiro) |

Documentação de testes: `postman/BarberTime.postman_collection.json`.

## Estrutura de pastas (módulos)

- `src/config` — ambiente e pool PostgreSQL  
- `src/controllers` — adaptadores HTTP  
- `src/services` — regras de negócio  
- `src/repositories` — acesso a dados  
- `src/domain` — regras puras (ex.: grade de horários)  
- `src/middlewares`, `src/utils`, `src/errors`, `src/routes`

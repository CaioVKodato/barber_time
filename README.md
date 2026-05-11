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

## Endpoints principais (Sprint 1)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/auth/register` | Cadastro de cliente + JWT |
| `POST` | `/api/v1/auth/login` | Login + JWT |
| `GET` | `/api/v1/availability/available-slots?barberId=&date=` | Lista horários livres (`date`: `YYYY-MM-DD`) |
| `POST` | `/api/v1/appointments` | Agendar (header `Authorization: Bearer <token>`) |

Documentação de testes: `postman/BarberTime.postman_collection.json`.

## Entregas acadêmicas

- Proposta de domínio: `docs/proposta-barbertime.md` (exportar para PDF)  
- Diagrama: `docs/diagrama-arquitetura.md` (Mermaid)  
- Schema: `docs/schema-postgresql.md` e `database/schema.sql`

## Estrutura de pastas (módulos)

- `src/config` — ambiente e pool PostgreSQL  
- `src/controllers` — adaptadores HTTP  
- `src/services` — regras de negócio  
- `src/repositories` — acesso a dados  
- `src/middlewares`, `src/utils`, `src/errors`, `src/routes`

# Documentação do schema PostgreSQL — BarberTime (Sprint 1)

Banco: **PostgreSQL**. Script de criação: `database/schema.sql`. Migração local: `npm run db:migrate` (requer `DATABASE_URL` no `.env`).

## Tabelas

### `users`

Armazena clientes (e extensível a outros papéis).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | PK, default `gen_random_uuid()` | Identificador do usuário |
| `email` | `TEXT` | `UNIQUE`, `NOT NULL` | Login; armazenado em minúsculas na aplicação |
| `password_hash` | `TEXT` | `NOT NULL` | Hash bcrypt da senha |
| `full_name` | `TEXT` | `NOT NULL` | Nome exibido |
| `role` | `TEXT` | `NOT NULL`, default `'client'`, check `client\|barber\|admin` | Papel do usuário |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Auditoria |

### `barbers`

Prestadores de serviço (barbeiros). Na Sprint 1 são **semeados** no script para facilitar testes.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | PK | Identificador |
| `full_name` | `TEXT` | `NOT NULL` | Nome do barbeiro |
| `active` | `BOOLEAN` | `NOT NULL`, default `true` | Permite desativar sem apagar histórico |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Auditoria |

### `appointments`

Agendamento de atendimento entre um **cliente** (`users`) e um **barbeiro** (`barbers`).

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | PK | Identificador |
| `client_id` | `UUID` | FK → `users(id)` ON DELETE CASCADE | Cliente dono do agendamento |
| `barber_id` | `UUID` | FK → `barbers(id)` ON DELETE RESTRICT | Barbeiro |
| `starts_at` | `TIMESTAMPTZ` | `NOT NULL` | Início do slot |
| `ends_at` | `TIMESTAMPTZ` | `NOT NULL` | Fim do slot (`> starts_at`) |
| `status` | `TEXT` | `NOT NULL`, check `scheduled\|cancelled\|completed` | Ciclo de vida |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` | Auditoria |

## Índices e regras de integridade

- **`appointments_barber_starts_unique`:** índice único parcial em `(barber_id, starts_at)` com `WHERE status <> 'cancelled'`, impedindo dois agendamentos ativos com o mesmo instante inicial para o mesmo barbeiro.  
- **`appointments_time_order`:** `CHECK (ends_at > starts_at)`.  
- Índices auxiliares: `appointments_client_id_idx`, `appointments_barber_time_idx` para consultas por cliente e por faixa de tempo.

## Dados iniciais (seed)

Dois barbeiros de exemplo, com UUIDs fixos (ver `schema.sql`), usados na coleção Postman.

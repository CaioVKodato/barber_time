# BarberTime — Sprint 1: Arquitetura e Backend REST

**Disciplina:** LDAMD — PUC Minas  
**Projeto:** BarberTime — agendamento em barbearia  
**Sprint:** 1 — Backend REST + persistência  

---

## 1. Domínio e perfis

| Perfil | Papel |
|--------|--------|
| **Cliente** | Solicita horário com barbeiro; remarca ou cancela seus agendamentos |
| **Barbeiro (prestador)** | Visualiza fila `pending` e confirma agendamentos |

Fluxo principal: cliente cria solicitação **`pending`** → barbeiro confirma → **`confirmed`**.

---

## 2. Stack técnica

| Camada | Tecnologia |
|--------|------------|
| API | Node.js 18+ / Express 4 |
| Persistência | PostgreSQL |
| Autenticação | JWT + bcrypt |
| Datas / grade | Luxon |
| Testes de API | Postman (`postman/BarberTime.postman_collection.json`) |

---

## 3. Modelo de dados (schema)

Arquivo: `database/schema.sql` (+ patches em `database/patches/`).

### Tabela `users`

- `id`, `email`, `password_hash`, `full_name`, `role` (`client` | `barber` | `admin`)

### Tabela `barbers`

- `id`, `full_name`, `active`, `user_id` → `users.id`

### Tabela `appointments`

- `id`, `client_id`, `barber_id`, `starts_at`, `ends_at`
- `status`: `pending`, `confirmed`, `cancelled`, `completed`
- Índice único parcial: `(barber_id, starts_at)` para status `pending` e `confirmed`

---

## 4. Endpoints REST (mínimo 4+)

Base: `http://localhost:3000/api/v1`

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cadastro cliente + JWT |
| `POST` | `/auth/login` | Login (cliente ou barbeiro) |
| `GET` | `/barbers` | Lista barbeiros ativos |
| `GET` | `/availability/available-slots` | Horários livres por barbeiro e data |
| `POST` | `/appointments` | Criar agendamento (`pending`) |
| `GET` | `/appointments` | Listar agendamentos do cliente |
| `PATCH` | `/appointments/:id/cancel` | Cancelar |
| `GET` | `/barber/appointments` | Fila do barbeiro |
| `PATCH` | `/barber/appointments/:id/confirm` | Confirmar → `confirmed` |

---

## 5. Regras de negócio (grade)

Configuradas via `.env`:

- Expediente padrão: **9h–20h**, slots de **30 min**
- **Domingo** fechado (`CLOSED_ON_SUNDAY`)
- **Almoço** 12h–13h sem atendimento
- `startsAt` deve ser início de slot válido (consultar `/availability/available-slots`)

---

## 6. Estrutura do código (Clean Architecture)

```
src/
  config/       — env, pool PostgreSQL
  controllers/  — HTTP
  services/     — regras de negócio
  repositories/ — SQL
  domain/       — schedulePolicy (grade pura)
  routes/       — rotas Express
  middlewares/  — auth, roles, erros
```

---

## 7. Como executar (Sprint 1)

```bash
npm install
cp .env.example .env   # ajustar DATABASE_URL
npm run db:migrate
npm run dev
```

Barbeiros seed: `joao.barbeiro@barbertime.seed` / `maria.barbeira@barbertime.seed` — senha `senha123`.

---

## 8. Entregas Sprint 1 (checklist)

| Entrega | Artefato |
|---------|----------|
| Proposta de domínio | `docs/sprint1/PropostaDominioBarberTime.pdf` |
| Diagrama de arquitetura | `docs/sprint1/DiagramaArquiteturaBarberTime.png` |
| Schema do banco | `docs/sprint1/schema-postgresql.pdf` |
| Backend REST funcional | `src/` + `README.md` |
| Coleção de testes | `postman/BarberTime.postman_collection.json` |

*Documentação MOM/RabbitMQ: `docs/sprint2/`.*

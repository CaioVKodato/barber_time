# BarberTime — Entrega Sprint 3 (App Flutter Cliente)

**Disciplina:** LDAMD — PUC Minas  
**Projeto:** BarberTime — agendamento em barbearia  
**Sprint:** 3 — Aplicativo móvel cliente + integração REST  
**Aluno:** Caio Kodato  
**Data:** Maio/2026  

---

## 1. Objetivo da sprint

Desenvolver o **aplicativo Flutter do cliente** integrado à API REST da Sprint 1, com **atualização assíncrona de estado** quando o barbeiro confirma um agendamento (implementado via **polling** periódico).

---

## 2. Critérios atendidos

| Critério | Atendido | Evidência |
|----------|----------|-----------|
| App Flutter executável no repositório | Sim | `mobile_client/` |
| Mínimo 3 telas (lista, detalhe, ação) | Sim | Lista, detalhe, agendar + login |
| Integração REST com backend | Sim | JWT, appointments, barbers, availability |
| Atualização assíncrona de status | Sim | Polling 10 s em `AppState` |
| Documentação Clean Architecture | Sim | `ARQUITETURA_MOBILE.md` |
| Backend acessível ao dispositivo | Sim | CORS + `0.0.0.0` em `src/server.js` |

---

## 3. Telas do aplicativo

| Tela | Função | Endpoints |
|------|--------|-----------|
| Login / Cadastro | Autenticação cliente | `POST /auth/login`, `/register` |
| Lista de agendamentos | Home com pull-to-refresh + polling | `GET /appointments` |
| Detalhe | Status e cancelamento | `PATCH /appointments/:id/cancel` |
| Novo agendamento | Escolha barbeiro, data e slot | `GET /barbers`, `GET /availability/available-slots`, `POST /appointments` |

---

## 4. Atualização assíncrona (polling)

Quando o cliente solicita um horário, o status fica **`pending`**. O barbeiro confirma pela API (`PATCH /barber/appointments/:id/confirm`) — evento assíncrono via RabbitMQ na Sprint 2.

O app **não** consome RabbitMQ diretamente; usa **polling** a cada 10 segundos (`AppConfig.pollingIntervalSeconds`) chamando `GET /appointments`. Quando o status muda para **`confirmed`**, a UI reflete automaticamente (Provider + `notifyListeners`).

Alternativas aceitas pelo enunciado: WebSocket ou consumo MOM — polling foi escolhido por simplicidade e compatibilidade com o backend REST existente.

---

## 5. Como executar a demonstração

```powershell
# Terminal 1 — infra + worker (opcional para notificações)
docker compose up -d
npm run worker:notifications

# Terminal 2 — API
npm run dev

# Terminal 3 — app
cd mobile_client
flutter pub get
flutter run
```

**Roteiro:**

1. Cadastre/login como cliente no app.
2. Agende horário com João ou Maria (barbeiros seed).
3. No Postman, login barbeiro → confirme o agendamento.
4. Observe o ícone de sync na AppBar e a mudança de status em até 10 s.

---

## 6. Estrutura de código

Ver [`ARQUITETURA_MOBILE.md`](ARQUITETURA_MOBILE.md) e [`mobile_client/README.md`](../../mobile_client/README.md).

---

## 7. Dependências Flutter

- `http` — cliente REST
- `provider` — estado global (`AppState`)
- `shared_preferences` — token JWT e URL da API
- `intl` — formatação de datas (pt_BR)

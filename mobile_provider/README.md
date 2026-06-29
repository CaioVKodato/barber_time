# BarberTime Prestador — App Flutter (Sprint 4)

Aplicativo do **prestador (barbeiro)** do BarberTime: login, fila de solicitações pendentes, aceitar/recusar com detalhe, acompanhamento dos atendimentos confirmados e **notificação assíncrona por polling** (8 s) quando o cliente cria uma nova solicitação (evento `appointment.requested` publicado no MOM).

## Pré-requisitos

- Flutter 3.x (`flutter doctor`)
- Backend BarberTime rodando (`npm run dev` em `backend/`) + worker (`npm run worker:notifications`)
- PostgreSQL + RabbitMQ conforme README principal

## Executar

```bash
cd mobile_provider
flutter pub get
flutter run
```

### URL da API

| Ambiente | URL padrão |
|----------|------------|
| Emulador Android | `http://10.0.2.2:3000` |
| Windows / Web / iOS simulador | `http://localhost:3000` |
| Celular físico na mesma rede | `http://<IP-do-PC>:3000` |

Altere em **Login → Configurações avançadas** se necessário. O backend escuta em `0.0.0.0:3000` (CORS habilitado).

### Login do barbeiro (seed de desenvolvimento)

| Barbeiro | E-mail | Senha |
|----------|--------|-------|
| João Barbeiro | `joao.barbeiro@barbertime.seed` | `senha123` |
| Maria Barbeira | `maria.barbeira@barbertime.seed` | `senha123` |

> O app **só** aceita contas com `role: barber`. Logins de cliente são recusados com uma mensagem explicativa.

## Telas

1. **Login** — autenticação JWT (`POST /api/v1/auth/login`); valida o papel `barber`.
2. **Solicitações** — fila de pedidos `pending` (`GET /api/v1/barber/appointments?status=all`), com **badge** de quantidade, **polling** automático e *banner* de novas solicitações.
3. **Detalhe da solicitação** — dados do cliente e horário; botões **Aceitar** (`PATCH .../confirm`) e **Recusar** (`PATCH .../reject`).
4. **Em andamento** — atendimentos confirmados que ainda vão acontecer.
5. **Histórico** — atendimentos passados (concluídos/expirados) e recusas/cancelamentos.

## Arquitetura (Clean Architecture simplificada)

```
lib/
├── config/           # URL da API, intervalo de polling
├── core/             # tema, fuso horário, exceções
├── models/           # entidades (User, AuthResult, BarberAppointment)
├── data/
│   ├── api/          # ApiClient HTTP
│   └── repositories/ # adaptadores REST (auth, fila do barbeiro)
└── presentation/
    ├── providers/    # AppState (Provider) — sessão, polling, detecção de novas solicitações
    ├── screens/      # UI (login, home_shell, lista, detalhe)
    └── widgets/      # RequestCard, StatusBadge, BrandLogo
```

Fluxo: **UI → AppState → Repository → ApiClient → API REST**.

## Notificação assíncrona ao prestador

Não há ação manual: a fila é recarregada a cada **8 segundos**. Quando o `AppState` percebe IDs `pending` que ainda não conhecia (solicitações que chegaram via `POST /appointments` → evento `appointment.requested` no RabbitMQ), ele:

1. atualiza a lista e o **badge** numérico da aba *Solicitações*;
2. dispara um **SnackBar** ("Nova solicitação de …") com atalho para a aba.

## Demonstração (fluxo de ponta a ponta)

1. Suba API + worker + RabbitMQ; rode os dois apps (`mobile_client` e `mobile_provider`).
2. **Cliente** agenda um horário → status `pending` → backend publica `appointment.requested`.
3. **Prestador** recebe o aviso automático (≤ 8 s), abre o detalhe e **Aceita**.
4. Backend publica `appointment.confirmed` → **cliente** vê **Confirmado** (≤ 10 s).
5. Alternativa: prestador **Recusa** → backend publica `appointment.rejected` → cliente vê o horário liberado/cancelado.

Documentação de entrega: [`docs/sprint4/`](../docs/sprint4/).

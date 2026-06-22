# BarberTime Client — App Flutter (Sprint 3)

Aplicativo **cliente** do BarberTime: login, listagem de agendamentos, detalhe, solicitação de horário e **atualização assíncrona por polling** (10 s) quando o barbeiro confirma no backend.

## Pré-requisitos

- Flutter 3.x (`flutter doctor`)
- Backend BarberTime rodando (`npm run dev` na raiz do repositório)
- PostgreSQL + RabbitMQ conforme README principal

## Executar

```bash
cd mobile_client
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

## Telas

1. **Login / Cadastro** — autenticação JWT (`POST /api/v1/auth/login` e `/register`)
2. **Lista** — `GET /api/v1/appointments` com refresh manual (pull) e **polling** automático
3. **Detalhe** — status, cancelamento (`PATCH .../cancel`)
4. **Agendar** — barbeiros, data, slots livres (`GET /availability/available-slots`), `POST /appointments`

## Arquitetura (Clean Architecture simplificada)

```
lib/
├── config/           # URLs, intervalo de polling
├── core/             # tema, exceções
├── models/           # entidades (User, Appointment, Barber…)
├── data/
│   ├── api/          # ApiClient HTTP
│   └── repositories/ # adaptadores REST
└── presentation/
    ├── providers/    # AppState (Provider)
    ├── screens/      # UI
    └── widgets/
```

Fluxo: **UI → AppState → Repository → ApiClient → API REST**.

## Demonstração (polling)

1. Suba API + worker + app Flutter; faça login como **cliente** (cadastre-se se precisar).
2. Agende um horário válido (seg–sáb, :00 ou :30, fora do almoço).
3. Confirme o mesmo agendamento via Postman como barbeiro (`PATCH /api/v1/barber/appointments/:id/confirm`).
4. Em até **10 segundos** o status na lista/detalhe muda para **Confirmado** sem reabrir o app.

Documentação de entrega: [`docs/sprint3/`](../docs/sprint3/).

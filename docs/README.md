# Documentação BarberTime (LDAMD)

Documentação de entrega organizada por sprint. Artefatos oficiais em **PDF** (e imagens onde aplicável).

## Sprint 1 — Arquitetura e Backend REST

| Documento | Descrição |
|-----------|-----------|
| [PropostaDominioBarberTime.pdf](sprint1/PropostaDominioBarberTime.pdf) | Proposta de domínio |
| [DiagramaArquiteturaBarberTime.png](sprint1/DiagramaArquiteturaBarberTime.png) | Diagrama de arquitetura |
| [schema-postgresql.pdf](sprint1/schema-postgresql.pdf) | Schema do banco PostgreSQL |
| [BACKEND_REST.pdf](sprint1/BACKEND_REST.pdf) | Endpoints REST, regras de negócio, estrutura do código |

**Código:** `src/` (API REST), `database/schema.sql`, `postman/BarberTime.postman_collection.json`

## Sprint 2 — Integração MOM (RabbitMQ)

| Documento | Descrição |
|-----------|-----------|
| [ENTREGA_SPRINT2.pdf](sprint2/ENTREGA_SPRINT2.pdf) | Entrega completa: critérios, evidências (prints), fluxo |
| [EVENTOS_MOM.pdf](sprint2/EVENTOS_MOM.pdf) | Tabela de eventos, filas, routing keys, payloads JSON |
| [RELATORIO_INTEGRACAO_MOM.pdf](sprint2/RELATORIO_INTEGRACAO_MOM.pdf) | Relatório de integração (1 página) |

**Imagens:** [sprint2/imagens/](sprint2/imagens/) — prints da demonstração (cópia de trabalho também em `docs-src/sprint2/imagens/` para gerar o PDF)

**Código:** `src/messaging/`, `src/workers/`, `docker-compose.yml`

## Regenerar PDFs

Fontes Markdown em **`docs-src/sprint2/`** (tema visual: `pdf-theme.css`). Saída em **`docs/sprint2/`**:

```bash
npm run docs:pdf:sprint2
```

Todos os documentos (incl. Sprint 1): `npm run docs:pdf`

## Sprint 3 — App Flutter Cliente

| Documento | Descrição |
|-----------|-----------|
| [ENTREGA_SPRINT3.md](sprint3/ENTREGA_SPRINT3.md) | Entrega: critérios, telas, demonstração |
| [ARQUITETURA_MOBILE.md](sprint3/ARQUITETURA_MOBILE.md) | Clean Architecture, diagramas, fluxos |

**Código:** `mobile_client/` (Flutter)

## Sprints futuras

- **Sprint 4:** App Flutter prestador + entrega final → `docs/sprint4/`

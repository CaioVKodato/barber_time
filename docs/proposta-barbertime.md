# Proposta de Domínio — BarberTime

**Disciplina:** Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas (LDAMD) — PUC Minas  
**Projeto:** sistema distribuído com app móvel cliente, app prestador, backend REST, MOM e nuvem (conforme ementa).  
**Sprint 1:** definição de domínio, arquitetura e backend REST inicial.

## Domínio escolhido

Plataforma de **agendamento de cortes de cabelo em barbearia**. O cliente consulta horários livres, escolhe barbeiro e data, e confirma o agendamento. O prestador (barbeiro) visualiza a agenda e, nas próximas sprints, recebe eventos assíncronos (ex.: novo agendamento) via middleware orientado a mensagens, alinhado à arquitetura orientada a eventos exigida na disciplina.

## Justificativa

O problema é recorrente no dia a dia: conflito de horários, filas e comunicação informal (mensagens) entre cliente e barbearia. Um sistema centralizado com **grade de atendimento**, **cadastro de clientes** e **controle de sobreposição** reduz erros operacionais e prepara o terreno para notificações ao prestador e confirmações automáticas — requisitos naturais para um projeto que evoluirá com MOM e aplicativos Flutter.

## Perfis de usuário

| Perfil | Responsabilidade principal |
|--------|----------------------------|
| **Cliente** | Cadastro e login, consulta de disponibilidade, criação de agendamentos. |
| **Prestador (barbeiro)** | Nesta sprint, representado por cadastro fixo no banco; nas sprints seguintes, app Flutter para aceitar/recusar demandas e acompanhar status, integrado a eventos. |

## Funcionalidades principais (visão do produto)

1. Autenticação do cliente com **JWT** (cadastro e login).  
2. **Catálogo de horários livres** por barbeiro e dia (grade configurável).  
3. **Agendamento** com validação de conflito (não permitir dois atendimentos no mesmo intervalo para o mesmo barbeiro).  
4. (Sprints futuras) Publicação de eventos no MOM; apps Flutter cliente e prestador; encerramento com demonstração em nuvem.

## Regra de negócio destacada (agendamento)

O sistema só confirma horário **livre** na grade do barbeiro: há verificação de **sobreposição** com outros agendamentos ativos e índice único no banco para evitar corrida entre duas requisições. Assim, o cliente **não consegue reservar um intervalo já ocupado** (interpretação usual quando se exige consistência da agenda).

---

*Este arquivo pode ser convertido em PDF (1–2 páginas) com Word, Google Docs ou Pandoc, ajustando margens e fonte (ex.: Arial 11).*

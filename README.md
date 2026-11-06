# test-manager-library-3239188-app

> **Prueba técnica · Ficha ADSO 3239188**
> Horario: **jueves 5 de noviembre de 2026, de 7:00 p. m. a 11:00 p. m.** (hora Colombia). Entrega a las **11:00 p. m.**

Este repositorio es el **frontend** de *Manager Library*, en **React**. **Empieza vacío a propósito**: se construye en el fork de cada aprendiz.

## Instrucciones

Cada aprendiz debe **crear el fork** de los seis repositorios del proyecto y **resolver el proyecto
con el spec planteado**.

1. Hacer fork, a su cuenta de GitHub, de cada repositorio de la tabla del final.
2. Leer el spec en [`test-manager-library-3239188-docs`](https://github.com/code-sena/test-manager-library-3239188-docs).
   Se entrega en dos versiones: `spec-python/` y `spec-.net/`.
3. Desarrollar en los forks.

## El reto se desarrolla con React y PHP (Laravel)

El spec está escrito para Python y para .NET, pero el reto **no** se hace en esos lenguajes:

| Capa | Tecnología del reto |
|---|---|
| Frontend | React |
| Backend | PHP con Laravel |

Lo que el spec define sobre el negocio —historias, criterios de aceptación, reglas, contrato de la
API, modelo de datos— se respeta. Lo que define sobre la tecnología se traduce a React y Laravel.

## La prueba no consiste en escribir el código

El propósito principal es ver la **capacidad de desempeño con SDD** (*Spec-Driven Development*,
desarrollo guiado por especificación): cómo se lee, se interpreta y se aplica una especificación
para llevarla a un stack distinto. El código es el medio, no el fin.

## Entrega

Cuenta lo que quede **subido a los forks antes de las 11:00 p. m.** Lo que llegue después no se revisa.
No hay prórroga: suban avances parciales con commits pequeños durante la prueba.

## Los seis repositorios

| Repositorio | Qué va ahí |
|---|---|
| [`test-manager-library-3239188-docs`](https://github.com/code-sena/test-manager-library-3239188-docs) | El spec: `spec-python/` y `spec-.net/` |
| [`test-manager-library-3239188-api`](https://github.com/code-sena/test-manager-library-3239188-api) | Backend en PHP (Laravel) |
| [`test-manager-library-3239188-app`](https://github.com/code-sena/test-manager-library-3239188-app) | Frontend en React |
| [`test-manager-library-3239188-page`](https://github.com/code-sena/test-manager-library-3239188-page) | Sitio público estático de presentación |
| [`test-manager-library-3239188-infra`](https://github.com/code-sena/test-manager-library-3239188-infra) | Contenedores, red, volúmenes y motor de base de datos vacío |
| [`test-manager-library-3239188-tool`](https://github.com/code-sena/test-manager-library-3239188-tool) | Utilidades: sembrador de datos de demostración |

---

## Running the app (React + Vite)

Node is not needed on the host; everything runs in a `node:22-alpine` container.

```bash
cp .env.example .env          # set VITE_API_URL if the API is not on http://localhost:8000/api/v1
docker compose up             # dev server on http://localhost:5173
docker compose run --rm app npm test
docker compose run --rm app npm run build
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Base URL of the API (`api-contract.md` §1) |

### Structure

- `src/api/client.js` - fetch wrapper: Bearer token, single error body (`code`, `message`, `details`) as `ApiError`; a 401 ends the session.
- `src/auth/` - session (token, role, expiry) kept in `localStorage`, route guard by role.
- `src/navigation.js` - menu entries and the roles allowed to see them (`admin`, `librarian`).
- `src/pages/` - one page per user story.

UI text is in English; error messages come from the API in Spanish and are shown as sent.

### Screens

| Screen | Route | Roles | Story |
|---|---|---|---|
| Login | `/login` | public | HU-01 |
| Books: search, category filter, pagination; create / edit / delete | `/books` | admin, librarian (write: admin) | HU-03, HU-04 |
| Members: list, search, create | `/members` | admin, librarian | HU-05 |
| New loan: one member, 1 to 3 books | `/loans/new` | admin, librarian | HU-06 |
| Loans: filters by date, status, member; return one line at a time | `/loans` | admin, librarian | HU-07, HU-08 |
| Overdue books, most days late first; return from the list | `/overdue` | admin, librarian | HU-09 |
| Most-borrowed report by date range | `/reports/most-borrowed` | admin | HU-10 |

### Testing without the real API (mock)

`mock/server.mjs` is an in-memory mock of `api-contract.md` (shapes, status codes, error codes) used to build the UI before
the API was ready. It is **not** a reference implementation.

```bash
docker compose --profile mock up mock      # http://localhost:8100/api/v1
# run the app against it: set VITE_API_URL=http://localhost:8100/api/v1 in .env, then docker compose up app
```

Mock users: `admin` / `admin123` (admin) and `ana` / `ana123` (librarian). Seed data includes overdue loans, a book with one copy
(«El principito») and a book with open loans («Cien años de soledad»), so every error code of the contract can be triggered.

### Status and pending work (2026-11-05)

Checked:
- `npm test`: 9 unit tests (API client: Bearer token, single error body, 401 handling; role-aware menu).
- `npm run build` passes.
- Every screen's API calls were exercised with curl against the mock, including `DUPLICATE_BOOK_IN_LOAN`, `MEMBER_HAS_OVERDUE`,
  `BOOK_NOT_AVAILABLE`, `ITEM_ALREADY_RETURNED`, `INVALID_DATE_RANGE`, `FORBIDDEN_ROLE`.
- Real API (`http://localhost:8000/api/v1`): login, `GET /categories`, `GET /books`, the `VALIDATION_ERROR` body of `POST /books`
  and CORS for `http://localhost:5173` answer as the app expects.

Pending:
- The real API does not serve members, loans, overdue or the report yet (404). Those screens were only tested against the mock.
- No click-through test in a browser was recorded; the UI was checked by build, unit tests and API calls only.
- Book covers (`PUT/DELETE/GET /books/{id}/cover`) are not in the UI.
- Creating librarians (`POST /users`, HU-02) has no screen.
- The loan list shows the member name by calling `GET /members/{id}` once per member, because the contract's loan body only has
  `member_id`.
- No component tests (only unit tests for the client and the menu).

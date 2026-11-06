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

# Smart10

Adaptación web/mobile del juego de mesa **Smart10** (SD Games). Multijugador
_pass-and-play_ en un solo dispositivo compartido, sin backend: es un sitio
estático servido por Firebase Hosting.

- **Código** en inglés; **interfaz** en español (todos los textos viven en
  `src/i18n/strings.ts`).
- React 19 + Vite + TypeScript + Tailwind CSS 4, con Vitest para las pruebas.

## Cómo se juega

Cada carta tiene una pregunta y **10 respuestas**: algunas correctas, otras
trampa. En tu turno podés:

- **Tocar una opción**: si es correcta sumás 1 punto _pendiente_ y el turno
  pasa al siguiente jugador; si es incorrecta perdés todos los puntos
  pendientes de la ronda y quedás afuera.
- **¡Me planto!**: guardás (bancás) tus puntos pendientes en tu puntaje
  permanente y quedás afuera de la ronda.

La ronda termina cuando todos los jugadores quedaron afuera (se plantaron o
fallaron) o cuando se destaparon las 10 opciones. Nadie sabe cuántas
respuestas correctas quedan, así que la decisión de plantarse o arriesgar
otra es parte del juego: recién al terminar la ronda se revelan todas las
respuestas. Gana quien primero llega al puntaje objetivo (10, 15 o 20; por
defecto 15) al finalizar una ronda. Si hay empate en la cima, se juega una
carta de desempate.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # pruebas (lógica de juego + integridad del dataset)
npm run lint     # ESLint
npm run build    # type-check + build de producción a dist/
```

## Datos

Las cartas están en `data/dataset.json` (contenido en español). El esquema y
los tipos están en `data/types.ts`; `data/dataset.test.ts` valida que cada
carta tenga exactamente 10 opciones, al menos una correcta y una incorrecta, e
ids únicos. Para agregar preguntas, sumá objetos al arreglo `cards`.

## Arquitectura

- `src/game/logic.ts` — reducer puro con toda la máquina de estados (turnos,
  rondas, puntajes, detección de ganador). Testeado en `logic.test.ts`.
- `src/game/deck.ts` — mezcla (Fisher-Yates, con rng inyectable para tests) y
  acceso a las cartas.
- `src/screens/` — pantallas de setup, juego y resultados.
- `src/components/` — peg de opción, tabla de puntajes, banner de turno y
  overlay de traspaso del dispositivo.

## Despliegue (Firebase Hosting)

1. El id del proyecto está configurado en `.firebaserc` como `smart10-cb385`.
2. Autenticá si hace falta: `npx -y firebase-tools@latest login`.
3. Compilá y desplegá:

```bash
npm run build
npx -y firebase-tools@latest deploy --only hosting
```


`firebase.json` sirve `dist/` con reescritura SPA a `/index.html`.

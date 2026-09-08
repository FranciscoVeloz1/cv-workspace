# q04: ¿Qué indicadores, gauges y mensajes muestra el cuadro, y de qué sensores o ECUs suelen alimentarse esos datos?

**Status:** researched — pending validation
**Source types to prioritize:** Manual del propietario, descripciones IPC/BCM GM, arquitectura de red

## Findings

El manual del propietario Cavalier 2020 (ciclo PATAC México/Sudamérica, mismo 1.5 L que el 2021) lista el contenido del grupo de instrumentos. Medidores: velocímetro (km/h o mph), odómetro, odómetro de viaje, tacómetro (rpm; en Auto Stop apunta a AUTO STOP con el motor apagado), indicador de combustible (con flecha del lado del tapón) e indicador de temperatura del refrigerante [S1][S2]. El DIC básico, con el vástago inferior derecho, muestra odómetro total, Viaje A/B con economía promedio, rango de combustible y velocidad promedio [S3]. El DIC superior añade menú TRIP/fuel vía SET/CLR, banda y MENU en la palanca de direccionales, más menús de vehículo y mensajes [S4].

Luces de advertencia e indicadores enumerados en el índice del mismo manual [S5]: recordatorio de cinturón; disponibilidad de bolsa de aire; sistema de carga; indicador de falla (Revise el motor / OBD de emisiones); aviso de servicio inmediato; frenos; ABS; luz de cambio (si está equipado); dirección hidráulica (asistida); tracción apagada; StabiliTrak Off; TCS/StabiliTrak; temperatura de refrigerante; presión de llantas (TPMS); presión de aceite; modo de ahorro de combustible; combustible bajo; modo parada automática; seguridad (inmovilizador); luces altas; antiniebla trasera; aviso de luces encendidas; puerta entreabierta. El texto de cada luz confirma el significado (p. ej. MIL como parte del diagnóstico de emisiones a bordo; ABS vs frenos convencionales; TPMS fijo = baja presión, parpadeo luego fijo = falla del sistema; aceite = flujo/presión inadecuada) [S6][S7][S8][S9].

El cuadro **no es el sensor**. El manual describe qué se muestra, no el cableado. La arquitectura GM documentada en SI: el BCM es gateway; los datos de tren motriz viven en HS-GMLAN (ECM, TCM, EBCM) y el IPC, cuando está en LS-GMLAN, recibe traducciones [S10]. El diagrama Cruze 2011 (análogo de plataforma) es más explícito: el cluster tiene lógica interna, bus Lo spd GMLAN, y además líneas discretas (Check Engine indicator control, high beam, ambient air temperature sensor). El nivel de combustible, interruptor de freno de estacionamiento, fluidos de freno, oil pressure switch y latches de puertas aparecen en el segundo folio del diagrama ligados a BCM / ECM / EBCM, no como sensores cableados uno a uno al IPC [S11]. Inferencia acotada: la mayoría de agujas y testigos del Cavalier 2020/21 se alimentan de **mensajes de red** (y unos pocos discretos), originados en módulos y sensores así:

| Dato en el cuadro (manual 2020) | Origen típico GM / Cruze 2011 (no pinout Cavalier) |
|---|---|
| Velocidad | ECM / ABS (sensores de rueda) vía serial data [S10][S11] |
| rpm / Auto Stop | ECM [S1][S10] |
| Combustible | sensor de nivel en tanque → módulo (ECM/BCM) [S2][S11] |
| Temperatura refrigerante | sensor ECT en motor → ECM [S2][S10] |
| MIL | ECM, sistema de emisiones OBD [S6] |
| ABS / TCS / StabiliTrak | EBCM + sensores de rueda / yaw según equipo [S7][S8] |
| Airbag | SDM / módulo de bolsas; el manual menciona sensor de golpes y módulo de diagnóstico [S6] |
| Cinturón | interruptores de hebilla [S5] |
| Carga | circuito de alternador / BCM [S6] |
| Aceite | interruptor o sensor de presión de aceite [S9][S11] |
| TPMS | sistema de monitoreo; luz combinada de baja presión y falla [S8][S12] |
| Puertas | latches / interruptores de puerta [S3][S11] |
| Dirección asistida | módulo EPS (el vehículo tiene dirección electroasistida en fichas) [S13] |
| Inmovilizador / seguridad | sistema de inmovilizador del manual de llaves [S5] |

El DIC calcula economía, rango y promedios a partir de combustible y distancia; el rango «no se puede reiniciar» y se basa en economía reciente y combustible restante [S4]. Eso es software del cluster o del BCM, no un sensor extra.

## Sources

[S1] Cavalier 2020 owner manual, velocímetro/tacómetro p. 68 — ManualsLib (primary OEM). https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=69. Accessed 2026-09-08.
[S2] Cavalier 2020 owner manual, combustible y temperatura p. 69 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=70. Accessed 2026-09-08.
[S3] Cavalier 2020 owner manual, DIC básico p. 79 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=80. Accessed 2026-09-08.
[S4] Cavalier 2020 owner manual, DIC superior p. 80 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=81. Accessed 2026-09-08.
[S5] Cavalier 2020 owner manual, índice Instrumentos y Controles p. 61 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=62. Accessed 2026-09-08.
[S6] Cavalier 2020 owner manual, airbag, carga, MIL p. 71 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=72. Accessed 2026-09-08.
[S7] Cavalier 2020 owner manual, ABS p. 74 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=75. Accessed 2026-09-08.
[S8] Cavalier 2020 owner manual, TCS/StabiliTrak, temp, TPMS p. 75–76 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=76 and https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=77. Accessed 2026-09-08.
[S9] Cavalier 2020 owner manual, aceite, eco, combustible bajo p. 77 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=78. Accessed 2026-09-08.
[S10] GM Data Communications SI (Volt) — tis-volt.by (secondary OEM reproduction). https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.
[S11] Chevrolet Cruze LT 2011 cluster wiring diagrams — portal-diagnostov.com (secondary OEM reproduction). https://portal-diagnostov.com/en/2020/05/01/instrument-cluster-chevrolet-cruze-lt-2011-system-wiring-diagrams/. Accessed 2026-09-08.
[S12] Cavalier 2020 owner manual, TPMS p. 184 — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=185. Accessed 2026-09-08.
[S13] Ficha Cavalier LT — Chevrolet El Salvador (primary). https://chevrolet.com.sv/wp-content/uploads/2019/10/Ficha-Tecnica-Cavalier-LT-1.pdf. Accessed 2026-09-08.

## Open gaps / uncertainty

- Mapa sensor → CAN ID → IPC del Cavalier 2021: no publicado.
- Cuáles testigos son hard-wired vs serial en el K216: desconocido; el Cruze 2011 mezcla ambos.
- TPMS 2020: el manual confirma el sistema y la luz; la página recuperada no llegó a la frase de «sensores montados en las ruedas» (sí aparece en el manual 2019 PATAC indexado en ManualsLib, no re-citada aquí por no abrir esa página).
- Equipamiento LT vs LS vs Premier puede omitir DIC superior, antiniebla trasera o luz de cambio.
- El Cavalier Turbo 2022 (Monza) tiene otro cluster; no mezclar listas.

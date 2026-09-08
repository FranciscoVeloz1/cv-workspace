# q03: ¿Qué protocolo(s) usa el cuadro (GMLAN HS/MS/LS-CAN, LIN, otros) y a qué velocidad?

**Status:** researched — pending validation
**Source types to prioritize:** Arquitectura eléctrica GM/GEM publicada, normas SAE/ISO, service info accesible

## Findings

GM nombra su familia CAN vehicular **GMLAN**. El documento corporativo GMW3101 («General Requirements GMLAN») describe tres buses basados en CAN: High Speed (datos en tiempo real: par, ángulo de dirección, etc.), Mid Speed (infotenimiento / actualizaciones gráficas) y Low Speed (funciones de operador con tiempo de respuesta ~100 ms) [S1]. Un artículo técnico de Arizona State University sobre la tarjeta VBI de GM concreta velocidades físicas: high-speed dual-wire a **500 kbit/s**; low-speed single-wire a **33,33 kbit/s**; el nodo gateway une ambos buses [S2].

La información de servicio GM (Volt, texto corporativo de Data Communications) coincide y añade detalle eléctrico [S3]:

- High Speed GMLAN: par trenzado GMLAN-High / GMLAN-Low, resistencias de terminación 120 Ω en cada extremo, **500 kbit/s**, recesivo ≈ 2,5 V en ambas líneas, dominante ≈ 3,5 V / 1,5 V.
- Low Speed GMLAN: **un solo hilo** referenciado a chasis, **33,3 kbit/s** en carretera, modo de programación **83,3 kbit/s**, **sin** resistencias de terminación en los extremos; recesivo ≈ 0,2 V, dominante ≈ 4,0 V o más.
- LIN: un hilo, **10,417 kbit/s**, recesivo ≈ Vbatt, dominante ≈ 0 V; el BCM actúa de maestro frente a dispositivos «smart».
- El BCM está cableado a HS-GMLAN, LS-GMLAN y varios LIN y **funciona como gateway** entre ellos [S3].

La capa física de alta velocidad es ISO 11898-2 (CAN diferencial de dos hilos, hasta 1 Mbit/s, terminación 120 Ω) [S4]. El CAN de un hilo de GM se alinea con SAE J2411 (Single Wire CAN) [S5]. El transceptor onsemi NCV7356 se declara conforme a J2411 y a la especificación GM GMW3089; bit rate típico de comunicación normal **33 kbit/s**, modo de descarga de servicio **83 kbit/s** [S6].

¿Dónde está el IPC del Cavalier 2021? **No hay esquema de data communication de ese VIN recuperado.** El Cruze LT 2011 (plataforma que Wikipedia asocia al Cavalier IV) pone el instrument cluster en **Lo spd gmlan serial data** [S7]. Un índice de materiales de taller de la 科沃兹 2018 (mismo nombre chino / motor L2B) lista capítulos de «datos de comunicación» que incluyen LIN, bus de expansión de chasis, DLC y **«高速GMLAN(L2B)»** (GMLAN de alta velocidad, variante L2B) [S8]. Eso demuestra que el vehículo L2B **tiene** HS-GMLAN; no demuestra que el cuadro viva en ese bus. El Sail 2018, compacto PATAC, documenta el cluster en High Speed GMLAN de dos hilos [S9].

Diagnóstico OBD en DLC: ISO 15765-4 sobre CAN, pines 6 y 14, 250 o 500 kbit/s [S10]. En GM, el scan tool habla HS-GMLAN por 6/14 y LS-GMLAN por el pin 1 cuando existe [S3][S10]. Eso permite leer módulos de tren motriz sin estar en el conector del cuadro.

Conclusión provisional: el ecosistema eléctrico es GMLAN (CAN) + LIN con BCM como traductor. El cuadro, en GM de esa era, **suele** ser nodo de Low Speed GMLAN; compactos China posteriores **pueden** haberlo pasado a HS-GMLAN. La velocidad a configurar en un sniff del IPC no está publicada para el K216.

## Sources

[S1] GMW3101 "General Requirements GMLAN" — General Motors Worldwide (primary standard, description from catalog page). https://standardsupdate.com/en/gmw/gmw-gmw3101_2618222.html. Accessed 2026-09-08.
[S2] "Vehicle-Bus Interface" / VBI_CAN.pdf — Arizona State University course notes describing GMLAN (secondary academic). https://www.public.asu.edu/~pheanis/documents/VBI_CAN.pdf. Accessed 2026-09-08.
[S3] "Data Communications - Description and Operation" — GM SI Chevrolet Volt (secondary reproduction of OEM). https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.
[S4] "CAN bus" — Wikipedia (secondary), ISO 11898-1/2/3. https://en.wikipedia.org/wiki/CAN_bus. Accessed 2026-09-08.
[S5] SAE J2411 "Single Wire Can Network for Vehicle Applications" — SAE International (primary standard abstract). https://www.sae.org/standards/content/j2411. Accessed 2026-09-08.
[S6] NCV7356 product page — onsemi (primary datasheet marketing). https://www.onsemi.com/products/interfaces/wired-transceivers-modems/ncv7356. Accessed 2026-09-08. Also Digi-Key hosted datasheet PDF. https://media.digikey.com/pdf/Data%20Sheets/ON%20Semiconductor%20PDFs/NCV7356.pdf. Accessed 2026-09-08.
[S7] Chevrolet Cruze LT 2011 instrument cluster wiring — portal-diagnostov.com (secondary OEM reproduction). https://portal-diagnostov.com/en/2020/05/01/instrument-cluster-chevrolet-cruze-lt-2011-system-wiring-diagrams/. Accessed 2026-09-08.
[S8] "2018通用雪佛兰科沃兹维修资料" catalog — tzdoc.com (secondary listing of OEM SI sections). https://car.tzdoc.com/car-177808.html. Accessed 2026-09-08.
[S9] 2018 Chevrolet Sail P16 Instrument Cluster pin legend — Scribd (secondary OEM reproduction). https://www.scribd.com/document/932632592/P16-Instrument-Cluster-LEYENDAS-DE-PINES. Accessed 2026-09-08.
[S10] "On-board diagnostics" — Wikipedia, ISO 15765-4 / J1962. https://en.wikipedia.org/wiki/On-board_diagnostics. Accessed 2026-09-08.

## Open gaps / uncertainty

- Bus exacto y bitrate del IPC Cavalier 2021: **no confirmados**.
- No se recuperó DBC, lista de CAN IDs, ni esquema «Data Communication» del K216.
- GMW3101 y SI del Volt son arquitectura GM genérica, no el vehículo PATAC.
- SAE J2411 abstract se recuperó; el texto completo de la norma es de pago y no se abrió.
- Si el IPC está en LIN en alguna variante, no hay evidencia primaria; LIN aparece en el índice 科沃兹 como capítulo de red, no atado al cluster.

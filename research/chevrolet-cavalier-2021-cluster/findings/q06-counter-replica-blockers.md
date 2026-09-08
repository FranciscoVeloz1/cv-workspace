# q06: ¿Hay evidencia de que un réplica from-scratch *no* pueda hablar con el bus original (gateway, seguridad, VIN, LIN-only, DBC cerrado)?

**Status:** researched — pending validation
**Source types to prioritize:** Arquitectura GM de seguridad, service info, ausencia de DBC públicos

## Findings

Sí hay evidencia —de tipo documental, no un teardown de este VIN— de que un réplica **plug-and-play en el conector del cuadro OEM** no está soportado por información pública, y de varios bloqueos técnicos que aplican a GMLAN en general.

**1. El DBC / mapa de mensajes no es público.** Ninguna fuente recuperada publica CAN IDs, scaling ni checksums del IPC Cavalier 2021 o 科沃兹. GMW3101 advierte que el detalle se da solo a proveedores nominados [S1]. Sin ese mapa, MCP2515 puede ver bytes y no saber qué mueve el velocímetro.

**2. El IPC puede no estar en el bus que un HAT CAN estándar escucha.** En Cruze 2011 el cluster está en Low Speed GMLAN de un hilo [S2]. Ese PHY es J2411/SWCAN a 33,3 kbit/s, no ISO 11898-2 a 500 kbit/s [S3][S4]. Un Arduino con MCP2515 + SN65HVD230 conectado a CANH/CANL del DLC **no habla el idioma eléctrico del IPC** si el cuadro está en el hilo del pin 1. El Sail 2018 contradice esa analogía (IPC en HS-GMLAN) [S5]. Mientras no se mida el K216, elegir el PHY equivocado es un fallo silencioso.

**3. Gateway.** GM SI: el BCM traduce entre HS-GMLAN y LS-GMLAN; el scan tool habla con el BCM principalmente por HS-GMLAN; una pérdida de comunicación se reporta en módulos distintos del que falló [S3]. Un réplica en el DLC ve el lado diagnóstico/powertrain, no necesariamente las tramas que el IPC consume en el otro lado del gateway.

**4. Programación de odómetro / IPC.** El boletín GM 07-08-49-020P (marzo 2019, **solo vehículos vendidos en EE.UU. y Canadá**) clasifica métodos SPS, ESC y Tech2/BCM para clústeres de recambio. En esa tabla, «Cavalier» aparece solo 2003–2005 (IPC ESC). El Cruze 2010–2017 figura como almacenamiento en BCM con método SPS [S6]. El Cavalier México 2016–2021 **no está en la tabla**. El boletín demuestra que GM trata el odómetro como dato programado (IPC o BCM), no como display tonto plug-and-play, pero **no** prueba el método del K216. Aplicar el renglón Cruze al Cavalier IV es analogía, no hecho.

**5. Inmovilizador.** El manual del propietario Cavalier 2020 describe luz de seguridad e inmovilizador al arrancar [S7]. Eso es del vehículo, no un cifrado publicado del bus del cluster; no se recuperó evidencia de challenge-response en el IPC de este modelo.

**6. Ausencia de esquema.** Los diagramas existen como producto de pago [S8] y no se abrieron. Esa opacidad es un bloqueo práctico para un réplica del conector OEM.

**Lo que sí es viable según fuentes, y no contradice lo anterior:** construir un cuadro **paralelo** que lea PIDs OBD-II (ISO 15765-4, pines 6/14) con Raspberry Pi + MCP2515 + transceptor ISO 11898-2 y python-can, como la propia librería ilustra para vehículos comerciales [S9][S10]. Ese camino **no** sustituye el IPC original ni se enchufa en su conector; muestra un subconjunto de datos del ECM (rpm, velocidad, refrigerante, MIL, a menudo combustible). Telltales de carrocería (puertas, TPMS detallado, StabiliTrak) pueden no existir como PID estándar.

No se encontró evidencia de que el IPC sea «solo LIN» ni de un security gateway tipo Global B de pickups recientes en este PATAC 1.5 L. Tampoco se encontró evidencia de que un réplica *display-only* alimentado por OBD esté prohibido por protocolo.

## Sources

[S1] GMW3101 catalog description — General Motors Worldwide (primary, supplier-restricted detail). https://standardsupdate.com/en/gmw/gmw-gmw3101_2618222.html. Accessed 2026-09-08.
[S2] Chevrolet Cruze LT 2011 cluster wiring — portal-diagnostov.com (secondary OEM reproduction). https://portal-diagnostov.com/en/2020/05/01/instrument-cluster-chevrolet-cruze-lt-2011-system-wiring-diagrams/. Accessed 2026-09-08.
[S3] GM Data Communications SI — tis-volt.by (secondary OEM reproduction). https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.
[S4] NCV7356 — onsemi (primary). https://www.onsemi.com/products/interfaces/wired-transceivers-modems/ncv7356. Accessed 2026-09-08.
[S5] 2018 Chevrolet Sail P16 pin legend — Scribd (secondary OEM reproduction). https://www.scribd.com/document/932632592/P16-Instrument-Cluster-LEYENDAS-DE-PINES. Accessed 2026-09-08.
[S6] GM Bulletin 07-08-49-020P "IPC Odometer Programming Method Quick Reference Guide", March 2019 (primary). https://static.oemdtc.com/TSB/MC-10158861-9999.pdf. Accessed 2026-09-08.
[S7] Cavalier 2020 owner manual, índice luces de seguridad / inmovilizador — ManualsLib (primary). https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html?page=62. Accessed 2026-09-08.
[S8] 2018/2021 Cavalier repair manual listings — 17vin.com (secondary). https://en.17vin.com/automotive_repair_manual_wiring_diagrams/Chevrolet/8193.html. Accessed 2026-09-08.
[S9] python-can docs (primary library). https://python-can.readthedocs.io/en/stable/. Accessed 2026-09-08.
[S10] MCP2515 datasheet — Microchip (primary). https://ww1.microchip.com/downloads/en/DeviceDoc/MCP2515-Stand-Alone-CAN-Controller-with-SPI-20001801J.pdf. Accessed 2026-09-08.

## Open gaps / uncertainty

- No se midió el bus del IPC K216; el bloqueo por SWCAN vs HS-CAN es condicional.
- Programación SPS del odómetro en México/China: no cubierta por el boletín US/Canada.
- No hay paper de ingeniería inversa pública de este cluster (a diferencia de algunos GM US).
- No se documentó cifrado de mensajes GMLAN para este modelo; la opacidad no equivale a cifrado demostrado.
- Legalidad de alterar odómetros es jurisdicción local; el boletín GM asume recambio de servicio, no réplica DIY.

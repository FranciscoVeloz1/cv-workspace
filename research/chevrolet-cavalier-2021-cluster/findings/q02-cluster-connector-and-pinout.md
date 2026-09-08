# q02: ¿Qué conector o puerto físico une el cuadro al arnés (familia, pines, alimentación, tierra, buses)?

**Status:** reported
**Source types to prioritize:** Diagramas de cableado públicos, catálogos de conectores GM/Delphi, bulletins de servicio

## Findings

No se recuperó en esta sesión un diagrama de conector (connector end view) del Instrument Panel Cluster (P16) del Chevrolet Cavalier 2021 1.5L / 科沃兹. Los vendedores de manuales de taller anuncian esquemas de «data communication» y vistas de conectores para Cavalier 2018–2021, pero el contenido no está en acceso abierto [S1]. Ese es el hallazgo central: el puerto del cuadro no está documentado en fuentes públicas recuperables aquí.

El puerto de diagnóstico OBD-II del vehículo no es el conector del cuadro. Wikipedia resume SAE J1962: conector hembra de 16 pines; el pin 6 es CAN high (ISO 15765-4 / SAE J2284) y el pin 14 es CAN low [S2]. La información de servicio GM (reproducción del manual del Chevrolet Volt) describe el Data Link Connector (DLC) de 16 cavidades con, entre otros, terminal 1 = Low speed GMLAN, terminal 6 = High speed GMLAN (+), terminal 14 = High speed GMLAN (−), terminal 16 = batería positiva para la herramienta de diagnóstico [S3]. Conectar Arduino o Raspberry Pi al DLC lee buses de diagnóstico; no sustituye el arnés detrás del IPC.

Como analogía de arquitectura GM cercana (Cruze de primera generación / Delta II, la plataforma que Wikipedia asigna a este Cavalier), un diagrama de sistema del Chevrolet Cruze LT 2011 etiqueta el cluster con alimentación de batería, voltaje de ignición, tierra, «Lo spd gmlan serial data», y varias entradas discretas (p. ej. control del indicador Check Engine, sensor de temperatura ambiente, indicadores de luces altas) [S4]. Eso describe un módulo con **un solo hilo de GMLAN de baja velocidad** más alimentación y algunas líneas hard-wired, no un puerto USB ni UART de usuario.

Una vista de conector P16 publicada como «2016 Chevrolet Cruze» en un host de manuales GM resulta ser, según aviso del propio host, del Chevrolet Malibu Limited 2016: conector 20 vías hembra Micro-HVT, OEM 13782499, pin 1 Low Speed GMLAN, pin 10 tierra, pin 19 Run/Crank Ignition 1, pin 20 Battery Positive Voltage, más señales de interruptores DIC y de indicadores [S5]. Es útil como patrón GM de la época, **no** como pinout del Cavalier 2021.

Una ficha en Scribd se titula como guía P16 del Chevrolet Sail 2018, pero al recuperar la página el cuerpo del PDF no es accesible (paywall; el texto visible mezcla un blurb de Toyota Hilux). **No se usa como pinout** [S6].

En los casos GM documentados arriba, el cuadro se une al **arnés del tablero** (Instrument Panel harness) con un conector rectangular de muchas vías (20 vías en el análogo Malibu Limited 2016), no con el DLC de 16 pines bajo el volante. Las funciones mínimas esperables son: positivo de batería, ignición Run/Crank, tierra de señal, y al menos un circuito de datos seriales [S4][S5].

## Sources

[S1] "2018 Chevrolet Cavalier Repair Manual & Wiring Diagrams" — 17vin.com (secondary vendor listing, not the diagrams themselves). https://en.17vin.com/automotive_repair_manual_wiring_diagrams/Chevrolet/8193.html. Accessed 2026-09-08.
[S2] "On-board diagnostics" — Wikipedia (secondary), SAE J1962 pinout table. https://en.wikipedia.org/wiki/On-board_diagnostics. Accessed 2026-09-08.
[S3] "Data Communications - Description and Operation" — GM service information for Chevrolet Volt, third-party host tis-volt.by (secondary reproduction of OEM SI). https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.
[S4] "INSTRUMENT CLUSTER – Chevrolet Cruze LT 2011 – SYSTEM WIRING DIAGRAMS" — portal-diagnostov.com (secondary reproduction of OEM diagrams). https://portal-diagnostov.com/en/2020/05/01/instrument-cluster-chevrolet-cruze-lt-2011-system-wiring-diagrams/. Accessed 2026-09-08.
[S5] "P16 Instrument Cluster" connector end view — LEMON Manuals, page warns it is 2016 Chevrolet Malibu Limited not Cruze (secondary reproduction of OEM). https://lemon-manuals.la/Chevrolet/2016/Cruze%20LS%2C%20Standard%20Trans/Repair%20and%20Diagnosis/External%20Pages/Different%20car/Section%2028%20%28Wiring%20Systems%20And%20Power%20Management%20-%20Component%20Connector%20End%20Views%20-%20K20%20X3%20To%20Q2%29/Component%20Connector%20End%20Views/P16%20Instrument%20Cluster/. Accessed 2026-09-08.
[S6] Scribd listing "P16 Instrument Cluster LEYENDAS DE PINES" / Sail title (secondary; **document body not retrieved**). https://www.scribd.com/document/932632592/P16-Instrument-Cluster-LEYENDAS-DE-PINES. Accessed 2026-09-08.

## Open gaps / uncertainty

- Pinout, familia de conector (p. ej. Micro-HVT vs otro), número de vías y colores de cable del IPC Cavalier 2021 **no confirmados**.
- Analogía Cruze 2011 = LS-GMLAN de un hilo. Compactos PATAC posteriores podrían diferir; un PDF de Sail en Scribd no se pudo leer.
- Los hosts de manuales (17vin, factory-manual) no entregaron el PDF del esquema; no se pudo citar un pin concreto del K216.
- No se identificó el P/N de conector de servicio (el análogo Malibu usa 13578570 / OEM 13782499).

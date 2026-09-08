# Chevrolet Cavalier 2021 1.5L LT — cuadro de instrumentos (investigación para réplica)

## Executive Summary

El Cavalier 2021 1.5L LT es la cuarta generación china/mexicana (proyecto **K216**, PATAC), no el Cavalier estadounidense 1982–2005 ni el Cavalier Turbo 2022 (Monza). El cuadro OEM documentado es un grupo **analógico** (velocímetro, tacómetro, combustible, refrigerante) más un **DIC de 3,5 pulgadas** en el trim LT. No se recuperó pinout ni número de parte del IPC. El puerto del cuadro **no es** el OBD-II de 16 pines: es un conector del arnés de tablero cuyo diagrama no está en acceso abierto. El ecosistema eléctrico GM de esa era es **GMLAN** (CAN) más **LIN**, con el BCM como gateway; el bus exacto del IPC K216 no está publicado. Un Arduino o Raspberry Pi con MCP2515 y transceptor ISO 11898-2 puede leer **PIDs OBD en pines 6/14 a 500 kbit/s** y alimentar un cuadro **paralelo**. Un réplica **plug-and-play** en el conector OEM no está soportado por información pública: falta DBC, el PHY puede ser CAN de un hilo (J2411 / ~33,3 kbit/s) en lugar de CAN diferencial, y el odómetro en GM se trata como dato de recambio programado.

## Introduction

El objetivo es apoyar la decisión de construir un cuadro desde cero para el Chevrolet Cavalier 2021 1.5L LT: qué se conecta detrás del IPC, con qué protocolo, qué datos muestra, de dónde salen, y cómo leerlos o emularlos con Arduino o Raspberry Pi. El alcance es arquitectura pública, OBD y réplica como display; no incluye ingeniería inversa de firmware, exploits ni reproducción verbatim de esquemas de taller con copyright.

Tres desambiguaciones importan desde el primer párrafo. Primera: el Cavalier de EE.UU. 1995–2005 no es este coche; sus catálogos de cluster (p. ej. 22714992) no aplican [1][29]. Segunda: el Cavalier Turbo 2022 es un Monza reetiquetado, con otro cuerpo y otro ciclo de manual [1][2][28]. Tercera: el DLC bajo el volante no es el conector del cuadro [10][11].

## Vehículo y hardware del cuadro

Wikipedia describe la cuarta generación reintroducida en China (科沃兹 / Kewozi) a partir de 2016, producida por SAIC-GM y exportada a México desde 2018, y una quinta generación vendida en México desde finales de 2021 como modelo 2022 (Cavalier Turbo = Monza) [1]. GM Authority, citando a GM México, confirma que en 2021 el único mercado restante de la cuarta generación era México, y da dimensiones distintas de las del Monza/Turbo (4.544 mm de largo, 2.600 mm de batalla para la cuarta) [2]. El pedido «1.5L LT» encaja con esa cuarta generación, no con el Turbo.

Chevrolet El Salvador publica una ficha LT: motor 1.5 L cuatro cilindros DOHC, **107 hp** a 6.000 rpm y **104 lb-pie** a 4.000 rpm, automática de 6 velocidades, y «Panel de instrumentos con pantalla de 3.5”» [3]. Un PDF de flotillas de un distribuidor Chevrolet en México (copyright GMM 2020) describe el Cavalier 2021 con el mismo 1.5 L de 107 hp y transmisiones manual de 5 o automática de 6; LT y Premier mencionan Apple CarPlay [4]. Auto-Data lista el Cavalier IV 1.5 DVVT con código de motor **L2B**, 1.485 cm³ y **113 CV** / 141 Nm [5]. Hay conflicto de potencia: 107 hp en fichas Chevrolet de Latinoamérica [3][4] (Wikipedia atribuye esos 107 hp a la especificación México [1]) frente a 113 CV en Auto-Data [5].

Sobre plataforma hay conflicto entre fuentes secundarias. Wikipedia afirma Delta II (la del Cruze de primera generación) y motor 1.5 L compartido con otros compactos GM en China, incluido el Sail [1]. GM Authority asigna el Cavalier chino a la plataforma **GM-PATAC K**, debut 2015 [6]. El manual del propietario 2021 se identifica internamente como «Owner Manual for 21MY **K216** Export to Mexico (PATAC-Source-Mexico/S. America/GMIO-14575635)», número de parte **84777383 A** [7]. El manual 2020 en ManualsLib es Chevrolet/PATAC para México y Sudamérica [8]. Ninguna de esas fuentes públicas da un número de parte del conjunto de instrumentos 2021 México; los catálogos GM de EE.UU. que aparecen en búsquedas son del Cavalier 2000–2005 [29].

El cuadro documentado en el manual 2020 (mismo ciclo PATAC 1.5 L que el 2021; el PDF 2021 no se recorrió página a página) es un grupo con velocímetro, tacómetro, combustible y temperatura de refrigerante, más un Centro de información del conductor (DIC) en el centro [8]. Hay al menos dos niveles: «Cuadro base» (odómetro de viaje con vástago de reinicio) y «Cuadro superior» (DIC con SET/CLR, banda y MENU en la palanca de direccionales) [8]. La ficha LT concreta 3,5 pulgadas [3]. Según esas descripciones de usuario, el conjunto es **agujas analógicas más display digital**, no un cluster full-LCD posterior.

Documentación de servicio específica del cluster: los manuales de propietario 2019, 2020 y 2021 del ciclo PATAC existen en hosts públicos [7][8][27]; el de 2022 es el ciclo Turbo/Monza [28]. Manuales de taller y wiring para Cavalier 2018–2021 se anuncian a la venta, con capítulos de data communication, LIN, HS-GMLAN (L2B) y vistas de conectores [9][19]; **el contenido no se abrió en esta investigación**. El boletín GM 07-08-49-020P cubre programación de odómetro en pasajeros **EE.UU./Canadá** y no lista el Cavalier chino/mexicano 2016–2021 [26]. NHTSA no aportó un recall de cluster de este modelo en las búsquedas de esta sesión.

## Conector y pinout

No se recuperó un diagrama de conector (connector end view) del Instrument Panel Cluster (P16) del Cavalier 2021 1.5L / 科沃兹. Los vendedores anuncian esquemas; no están en acceso abierto [9]. Ese es el hallazgo central de hardware: **el puerto del cuadro no está documentado en las fuentes públicas usadas**.

El puerto de diagnóstico OBD-II **no es** ese conector. SAE J1962 describe un conector hembra de 16 pines; el pin 6 es CAN high (ISO 15765-4 / SAE J2284) y el pin 14 es CAN low [10]. La información de servicio GM (reproducción del Chevrolet Volt) describe el Data Link Connector de 16 cavidades con, entre otros, terminal 1 = Low speed GMLAN, terminal 6 = High speed GMLAN (+), terminal 14 = High speed GMLAN (−), terminal 16 = batería positiva para la herramienta de diagnóstico [11]. Conectar un microcontrolador al DLC lee buses de diagnóstico; **no sustituye el arnés detrás del IPC**.

Como analogía de arquitectura GM cercana —no como pinout K216—, un diagrama de sistema del Chevrolet Cruze LT 2011 etiqueta el cluster con alimentación de batería, voltaje de ignición, tierra, «Lo spd gmlan serial data», y varias entradas discretas (control del indicador Check Engine, sensor de temperatura ambiente, luces altas) [12]. Eso describe un módulo con **un solo hilo de GMLAN de baja velocidad** más alimentación y algunas líneas hard-wired, no USB ni UART de usuario.

Una vista de conector P16 publicada como «2016 Chevrolet Cruze» resulta ser, según aviso del propio host, del Chevrolet **Malibu Limited 2016**: conector 20 vías hembra Micro-HVT, OEM 13782499, pin 1 Low Speed GMLAN, pin 10 tierra, pin 19 Run/Crank Ignition 1, pin 20 Battery Positive Voltage, más señales de interruptores DIC [13]. Es un patrón GM de la época; **no** es el pinout del Cavalier 2021. Una ficha en Scribd titulada como guía P16 del Chevrolet Sail 2018 no entregó el cuerpo del PDF (paywall; el texto visible mezcla un blurb de Toyota Hilux) y **no se usa como pinout** [14].

En los casos GM documentados, el cuadro se une al **arnés del tablero** con un conector rectangular de muchas vías (20 vías en el análogo Malibu Limited), no con el DLC de 16 pines. Las funciones mínimas esperables, por analogía, son positivo de batería, ignición Run/Crank, tierra de señal y al menos un circuito de datos seriales [12][13]. Familia de conector, número de vías y colores de cable del IPC Cavalier 2021 **no están confirmados**.

## Protocolos y red del vehículo

GM nombra su familia CAN vehicular **GMLAN**. El documento corporativo GMW3101 describe tres buses basados en CAN: High Speed (datos en tiempo real), Mid Speed (infotenimiento / gráficos) y Low Speed (funciones de operador con tiempo de respuesta ~100 ms) [15]. El detalle de GMW3101 en catálogo no es el texto completo de la norma; la norma se distribuye a proveedores nominados [15]. Notas de un curso de Arizona State University sobre la tarjeta VBI de GM concretan velocidades físicas: high-speed dual-wire a **500 kbit/s**; low-speed single-wire a **33,33 kbit/s**; un nodo gateway une ambos buses [16].

La información de servicio GM (Volt) coincide y añade detalle eléctrico [11]:

- **High Speed GMLAN:** par trenzado GMLAN-High / GMLAN-Low, resistencias de terminación 120 Ω en cada extremo, **500 kbit/s**, recesivo ≈ 2,5 V en ambas líneas, dominante ≈ 3,5 V / 1,5 V.
- **Low Speed GMLAN:** **un solo hilo** referenciado a chasis, **33,3 kbit/s** en carretera, modo de programación **83,3 kbit/s**, **sin** resistencias de terminación en los extremos; recesivo ≈ 0,2 V, dominante ≈ 4,0 V o más.
- **LIN:** un hilo, **10,417 kbit/s**, recesivo ≈ Vbatt, dominante ≈ 0 V; el BCM actúa de maestro frente a dispositivos «smart».
- El BCM está cableado a HS-GMLAN, LS-GMLAN y varios LIN y **funciona como gateway** entre ellos [11].

La capa física de alta velocidad es ISO 11898-2 (CAN diferencial de dos hilos, hasta 1 Mbit/s, terminación 120 Ω) [17]. El transceptor onsemi NCV7356 se declara «Fully Compatible with J2411 Single Wire CAN Specification» y diseñado según GMW3089; bit rate típico de comunicación normal **33 kbit/s**, modo de descarga de servicio **83 kbit/s** [18]. El texto de SAE J2411 no se abrió; la compatibilidad J2411 se toma del producto onsemi, no del PDF SAE.

¿Dónde está el IPC del Cavalier 2021? **No hay esquema de data communication de ese VIN recuperado.** El Cruze LT 2011 (plataforma que Wikipedia asocia al Cavalier IV) pone el instrument cluster en **Lo spd gmlan serial data** [12]. Un índice de materiales de taller de la 科沃兹 2018 (mismo nombre chino / motor L2B) lista capítulos de comunicación que incluyen LIN, bus de expansión de chasis, DLC y **«高速GMLAN(L2B)»** [19]. Eso demuestra que el vehículo L2B **tiene** HS-GMLAN; **no** demuestra que el cuadro viva en ese bus.

Diagnóstico OBD en el DLC: ISO 15765-4 sobre CAN, pines 6 y 14, 250 o 500 kbit/s [10]. En GM, el scan tool habla HS-GMLAN por 6/14 y LS-GMLAN por el pin 1 cuando existe [10][11]. Eso permite leer módulos de tren motriz sin estar en el conector del cuadro.

La evidencia pública describe el ecosistema (GMLAN + LIN + BCM gateway). El bus y el bitrate a configurar en un sniff **del IPC** no están publicados para el K216.

## Datos del cuadro y origen de las señales

El manual 2020 lista lo que el grupo muestra, no el cableado [8]. Medidores: velocímetro (km/h o mph), odómetro, odómetro de viaje, tacómetro (rpm; en Auto Stop apunta a AUTO STOP con el motor apagado), indicador de combustible (con flecha del lado del tapón) e indicador de temperatura del refrigerante [8]. El DIC básico, con el vástago inferior derecho, muestra odómetro total, Viaje A/B con economía promedio, rango de combustible y velocidad promedio [8]. El DIC superior añade menú TRIP/fuel vía SET/CLR, banda y MENU en la palanca de direccionales, más menús de vehículo y mensajes [8].

Luces de advertencia e indicadores enumerados en el índice [8]: recordatorio de cinturón; disponibilidad de bolsa de aire; sistema de carga; indicador de falla (Revise el motor / OBD de emisiones); aviso de servicio inmediato; frenos; ABS; luz de cambio (si está equipado); dirección asistida; tracción apagada; StabiliTrak Off; TCS/StabiliTrak; temperatura de refrigerante; presión de llantas (TPMS); presión de aceite; modo de ahorro de combustible; combustible bajo; modo parada automática; seguridad (inmovilizador); luces altas; antiniebla trasera; aviso de luces encendidas; puerta entreabierta. El texto de cada luz confirma el significado (MIL como diagnóstico de emisiones a bordo; ABS vs frenos convencionales; TPMS fijo = baja presión, parpadeo luego fijo = falla del sistema; aceite = flujo/presión inadecuada) [8].

**El cuadro no es el sensor.** En la arquitectura GM documentada, el BCM es gateway; los datos de tren motriz viven en HS-GMLAN (ECM, TCM, EBCM) y el IPC, cuando está en LS-GMLAN, recibe traducciones [11]. El diagrama Cruze 2011 —análogo de plataforma, no pinout Cavalier— es más explícito: el cluster tiene lógica interna, bus Lo spd GMLAN, y además líneas discretas (Check Engine indicator control, high beam, ambient air temperature). El nivel de combustible, interruptor de freno de estacionamiento, fluidos de freno, oil pressure switch y latches de puertas aparecen en el segundo folio ligados a BCM / ECM / EBCM, no como sensores cableados uno a uno al IPC [12].

Origen **típico** (GM / Cruze 2011), etiquetado como analogía:

| Dato en el cuadro (manual 2020) [8] | Origen típico GM / Cruze 2011 (no pinout Cavalier) |
|---|---|
| Velocidad | ECM / ABS (sensores de rueda) vía serial data [11][12] |
| rpm / Auto Stop | ECM [8][11] |
| Combustible | sensor de nivel en tanque → módulo (ECM/BCM) [8][12] |
| Temperatura refrigerante | sensor ECT en motor → ECM [8][11] |
| MIL | ECM, sistema de emisiones OBD [8] |
| ABS / TCS / StabiliTrak | EBCM + sensores de rueda / yaw según equipo [8] |
| Airbag | SDM / módulo de bolsas; el manual menciona sensor de golpes y módulo de diagnóstico [8] |
| Cinturón | interruptores de hebilla [8] |
| Carga | circuito de alternador / BCM [8] |
| Aceite | interruptor o sensor de presión de aceite [8][12] |
| TPMS | sistema de monitoreo; luz combinada de baja presión y falla [8] |
| Puertas | latches / interruptores de puerta [8][12] |
| Dirección asistida | módulo EPS (el vehículo tiene dirección electroasistida en fichas) [3] |
| Inmovilizador / seguridad | sistema de inmovilizador del manual de llaves [8] |

El DIC calcula economía, rango y promedios a partir de combustible y distancia; el rango «no se puede reiniciar» y se basa en economía reciente y combustible restante [8]. Eso es software del cluster o del BCM, no un sensor extra. El mapa sensor → CAN ID → IPC del Cavalier 2021 **no está publicado**. Cuáles testigos son hard-wired vs serial en el K216 es desconocido; el Cruze 2011 mezcla ambos [12]. Equipamiento LT vs LS vs Premier puede omitir DIC superior, antiniebla trasera o luz de cambio. El Cavalier Turbo 2022 tiene otro cluster [1][2].

## Interfaz con Arduino o Raspberry Pi

Hay dos puntos de acceso distintos. La literatura de hobby cubre sobre todo el **DLC OBD-II (CAN de alta velocidad)**, no el conector trasero del cuadro.

**Controlador CAN (Arduino o Pi).** Microchip MCP2515 es un controlador CAN 2.0B autónomo con SPI, tramas estándar y extendidas, hasta 1 Mb/s [20]. No incluye transceptor de bus; necesita un PHY aparte.

**Capa física HS-CAN.** Texas Instruments SN65HVD230/231/232 son transceptores 3,3 V compatibles con ISO 11898-2, hasta 1 Mbps [21]. Sirven para el par CANH/CANL del GMLAN de alta velocidad / OBD pines 6 y 14. **No** implementan Single Wire CAN / J2411.

**Capa física LS-GMLAN / SWCAN.** onsemi NCV7356 es transceptor de un hilo, conforme a J2411 y GMW3089, ~33 kbit/s normal y ~83 kbit/s en modo de descarga de servicio [18]. Un HAT MCP2515 + SN65HVD230 **no** es el PHY correcto para Low Speed GMLAN.

**Raspberry Pi.** MathWorks documenta: Pi SPI → MCP2515 → SN65HVD230 (el texto de MathWorks dice «SI65HVD230») → CANH/CANL; `dtparam=spi=on` y `dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25` [22]. El kernel Linux expone eso como SocketCAN (`PF_CAN`, `SOCK_RAW`) [23]. El overlay `mcp2515-can0` existe en el árbol de Raspberry Pi [24]. python-can abstrae SocketCAN y menciona logging pasivo en el puerto OBD-II de un vehículo comercial [25]. El oscilador 8 vs 16 MHz del módulo MCP2515 debe coincidir con el overlay; MathWorks asume 16 MHz [22].

**Arduino.** El MCP2515 se habla por SPI; el datasheet basta para afirmar que cualquier MCU con SPI puede configurar bitrate, filtros y buffers [20]. No se recuperó un repositorio oficial Microchip de biblioteca Arduino en esta sesión.

**Cómo leer datos sin el pinout del cluster.** ISO 15765-4 sobre el DLC, pines 6/14 [10]. Bitrate práctico de GMLAN HS: **500 kbit/s** [11][16]. Desde Pi, SocketCAN usa `bitrate` en `ip link` [23]. Los PIDs OBD (rpm, velocidad, refrigerante, nivel de combustible, MIL) son el subconjunto **diagnóstico del ECM**, no el protocolo propietario del IPC [10][25].

**Emular el cuadro (transmitir al bus OEM).** No hay receta pública de IDs GMLAN del Cavalier. SocketCAN y MCP2515 pueden **enviar** tramas 2.0B [20][23]; eso no documenta qué IDs espera el IPC ni si hace falta autenticación. LIN requiere otro PHY (no cubierto por MCP2515). Datasheets TJA1050/TJA1051 no se recuperaron (404); SN65HVD230 cubre el mismo rol ISO 11898-2. Datasheets MCP2003/TJA1020 para LIN no se abrieron.

Resumen de hardware según el bus:

| Bus | PHY documentado | Controlador | Bitrate típico GM |
|-----|-----------------|-------------|-------------------|
| HS-GMLAN / OBD 6–14 | SN65HVD230 (ISO 11898-2) [21] | MCP2515 SPI [20] | 500 kbit/s [11][16] |
| LS-GMLAN (1 hilo) | NCV7356 (J2411) [18] | MCP2515 u otro CAN controller + ese PHY | 33,3 kbit/s [11][18] |
| LIN | no recuperado en esta sesión | UART LIN stack | 10,417 kbit/s [11] |

México/China del L2B no está cubierto por la frase de Wikipedia sobre CAN obligatorio en EE.UU. desde 2008; GM SI sí pone HS-GMLAN en pines 6/14 [10][11]. Emisión de tramas al bus del vehículo puede perturbar módulos; las fuentes cubren sniffing, no un procedimiento de inyección para este modelo.

## Viabilidad de un réplica from-scratch

Hay evidencia documental —no un teardown de este VIN— de que un réplica **plug-and-play en el conector del cuadro OEM** no está soportado por información pública, y de varios bloqueos que aplican a GMLAN en general.

**1. El DBC / mapa de mensajes no es público.** Ninguna fuente recuperada publica CAN IDs, scaling ni checksums del IPC Cavalier 2021 o 科沃兹. GMW3101 advierte que el detalle se da solo a proveedores nominados [15]. Sin ese mapa, MCP2515 puede ver bytes y no saber qué mueve el velocímetro.

**2. El IPC puede no estar en el bus que un HAT CAN estándar escucha.** En Cruze 2011 el cluster está en Low Speed GMLAN de un hilo [12]. Ese PHY es el que onsemi cubre con NCV7356 (J2411 / ~33 kbit/s), no ISO 11898-2 a 500 kbit/s [11][18]. Un Arduino con MCP2515 + SN65HVD230 conectado a CANH/CANL del DLC **no habla el idioma eléctrico del IPC** si el cuadro está en el hilo del pin 1. Compactos PATAC posteriores podrían haber movido el IPC a HS-GMLAN; eso no se verificó con un esquema abierto. Mientras no se mida el K216, elegir el PHY equivocado es un fallo silencioso.

**3. Gateway.** GM SI: el BCM traduce entre HS-GMLAN y LS-GMLAN; el scan tool habla con el BCM principalmente por HS-GMLAN; una pérdida de comunicación se reporta en módulos distintos del que falló [11]. Un réplica en el DLC ve el lado diagnóstico/powertrain, no necesariamente las tramas que el IPC consume al otro lado del gateway.

**4. Programación de odómetro / IPC.** El boletín GM 07-08-49-020P (marzo 2019, **solo vehículos vendidos en EE.UU. y Canadá**) clasifica métodos SPS, ESC y Tech2/BCM para clústeres de recambio y afirma que el valor de odómetro de temporada puede guardarse en el IPC, el DIC o el BCM [26]. La tabla incluye los nombres Cavalier y Cruze; el extracto HTML del PDF **no permite asignar con fiabilidad años y método a cada fila**. El Cavalier México 2016–2021 **no aparece como fila de mercado**. El boletín demuestra que GM trata el odómetro como dato de recambio programado, no como display tonto plug-and-play, pero **no** prueba el método del K216.

**5. Inmovilizador.** El manual 2020 describe luz de seguridad e inmovilizador al arrancar [8]. Eso es del vehículo, no un cifrado publicado del bus del cluster; no se recuperó evidencia de challenge-response en el IPC de este modelo.

**6. Ausencia de esquema.** Los diagramas existen como producto de pago [9] y no se abrieron. Esa opacidad es un bloqueo práctico para un réplica del conector OEM.

Lo que sí es viable según las mismas fuentes, y no contradice lo anterior: construir un cuadro **paralelo** que lea PIDs OBD-II (ISO 15765-4, pines 6/14) con Raspberry Pi + MCP2515 + transceptor ISO 11898-2 y python-can, como la propia librería ilustra para vehículos comerciales [20][25]. Ese camino **no** sustituye el IPC original ni se enchufa en su conector; muestra un subconjunto de datos del ECM (rpm, velocidad, refrigerante, MIL, a menudo combustible). Telltales de carrocería (puertas, TPMS detallado, StabiliTrak) pueden no existir como PID estándar.

No se encontró evidencia de que el IPC sea «solo LIN» ni de un security gateway tipo Global B de pickups recientes en este PATAC 1.5 L. Tampoco se encontró evidencia de que un réplica *display-only* alimentado por OBD esté prohibido por protocolo. Opacidad de DBC no equivale a cifrado demostrado. Legalidad de alterar odómetros es jurisdicción local; el boletín GM asume recambio de servicio, no réplica DIY [26].

## Synthesis / Conclusion

Las fuentes primarias recuperadas (fichas Chevrolet, manuales de propietario PATAC, datasheets Microchip/TI/onsemi, boletín GM, kernel SocketCAN) responden con claridad **qué coche es**, **qué muestra el cuadro**, **cómo está armada la red GM genérica** y **cómo se lee CAN de alta velocidad desde un Pi o Arduino**. No responden **el conector del IPC K216** ni **el mapa de mensajes que ese IPC consume**.

Lo que las fuentes reportan, sin inferencia: el vehículo es K216 / L2B / mercado México-LATAM; el LT tiene DIC de 3,5"; el DLC es J1962 con HS-CAN en 6/14 y, en SI GM, LS-GMLAN en pin 1; GMLAN HS corre a 500 kbit/s en par diferencial y LS a 33,3 kbit/s en un hilo; el BCM es gateway; no hay DBC público; el SI de wiring se vende y no se abrió [3][7][8][9][10][11][15][18].

Lo que la evidencia **sugiere**, y debe quedar como inferencia: (1) un réplica útil **desde cero** para este proyecto es un **display paralelo por OBD**, no un drop-in en el arnés del cluster; (2) si el objetivo es hablar con el IPC original, el primer experimento empírico —fuera del alcance de esta investigación— es medir si el hilo de datos detrás del cuadro es diferencial 500 kbit/s o un hilo ~33 kbit/s, porque la analogía Cruze 2011 apunta a LS-GMLAN y el índice 科沃兹 solo prueba que el coche tiene HS-GMLAN [12][19]; (3) reutilizar un cluster OEM de recambio sin SI/SPS de mercado México es un riesgo de odómetro y de pieza equivocada (Turbo 2022 o Cavalier US) [2][26][29].

Los conflictos que no se deben «resolver» en prosa: Delta II vs PATAC-K [1][6]; 107 hp vs 113 CV [3][5]; bus del IPC desconocido vs analogías contradictorias en alcance [12][19]; conector 20-way Micro-HVT como patrón, no como hecho K216 [13].

## Limitations & Open Questions

- Pinout, familia de conector, número de vías, P/N de conector y P/N del IPC Cavalier 2021 México/China: no confirmados.
- Bus exacto y bitrate del IPC K216: no confirmados. Un PDF de Sail en Scribd que podría haber aclarado HS vs LS no se pudo leer y no se usa [14].
- DBC, lista de CAN IDs y esquema «Data Communication» del K216: no recuperados.
- GMW3101 y SI del Volt son arquitectura GM genérica, no el vehículo PATAC [11][15]. Lemon-manuals, portal-diagnostov y tis-volt.by son copias de SI GM, no K216 [11][12][13].
- SAE J2411: texto de la norma no abierto; se cita vía NCV7356 [18].
- Manual 2021 84777383 A: encabezado recuperado; detalle de cluster tomado del manual 2020 del mismo ciclo [7][8]. Diferencias de trim 2021 no se verificaron página a página.
- No hay foto oficial acotada del cluster LT 2021 más allá de la mención de 3,5" [3].
- Mapa sensor → CAN ID → IPC: no publicado. Hard-wired vs serial en K216: desconocido.
- TPMS 2020: el manual confirma sistema y luz; la página recuperada no llegó a la frase de sensores montados en las ruedas [8].
- Programación SPS del odómetro en México/China: no cubierta por el boletín US/Canada [26]. No se afirma un método BCM/SPS del Cruze a partir de esa tabla.
- LIN PHY (TJA1020/MCP2003) y ELM327/STN1110: no documentados en detalle en esta pasada.
- NHTSA/COFEPRIS: sin expediente de cluster abierto en esta ronda. EPC GM México no se consultó con VIN.
- No hay paper de ingeniería inversa pública de este cluster. No se documentó cifrado de mensajes GMLAN para este modelo.
- Esta investigación no incluye diseño eléctrico ni código de producción del réplica.

## Sources

[1] "Chevrolet Cavalier" — Wikipedia. https://en.wikipedia.org/wiki/Chevrolet_Cavalier. Accessed 2026-09-08.

[2] Centeno, Deivis. "Chevy Monza To Arrive In Mexico As Chevy Cavalier Turbo" — GM Authority, 22 Jun 2021. https://gmauthority.com/blog/2021/06/chevy-monza-to-arrive-in-mexico-as-chevy-cavalier-turbo/. Accessed 2026-09-08.

[3] "CHEVROLET CAVALIER LT" — ficha técnica Chevrolet El Salvador. https://chevrolet.com.sv/wp-content/uploads/2019/10/Ficha-Tecnica-Cavalier-LT-1.pdf. Accessed 2026-09-08.

[4] "Chevrolet Cavalier 2021" flotillas PDF — Chevrolet Automotriz Celaya / General Motors de México, 2020. https://www.chevroletautomotrizcelaya.com.mx/content/dam/chevrolet/na/mx/es/index/fleet/01-images/2020/pdfs/2021-chevrolet-cavalier.pdf. Accessed 2026-09-08.

[5] "Chevrolet Cavalier IV 1.5 DVVT (113 CV)" — Auto-Data. https://www.auto-data.net/es/chevrolet-cavalier-iv-1.5-dvvt-113hp-34946. Accessed 2026-09-08.

[6] "GM-PATAC K Vehicle Platform" — GM Authority. https://gmauthority.com/blog/gm/gm-platforms/gm-patac-k/. Accessed 2026-09-08.

[7] "Manual Del Propietario Cavalier 2021" — Chevrolet/PATAC, part 84777383 A, crc 6/12/20, hosted at PDFCoffee. https://pdfcoffee.com/manual-del-propietario-cavalier-2021-pdf-free.html. Accessed 2026-09-08.

[8] Chevrolet Cavalier 2020 Manual del propietario, sección Instrumentos y Controles (índice, gauges, DIC, telltales, TPMS) — ManualsLib. https://www.manualslib.es/manual/31368/Chevrolet-Cavalier-2020.html. Accessed 2026-09-08. Páginas usadas en findings: 61–62, 68–81, 184.

[9] "2018 Chevrolet Cavalier Repair Manual & Wiring Diagrams" (y listing 2021) — 17vin.com (anuncio comercial, no el diagrama). https://en.17vin.com/automotive_repair_manual_wiring_diagrams/Chevrolet/8193.html and https://en.17vin.com/automotive_repair_manual_wiring_diagrams/Chevrolet/8190.html. Accessed 2026-09-08.

[10] "On-board diagnostics" — Wikipedia, SAE J1962 / ISO 15765-4. https://en.wikipedia.org/wiki/On-board_diagnostics. Accessed 2026-09-08.

[11] "Data Communications - Description and Operation" — GM service information for Chevrolet Volt, third-party host tis-volt.by. https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.

[12] "INSTRUMENT CLUSTER – Chevrolet Cruze LT 2011 – SYSTEM WIRING DIAGRAMS" — portal-diagnostov.com. https://portal-diagnostov.com/en/2020/05/01/instrument-cluster-chevrolet-cruze-lt-2011-system-wiring-diagrams/. Accessed 2026-09-08.

[13] "P16 Instrument Cluster" connector end view — LEMON Manuals (host warns 2016 Chevrolet Malibu Limited, not Cruze). https://lemon-manuals.la/Chevrolet/2016/Cruze%20LS%2C%20Standard%20Trans/Repair%20and%20Diagnosis/External%20Pages/Different%20car/Section%2028%20%28Wiring%20Systems%20And%20Power%20Management%20-%20Component%20Connector%20End%20Views%20-%20K20%20X3%20To%20Q2%29/Component%20Connector%20End%20Views/P16%20Instrument%20Cluster/. Accessed 2026-09-08.

[14] Scribd listing "P16 Instrument Cluster LEYENDAS DE PINES" / Sail title (cuerpo del documento no recuperado; no usado como pinout). https://www.scribd.com/document/932632592/P16-Instrument-Cluster-LEYENDAS-DE-PINES. Accessed 2026-09-08.

[15] GMW3101 "General Requirements GMLAN" — General Motors Worldwide (descripción de catálogo, no el texto completo). https://standardsupdate.com/en/gmw/gmw-gmw3101_2618222.html. Accessed 2026-09-08.

[16] "Vehicle-Bus Interface" / VBI_CAN.pdf — Arizona State University. https://www.public.asu.edu/~pheanis/documents/VBI_CAN.pdf. Accessed 2026-09-08.

[17] "CAN bus" — Wikipedia, ISO 11898-1/2/3. https://en.wikipedia.org/wiki/CAN_bus. Accessed 2026-09-08.

[18] NCV7356 — onsemi product page. https://www.onsemi.com/products/interfaces/wired-transceivers-modems/ncv7356. Accessed 2026-09-08. Datasheet PDF via Digi-Key: https://media.digikey.com/pdf/Data%20Sheets/ON%20Semiconductor%20PDFs/NCV7356.pdf.

[19] "2018通用雪佛兰科沃兹维修资料" catalog — tzdoc.com. https://car.tzdoc.com/car-177808.html. Accessed 2026-09-08.

[20] MCP2515 "Stand-Alone CAN Controller with SPI Interface" datasheet DS20001801J — Microchip. https://ww1.microchip.com/downloads/en/DeviceDoc/MCP2515-Stand-Alone-CAN-Controller-with-SPI-20001801J.pdf. Accessed 2026-09-08.

[21] SN65HVD230/231/232 datasheet SLOS346O — Texas Instruments. https://www.ti.com/lit/ds/symlink/sn65hvd230.pdf. Accessed 2026-09-08.

[22] "Enable and Configure Raspberry Pi for SPI and CAN Communication Using MCP2515 CAN Controller" — MathWorks. https://www.mathworks.com/help/raspberrypi/ug/enable-and-configure-raspberry-pi-for-spi-and-can-communication-using-mcp2515-can-controller.html. Accessed 2026-09-08.

[23] "SocketCAN - Controller Area Network" — Linux Kernel documentation. https://www.kernel.org/doc/html/latest/networking/can.html. Accessed 2026-09-08.

[24] raspberrypi/linux issues discussing `dtoverlay=mcp2515-can0`. https://github.com/raspberrypi/linux/issues/4183. Accessed 2026-09-08.

[25] python-can documentation. https://python-can.readthedocs.io/en/stable/. Accessed 2026-09-08.

[26] GM Bulletin 07-08-49-020P "IPC Odometer Programming Method Quick Reference Guide", March 2019. https://static.oemdtc.com/TSB/MC-10158861-9999.pdf. Accessed 2026-09-08.

[27] Chevrolet Cavalier Manual del usuario (2019 PATAC 13009998) — ManualsLib. https://www.manualslib.es/manual/220193/Chevrolet-Cavalier.html. Accessed 2026-09-08.

[28] 2022 Cavalier Owner’s Manual listing — usersmanualguide.com. https://usersmanualguide.com/gmc/automobile/chevrolet-cavalier-2022/user-manual/ts0q. Accessed 2026-09-08.

[29] GM instrument-panel gage cluster 22714992 — chevypartsdeal.com (US Cavalier 2000–2005 only). https://www.chevypartsdeal.com/oem/gm~instrument-panel-gage-cluster~22714992. Accessed 2026-09-08.

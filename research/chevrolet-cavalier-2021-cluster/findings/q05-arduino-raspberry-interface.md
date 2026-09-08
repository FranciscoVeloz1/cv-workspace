# q05: ¿Cómo se documenta la lectura o emulación de buses GM/CAN/LIN con Arduino o Raspberry Pi (transceptor, bitrate, stack)?

**Status:** reported
**Source types to prioritize:** Datasheets MCP2515/TJA1050/MCP2003, SocketCAN, librerías oficiales

## Findings

Hay dos puntos de acceso distintos, y la literatura de hobby cubre sobre todo el **DLC OBD-II (CAN de alta velocidad)**, no el conector trasero del cuadro.

**Capa de controlador CAN (Arduino o Pi):** Microchip MCP2515 es un controlador CAN 2.0B autónomo con interfaz SPI, tramas estándar y extendidas, hasta **1 Mb/s**, SPI hasta 10 MHz, modos 0,0 y 1,1 [S1]. No incluye transceptor de bus; necesita un PHY ISO 11898-2 para HS-CAN.

**Capa física HS-CAN:** Texas Instruments SN65HVD230/231/232 son transceptores 3,3 V compatibles con **ISO 11898-2**, diseñados hasta **1 Mbps** [S2]. Sirven para el par CANH/CANL del GMLAN de alta velocidad / OBD pines 6 y 14. **No** implementan Single Wire CAN / J2411.

**Capa física LS-GMLAN / SWCAN:** onsemi NCV7356 es transceptor de un hilo, conforme a J2411 y GMW3089, ~**33 kbit/s** normal y ~**83 kbit/s** en modo de descarga de servicio [S3]. Un HAT MCP2515 + SN65HVD230 **no** es el PHY correcto para Low Speed GMLAN.

**Raspberry Pi:** MathWorks documenta el enlace oficial de aplicación: Pi SPI → MCP2515 → SN65HVD230 (su texto dice «SI65HVD230») → CANH/CANL; `dtparam=spi=on` y `dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25` [S4]. El kernel Linux expone eso como interfaz SocketCAN (`PF_CAN`, `SOCK_RAW`), el stack CAN del sistema operativo [S5]. El overlay `mcp2515-can0` existe en el árbol de Raspberry Pi (issues de raspberrypi/linux lo tratan como interfaz soportada) [S6]. python-can abstrae SocketCAN y menciona explícitamente logging pasivo en el puerto OBD-II de un vehículo comercial [S7].

**Arduino:** el MCP2515 se habla por SPI; bibliotecas de terceros (no recuperadas como repo oficial Microchip en esta sesión) usan ese SPI. El datasheet basta para afirmar que cualquier MCU con SPI puede configurar bitrate, filtros y buffers [S1].

**Cómo leer datos de vehículo sin el pinout del cluster:** ISO 15765-4 sobre el DLC, pines 6/14, CAN 250 o 500 kbit/s (en EE.UU. obligatorio CAN desde 2008; México/China del L2B no está cubierto por esa frase de Wikipedia, pero GM SI pone HS-GMLAN en 6/14) [S8][S9]. Bitrate práctico de GMLAN HS: **500 kbit/s** [S9][S10]. Desde Pi: `ip link set can0 up type can bitrate 500000` aparece en guías de módulos MCP2515 (MathWorks no imprime ese comando; SocketCAN sí usa `bitrate` en `ip link`) [S5]. Los PIDs OBD (rpm, velocidad, refrigerante, nivel de combustible, MIL) son el subconjunto **diagnóstico del ECM**, no el protocolo propietario del IPC. python-can se presenta precisamente para ese sniffing de OBD [S7].

**Emular el cuadro (transmitir al bus OEM):** no hay receta pública de IDs GMLAN del Cavalier. SocketCAN y MCP2515 pueden **enviar** tramas 2.0B [S1][S5]; eso no documenta qué IDs espera el IPC ni si hace falta autenticación. LIN requiere otro PHY (no cubierto por MCP2515).

Resumen de hardware según el bus que se pretenda:

| Bus | PHY documentado | Controlador | Bitrate típico GM |
|-----|-----------------|-------------|-------------------|
| HS-GMLAN / OBD 6–14 | SN65HVD230 (ISO 11898-2) [S2] | MCP2515 SPI [S1] | 500 kbit/s [S9][S10] |
| LS-GMLAN (1 hilo) | NCV7356 (J2411) [S3] | MCP2515 u otro CAN controller + ese PHY | 33,3 kbit/s [S3][S9] |
| LIN | no recuperado (TJA1020/MCP2003 no se abrieron) | UART LIN stack | 10,417 kbit/s [S9] |

## Sources

[S1] MCP2515 "Stand-Alone CAN Controller with SPI Interface" datasheet DS20001801J — Microchip (primary). https://ww1.microchip.com/downloads/en/DeviceDoc/MCP2515-Stand-Alone-CAN-Controller-with-SPI-20001801J.pdf. Accessed 2026-09-08.
[S2] SN65HVD230/231/232 datasheet SLOS346O — Texas Instruments (primary), Mar 2001 / rev Apr 2018. https://www.ti.com/lit/ds/symlink/sn65hvd230.pdf. Accessed 2026-09-08.
[S3] NCV7356 — onsemi product page (primary). https://www.onsemi.com/products/interfaces/wired-transceivers-modems/ncv7356. Accessed 2026-09-08. Datasheet PDF via Digi-Key: https://media.digikey.com/pdf/Data%20Sheets/ON%20Semiconductor%20PDFs/NCV7356.pdf. Accessed 2026-09-08.
[S4] "Enable and Configure Raspberry Pi for SPI and CAN Communication Using MCP2515 CAN Controller" — MathWorks (secondary, vendor application). https://www.mathworks.com/help/raspberrypi/ug/enable-and-configure-raspberry-pi-for-spi-and-can-communication-using-mcp2515-can-controller.html. Accessed 2026-09-08.
[S5] "SocketCAN - Controller Area Network" — Linux Kernel documentation (primary). https://www.kernel.org/doc/html/latest/networking/can.html. Accessed 2026-09-08.
[S6] raspberrypi/linux issues discussing `dtoverlay=mcp2515-can0` (secondary, but the overlay is first-party firmware). e.g. https://github.com/raspberrypi/linux/issues/4183. Accessed 2026-09-08.
[S7] python-can documentation — python-can project (primary library docs). https://python-can.readthedocs.io/en/stable/. Accessed 2026-09-08.
[S8] "On-board diagnostics" — Wikipedia, J1962 / ISO 15765-4. https://en.wikipedia.org/wiki/On-board_diagnostics. Accessed 2026-09-08.
[S9] GM Data Communications SI — tis-volt.by (secondary OEM reproduction). https://tis-volt.by/volt2/sm/part4.htm. Accessed 2026-09-08.
[S10] VBI_CAN.pdf — Arizona State University (secondary). https://www.public.asu.edu/~pheanis/documents/VBI_CAN.pdf. Accessed 2026-09-08.

## Open gaps / uncertainty

- No se recuperó datasheet NXP TJA1050/TJA1051 (404 en nxp.com); SN65HVD230 cubre el mismo rol ISO 11898-2.
- No se abrió datasheet MCP2003/TJA1020 para LIN.
- No hay guía OEM «Cavalier + Arduino».
- ELM327/STN1110 no se documentaron en detalle en esta pasada (camino OBD de bajo nivel vs CAN crudo).
- Oscilador 8 vs 16 MHz del módulo MCP2515 debe coincidir con el overlay; MathWorks asume 16 MHz [S4].
- Emisión de tramas al bus del vehículo puede perturbar módulos; las fuentes cubren sniffing, no un procedimiento de inyección para este modelo.

# Validación — Chevrolet Cavalier 2021 1.5L LT (cuadro de instrumentos)

**Validador:** research-validator  
**Fecha:** 2026-09-08  
**Hallazgos revisados:** `findings/` (tras corrección del investigador: q02, q03, q06)  
**Decisión:** **Listo para redacción tal cual**

---

## Resumen ejecutivo

Los siete findings cubren las preguntas del plan. Tras la primera validación se retiró el pinout de Scribd/Sail, se dejó de afirmar programación BCM/SPS del Cruze a partir del boletín 07-08-49-020P, y SAE J2411 se cita vía NCV7356. El informe puede redactarse si mantiene analogías Cruze/Volt como analogías, no como pinout K216.

---

## Comprobación de citas (muestra)

| Claim | Finding | Resultado |
| --- | --- | --- |
| K216 PATAC-Source-Mexico | q01 S1 | PASS |
| Motor L2B / 107 hp Chevrolet | q01 S3 | PASS |
| 113 CV Auto-Data vs 107 hp | q01 conflicto | PASS (conflicto declarado) |
| Wikipedia Delta II vs PATAC-K | q01 conflicto | PASS |
| Cavalier Turbo ≠ 4.ª gen | q01 S6 | PASS |
| 3.5" DIC en LT El Salvador | q01 S8 | PASS |
| Manual 2021 84777383 A | q01 S7 | PASS |
| DLC J1962, pines 6/14 HS-CAN | q02 S1–S2 | PASS |
| Pin 1 LS-GMLAN en SI GM | q02 S3 | PASS |
| Cruze 2011 IPC Lo spd GMLAN | q02 S5 | PASS (analogía) |
| Malibu Limited 20-way, no Cruze | q02 S6 | PASS (caveat) |
| GMLAN 33.3 / 500 kbps | q03 S1 | PASS |
| NCV7356 33.3 / 83.3 kbps | q03 S2 | PASS |
| J2411 vía onsemi | q03 S2 | PASS |
| GMW3101 catálogo, no texto | q03 S3 | PASS |
| 科沃兹 SI índice HS+LIN | q03 S4 | PASS (no implica IPC) |
| Indicadores y DIC 2020 OM | q04 S1–S2 | PASS |
| Analogía origen sensores Cruze | q04 S4 | PASS (analogía) |
| MCP2515 + SN65HVD230 | q05 S1–S2 | PASS |
| dtoverlay mcp2515-can0 | q05 S3 | PASS |
| python-can SocketCAN | q05 S4 | PASS |
| NCV7356 ≠ transceiver ISO 11898-2 | q05 S2 | PASS |
| Boletín EE. UU./Canadá, no LATAM | q06 S2 | PASS |
| Sin DBC Cavalier | q06 S6 | PASS |
| 17vin SI de pago | q07 S1 | PASS |
| PN 84777383 A | q07 S2 | PASS |
| PN 23220664 Cruze SI | q07 S3 | PASS (Cruze) |
| NHTSA 2021 Cavalier | q07 S4 | PASS (sin IPC) |

Ningún claim crítico de pinout Cavalier o SPS Cruze queda sin respaldo válido.

---

## Fuentes débiles (declarar en el informe)

- **[S3] q02 / q03 / q06:** lemon-manuals, portal-diagnostov, tis-volt.by — copias de SI GM, no K216.
- **[S3] q03:** GMW3101 solo paráfrasis de catálogo.
- **[S3] q04:** infotainment.gm.com — no Cavalier.
- **[S3] q07:** 17vin comercial.
- **[S4] q05:** MathWorks SN65HVD230 (typo SI65 en origen).
- **[S4] q07:** PDFCoffee encabezado.
- **[S5] q02:** búsqueda Scribd — **no se usan pines**; solo se anota que el snippet no es fuente de pinout.

---

## Analogías (etiqueta obligatoria)

Cruze 2011 (LS-GMLAN), Malibu Limited 20-way, Volt BCM/LIN, 科沃兹 SI índice: **no son el conector ni el bus del IPC K216**.

---

## Conflictos (conservar)

1. Plataforma: Wikipedia Delta II vs GM Authority PATAC-K.  
2. Potencia: 107 hp Chevrolet vs 113 CV Auto-Data.  
3. Bus del IPC: analogía Cruze LS vs índice 科沃兹 HS+LIN.  
4. Formato de conector: analogía 20-way vs desconocido.  
5. Boletín odómetro: EE. UU./Canadá; tabla Cruze ilegible.

---

## Vacío de pinout Cavalier

No hay diagrama de pines del IPC Cavalier 2021 en fuentes abiertas usadas. El informe debe decirlo de frente.

---

## Veredicto

**Listo para redacción tal cual.** No se piden más correcciones de findings.

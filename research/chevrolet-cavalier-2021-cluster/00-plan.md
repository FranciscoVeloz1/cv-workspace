# Research Plan: Chevrolet Cavalier 2021 1.5L LT — cuadro de instrumentos

## Objective

Documentar, con fuentes recuperadas en esta sesión, el cuadro de instrumentos del Chevrolet Cavalier 2021 1.5L LT (identidad de plataforma, conector, protocolos, señales/sensores, y vías públicas para leer o emular el bus con Arduino o Raspberry Pi). El informe debe apoyar la decisión de construir un cuadro desde cero frente a reutilizar o emular el original.

## Scope

**In scope:**
- Identidad del modelo 2021 1.5L LT (mercados, plataforma GM, relación con Monza u otros clones) y del cluster (tipo de display, números de parte públicos).
- Conector físico del cuadro (familia de conector, pines de alimentación, tierra y buses) cuando exista documentación pública.
- Protocolos de comunicación (CAN/GMLAN, LIN, K-Line, Ethernet) y velocidades publicadas.
- Datos que el cuadro muestra y de qué módulos o sensores suelen provenir en arquitectura GM de esa generación.
- Hardware y software de interfaz de código abierto (Arduino, Raspberry Pi, transceptores CAN/LIN) descritos en documentación de fabricantes o normas.
- Límites: cifrado, gateway, programación VIN, o falta de DBC público que impidan un réplica plug-and-play.

**Out of scope:**
- Ingeniería inversa de firmware cifrado, exploits, bypass de inmovilizador o acceso no autorizado al vehículo.
- Reproducción verbatim de manuales de taller GM con copyright.
- Diseño eléctrico completo o código de producción del réplica (eso es implementación, no esta investigación).
- Cavalier estadounidense de generación anterior (1995–2005) salvo para desambiguar el modelo.

## Source policy

Prioritize official/primary sources. Reputable secondary sources allowed for corroboration
and context. Exclude unattributed or unverifiable sources. No invented data or citations
anywhere in this project.

Fuentes preferidas por tipo de pregunta: manual del propietario Chevrolet/GM, catálogos de partes GM/ACDelco, NHTSA/COFEPRIS/NOM cuando aplique, normas ISO 11898 / SAE J2284 / GMW, datasheets de transceptores, documentación de librerías (SocketCAN, mcp2515). Manuales de taller de pago (GM SI, Alldata) se citan solo si el contenido es accesible en esta sesión; si no, se registra como gap. Foros y listados de marketplace se usan como pistas, no como fuente de pinouts o IDs CAN.

## Sub-questions

| # | Question | Suggested source types | Status |
|---|----------|------------------------|--------|
| q01 | ¿Qué vehículo es el Cavalier 2021 1.5L LT (mercado, plataforma, motorización) y qué tipo de cuadro de instrumentos OEM se documenta (analógico, LCD, part numbers)? | Manual del propietario Chevrolet, catálogos de partes GM, fichas oficiales de producto | researched — pending validation |
| q02 | ¿Qué conector o puerto físico une el cuadro al arnés (familia, pines, alimentación, tierra, buses)? | Diagramas de cableado públicos, catálogos de conectores GM/Delphi, bulletins de servicio | researched — pending validation |
| q03 | ¿Qué protocolo(s) usa el cuadro (GMLAN HS/MS/LS-CAN, LIN, otros) y a qué velocidad? | Arquitectura eléctrica GM/GEM publicada, normas SAE/ISO, service info accesible | researched — pending validation |
| q04 | ¿Qué indicadores, gauges y mensajes muestra el cuadro, y de qué sensores o ECUs suelen alimentarse esos datos? | Manual del propietario, descripciones IPC/BCM GM, arquitectura de red | researched — pending validation |
| q05 | ¿Cómo se documenta la lectura o emulación de buses GM/CAN/LIN con Arduino o Raspberry Pi (transceptor, bitrate, stack)? | Datasheets MCP2515/TJA1050/MCP2003, SocketCAN, librerías oficiales | researched — pending validation |
| q06 | ¿Hay evidencia de que un réplica from-scratch *no* pueda hablar con el bus original (gateway, seguridad, VIN, LIN-only, DBC cerrado)? | Arquitectura GM de seguridad, service info, ausencia de DBC públicos | researched — pending validation |
| q07 | ¿Qué documentación de servicio, diagramas o piezas de recambio existen específicamente para este cluster, y qué huecos quedan? | GM parts, Chevrolet México/China, NHTSA, vendedores de IPC | researched — pending validation |

## Report outline

1. Introduction — objetivo DIY y desambiguación del modelo
2. Vehículo y hardware del cuadro (q01, q07)
3. Conector y pinout (q02)
4. Protocolos y red del vehículo (q03)
5. Datos del cuadro y origen de señales (q04)
6. Interfaz con Arduino / Raspberry Pi (q05)
7. Viabilidad y obstáculos de un réplica from-scratch (q06)
8. Synthesis / conclusion
9. Limitations & open questions
10. Sources

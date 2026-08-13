# PRD — Aplicación de finanzas personales

**Versión:** 1.0  
**Estado:** Definición funcional aprobada para PRD  
**Moneda inicial:** Pesos mexicanos (MXN)

> Este documento define el problema, el comportamiento esperado y las reglas del producto. No define arquitectura, endpoints, base de datos ni tecnologías.

## 1. Resumen

Aplicación privada de finanzas personales para registrar ingresos, gastos, cuentas, deudas y ahorro por mes. Su propósito principal es reemplazar una serie de hojas de cálculo mensuales por un flujo más fácil de actualizar y capaz de recalcular automáticamente la proyección de los meses posteriores.

La aplicación debe conservar el historial desde Enero en adelante, permitir editar cualquier mes y mostrar con claridad:

- cuánto dinero se espera gastar;
- cuánto se ha gastado realmente;
- cuánto crédito queda disponible;
- cuánto dinero existe en cada cuenta;
- cuánto se puede ahorrar al final del mes;
- cómo una modificación en un mes afecta los meses siguientes.

Cada usuario tendrá información independiente. Ningún usuario podrá consultar o modificar datos de otra persona.

## 2. Contexto y problema

El proceso actual se lleva en hojas de cálculo mensuales. Las capturas de Enero a Agosto muestran una evolución del mismo flujo:

- una sección para Débito;
- una sección para Crédito;
- una sección para el Fondo de ahorro Klar;
- servicios mensuales;
- mandado;
- salidas;
- extras;
- retiros de efectivo;
- límites por grupo;
- observaciones;
- totales esperados y reales;
- estimación de ahorro al cierre.

La hoja de `Simulacion.png` permite probar un escenario y estimar el ahorro de fin de mes. Sin embargo, cambiar una cantidad requiere editar manualmente la hoja y verificar varios totales. También es fácil confundir:

- saldo de una cuenta con crédito disponible;
- una compra con tarjeta con el pago de la deuda;
- un retiro de efectivo con un gasto;
- un gasto planeado con uno ya realizado;
- el ahorro del mes con el saldo acumulado del fondo Klar.

La aplicación debe convertir estas reglas en un flujo consistente, sin obligar al usuario a mantener fórmulas manualmente.

## 3. Objetivo del producto

Permitir que una persona:

1. registre su dinero disponible, ingresos y cuentas;
2. defina sus gastos recurrentes y presupuestos;
3. capture gastos reales con fecha exacta;
4. simule cambios en cualquier mes;
5. vea cómo esos cambios modifican los meses posteriores;
6. mantenga actualizado el saldo del Fondo Klar;
7. conozca su ahorro esperado y real sin duplicar movimientos;
8. reciba sugerencias prácticas cuando sus hábitos se alejen del presupuesto.

## 4. Objetivos de la primera versión

La primera versión debe lograr que el usuario pueda:

- iniciar sesión y acceder solo a sus datos;
- consultar una línea de tiempo mensual;
- crear y editar meses pasados, actuales y futuros;
- modificar un mes y recalcular los meses posteriores;
- definir cuentas configurables;
- registrar un ingreso mensual editable;
- registrar ingresos extraordinarios;
- administrar servicios mensuales recurrentes;
- administrar mandado, salidas y extras;
- registrar gastos con fecha, categoría, cuenta, estado y observaciones;
- distinguir entre gastos planeados, realizados y cancelados;
- mostrar u ocultar registros sin alterar los cálculos;
- registrar compras a crédito y pagos de tarjeta;
- registrar entradas y salidas del Fondo Klar;
- consultar gasto esperado, gasto real, disponible y ahorro;
- revisar sugerencias basadas en sus datos.

## 5. Fuera del alcance inicial

La primera versión no incluirá:

- conexión automática con bancos;
- importación automática de movimientos bancarios;
- lectura automática de estados de cuenta;
- datos compartidos entre usuarios;
- cuentas familiares o colaborativas;
- inversiones, acciones, criptomonedas o portafolios;
- préstamos distintos a la deuda de tarjetas;
- conversión entre monedas;
- recomendaciones de inversión;
- pagos automáticos;
- decisiones financieras ejecutadas automáticamente por la aplicación.

La importación desde hojas de cálculo puede considerarse después de validar el flujo manual.

## 6. Usuario principal y necesidades

### Usuario principal

Persona que administra sus finanzas mensuales con presupuestos por categoría y utiliza una o más cuentas, tarjetas o fondos de ahorro.

### Necesidades principales

- capturar información una sola vez;
- no perder el historial;
- corregir meses anteriores;
- planear gastos antes de realizarlos;
- comparar plan contra realidad;
- saber si una compra cabe en el presupuesto;
- anticipar el pago de la tarjeta;
- conocer cuánto puede ahorrar;
- conservar control sobre sus datos.

## 7. Decisiones funcionales adoptadas

Estas decisiones forman parte del alcance aprobado:

1. **Todos los meses serán editables.** Un cambio en un mes recalculará los saldos y proyecciones de los meses posteriores.
2. **Los movimientos tendrán fecha exacta**, no únicamente mes.
3. **Las compras a crédito reducirán el crédito disponible y crearán deuda pendiente.** El pago posterior se registrará desde otra cuenta.
4. **Las cuentas serán configurables por usuario.** Se podrán agregar, renombrar, desactivar y, cuando no tengan historial dependiente, eliminar.
5. **Los presupuestos se repetirán mediante plantillas.** Un cambio en una plantilla aplicado desde un mes modificará ese mes y todos los meses futuros; los meses anteriores conservarán sus datos.
6. **Existirá un ingreso mensual editable por mes**, con ingresos extraordinarios opcionales.
7. **Los gastos podrán ser planeados, realizados o cancelados.**
8. **Los registros podrán mostrarse u ocultarse.** Ocultarlos solo cambia la vista; no altera los cálculos.
9. **La moneda inicial será MXN.**
10. **El retiro combinado de Salidas y mandado tendrá un valor base fijo de $6,250.** Se tratará como movimiento de dinero físico, no como gasto.

## 8. Conceptos del producto

### Mes

Periodo calendario que contiene ingresos, presupuestos, movimientos, saldos iniciales, saldos finales y proyecciones.

Un mes puede ser:

- pasado;
- actual;
- futuro.

La clasificación depende de la fecha, pero ningún mes queda bloqueado: todos pueden editarse.

### Cuenta

Origen o destino del dinero. Puede ser una cuenta de débito, efectivo, tarjeta de crédito, fondo de ahorro u otro tipo que el usuario agregue.

### Movimiento

Entrada, salida, compra, pago, depósito, retiro o transferencia registrada con fecha y monto.

### Presupuesto

Monto esperado para una categoría dentro de un mes.

### Plantilla recurrente

Regla que genera una expectativa mensual, como Spotify, renta, una compra de mandado o el retiro de efectivo.

### Gasto

Movimiento que representa consumo de dinero o una compra. Una transferencia entre cuentas propias no es un gasto.

### Transferencia interna

Movimiento que cambia el dinero de una cuenta propia a otra, por ejemplo:

- pasar dinero de Débito a efectivo;
- pagar la tarjeta desde Débito;
- depositar dinero en Klar;
- pagar la tarjeta desde Klar.

Una transferencia interna no debe contarse como ingreso ni como gasto por segunda vez.

### Ahorro del mes

Dinero que queda disponible después de considerar ingresos y gastos del periodo, separado del saldo acumulado de los fondos de ahorro.

### Saldo acumulado

Dinero que permanece en una cuenta al sumar su saldo inicial, entradas y salidas.

## 9. Requisitos funcionales

### 9.1 Acceso y privacidad

La aplicación debe:

- permitir crear una cuenta de usuario;
- permitir iniciar sesión;
- permitir cerrar sesión;
- impedir el acceso a datos sin autenticación;
- mostrar a cada usuario únicamente sus propias cuentas, meses y movimientos;
- impedir que una acción sobre un usuario modifique datos de otro;
- permitir recuperar el acceso mediante un flujo de recuperación de cuenta;
- mostrar mensajes claros cuando el acceso falle.

### 9.2 Línea de tiempo mensual

La aplicación debe mostrar los meses en orden cronológico, desde el más antiguo hasta el más reciente.

El usuario debe poder:

- abrir cualquier mes;
- crear un mes futuro;
- editar un mes pasado;
- duplicar la estructura de un mes para iniciar otro;
- consultar el resumen de un mes sin abrir todo su detalle;
- identificar qué meses son históricos, actuales o proyectados;
- navegar entre meses consecutivos.

Cuando se modifique un mes:

- el saldo final del mes debe actualizarse;
- el saldo inicial del siguiente mes debe actualizarse;
- las proyecciones de los meses siguientes deben actualizarse;
- los cambios deben conservar su fecha y origen;
- los meses anteriores no deben cambiar automáticamente;
- la aplicación debe mostrar el impacto antes de confirmar una modificación que se propagará.

### 9.3 Cuentas configurables

El usuario debe poder:

- agregar una cuenta;
- nombrar la cuenta;
- seleccionar su tipo;
- indicar su saldo inicial;
- indicar si participa en las proyecciones;
- editar sus datos;
- renombrarla;
- desactivarla;
- consultar sus movimientos y saldo.

Tipos iniciales:

- Débito;
- Efectivo;
- Crédito;
- Fondo de ahorro;
- Otro.

Las cuentas de crédito deben permitir definir:

- límite de crédito;
- deuda inicial;
- crédito disponible;
- pagos realizados;
- fecha de corte o fecha de pago, si el usuario desea usarla.

Una cuenta con historial no debe desaparecer de los reportes históricos por ser desactivada. Debe conservarse como cuenta histórica.

### 9.4 Ingresos

El usuario debe poder:

- definir el ingreso mensual esperado;
- modificarlo para un mes específico;
- aplicar un cambio desde un mes hacia los meses futuros;
- registrar un ingreso extraordinario;
- asignar fecha, concepto y monto al ingreso extraordinario;
- consultar el ingreso esperado y el recibido.

El ingreso mensual no se debe asumir permanente para todos los meses: cada mes debe conservar el valor que le corresponde.

### 9.5 Servicios mensuales

Los servicios mensuales representan gastos fijos o casi fijos que llegan con regularidad.

El usuario debe poder:

- crear un servicio;
- indicar nombre y monto esperado;
- asignar cuenta de pago;
- indicar fecha esperada;
- editar el monto;
- pausar el servicio;
- eliminarlo de meses futuros;
- registrar un monto real distinto;
- agregar observaciones.

Ejemplos observados:

- Spotify;
- Netflix;
- Internet;
- telefonía;
- gasolina;
- renta;
- luz;
- boletos;
- servicios digitales;
- alimento para mascotas.

La aplicación debe tratar estos servicios como compromisos recurrentes, pero permitir cambios porque el usuario puede cancelar, reemplazar o agregar servicios.

### 9.6 Mandado

La configuración inicial de mandado será:

- tres compras planeadas por mes;
- presupuesto base de $2,000 por compra;
- presupuesto mensual base de $6,000.

El usuario debe poder:

- editar el presupuesto de una compra;
- cambiar la fecha;
- registrar el gasto real;
- marcar una compra como cancelada;
- agregar una compra extraordinaria;
- eliminar una compra futura;
- agregar observaciones;
- consultar el total planeado, real y restante.

El presupuesto base debe ser una plantilla modificable. Si se cambia desde un mes, el cambio se aplica a ese mes y a los meses futuros seleccionados por el usuario.

### 9.7 Salidas

La configuración inicial de salidas será:

- cuatro salidas planeadas por mes;
- presupuesto base de $500 por salida;
- presupuesto mensual base de $2,000.

El usuario debe poder:

- agregar más salidas;
- eliminar salidas;
- cambiar el presupuesto;
- cambiar la fecha;
- registrar el gasto real;
- marcar una salida como cancelada;
- añadir observaciones;
- consultar el total planeado, real y restante.

### 9.8 Extras

Extras representa gastos variables no recurrentes.

La configuración inicial será:

- presupuesto mensual base de $1,400.

El usuario debe poder:

- registrar uno o varios extras;
- asignar fecha y cuenta;
- definir monto planeado;
- registrar monto real;
- crear una nueva categoría de extra;
- cancelar un extra;
- agregar observaciones;
- consultar cuánto presupuesto queda.

El presupuesto de extras debe poder cambiar por mes sin obligar a modificar los meses históricos.

### 9.9 Retiro de Salidas y mandado

El retiro de efectivo combinado tendrá un valor base de $6,250.

La aplicación debe representarlo como una transferencia desde una cuenta de origen hacia efectivo:

- no debe contarlo como gasto;
- debe disminuir el saldo de la cuenta de origen;
- debe aumentar el saldo de efectivo;
- debe permitir consultar cuánto efectivo queda;
- debe permitir relacionar gastos de Mandado y Salidas con ese efectivo;
- debe mostrar si el retiro fue suficiente, insuficiente o excedente frente al gasto real.

El valor base podrá cambiarse para meses futuros si la realidad del usuario cambia.

### 9.10 Movimientos con fecha y estado

Cada movimiento de gasto debe poder incluir:

- fecha exacta;
- concepto;
- categoría;
- cuenta;
- monto planeado;
- monto real;
- estado;
- observaciones.

Estados:

#### Planeado

Se considera para la proyección y el gasto esperado, pero no para el gasto real.

#### Realizado

Se considera para el gasto real y actualiza el saldo correspondiente.

#### Cancelado

No se considera gasto real. Puede conservarse para explicar por qué un gasto planeado no ocurrió.

La aplicación debe permitir:

- filtrar por estado;
- ocultar movimientos cancelados;
- ocultar movimientos planeados;
- mostrar de nuevo los movimientos ocultos;
- filtrar por cuenta;
- filtrar por categoría;
- filtrar por rango de fechas.

La visibilidad no debe cambiar ningún total, saldo o proyección.

### 9.11 Crédito

Una compra con crédito debe:

- pertenecer a una tarjeta específica;
- tener fecha, concepto, categoría y monto;
- reducir el crédito disponible proyectado o real según su estado;
- aumentar la deuda de la tarjeta cuando sea realizada;
- aparecer como obligación pendiente;
- permitir registrar el pago posteriormente.

El pago de tarjeta debe:

- indicar la cuenta de origen;
- disminuir la deuda de la tarjeta;
- disminuir el saldo de la cuenta de origen;
- no volver a contar la compra como un gasto;
- poder planearse antes de realizarse;
- mostrar el impacto en el flujo de efectivo.

Por defecto, no se deben crear gastos de crédito. El usuario podrá agregarlos cuando los necesite.

La aplicación debe distinguir claramente:

- límite total;
- deuda actual;
- crédito disponible;
- compras planeadas;
- compras realizadas;
- pagos planeados;
- pagos realizados.

### 9.12 Fondo de ahorro Klar

El fondo debe mantenerse como una cuenta con saldo acumulado.

El usuario debe poder:

- indicar el saldo inicial;
- registrar depósitos;
- registrar retiros;
- registrar pagos de tarjeta desde Klar;
- registrar transferencias hacia Klar;
- consultar el saldo posterior a cada movimiento;
- consultar entradas y salidas por mes;
- agregar observaciones;
- corregir movimientos anteriores.

La aplicación debe separar:

- saldo disponible en Klar;
- ahorro depositado durante el mes;
- retiros del fondo;
- pagos de tarjeta realizados desde Klar.

Un movimiento entre Débito y Klar no debe contarse como ingreso ni como gasto.

### 9.13 Simulación

La simulación debe permitir editar los valores que influyen en el cierre del mes, incluyendo:

- ingreso mensual;
- servicios;
- mandado;
- salidas;
- extras;
- retiro de efectivo;
- compras de crédito;
- pagos de tarjeta;
- depósitos o retiros de Klar;
- fechas;
- estados de movimientos.

Antes de guardar un cambio propagado, la aplicación debe mostrar:

- mes desde el cual se aplicará;
- meses afectados;
- cambio en gasto esperado;
- cambio en gasto real, si corresponde;
- cambio en saldo;
- cambio en ahorro proyectado;
- cambio en deuda o crédito disponible.

La simulación debe poder consultarse sin modificar datos hasta que el usuario confirme.

### 9.14 Resumen mensual

Cada mes debe mostrar, como mínimo:

- ingreso esperado;
- ingreso recibido;
- saldo inicial por cuenta;
- gastos esperados;
- gastos reales;
- crédito utilizado;
- crédito disponible;
- pagos de tarjeta;
- saldo de Klar;
- retiro de efectivo;
- efectivo restante;
- ahorro esperado;
- ahorro real;
- diferencia entre plan y realidad;
- advertencias relevantes.

El usuario debe poder ver un resumen general y entrar al detalle por cuenta o categoría.

### 9.15 Sugerencias

La aplicación debe generar sugerencias basadas en los datos del usuario. Deben ser informativas y explicar de dónde sale cada recomendación.

Ejemplos:

- una categoría está por superar su límite;
- un gasto real supera repetidamente el presupuesto;
- el ahorro proyectado disminuyó frente al mes anterior;
- el pago de crédito futuro puede dejar poco efectivo disponible;
- el retiro de $6,250 no cubrió el gasto real de Mandado y Salidas;
- existe dinero no asignado que podría destinarse a ahorro;
- un servicio recurrente aumentó de costo;
- se registraron demasiados extras en un mismo mes;
- una compra planeada cancelada mejora la proyección;
- el saldo de Klar puede cubrir un pago sin afectar el efectivo del mes.

Las sugerencias no deben modificar datos por sí solas. El usuario debe decidir si aplica un cambio.

## 10. Reglas de cálculo

### 10.1 Saldos de cuentas no crediticias

Saldo final:

**saldo inicial + entradas - salidas**

Las transferencias internas solo afectan las cuentas de origen y destino. No generan un ingreso o gasto adicional.

### 10.2 Crédito disponible

Crédito disponible:

**límite de crédito - deuda actual**

Las compras planeadas pueden mostrarse como crédito disponible proyectado, pero no deben reducir la deuda real hasta marcarse como realizadas.

### 10.3 Gasto esperado

El gasto esperado incluye:

- movimientos planeados;
- servicios recurrentes activos;
- presupuestos de Mandado;
- presupuestos de Salidas;
- presupuesto de Extras;
- compras de crédito planeadas.

No incluye:

- movimientos cancelados;
- transferencias internas;
- depósitos entre cuentas propias.

### 10.4 Gasto real

El gasto real incluye únicamente movimientos realizados que representan consumo o compra.

El pago de una tarjeta no vuelve a sumar el gasto original.

### 10.5 Presupuesto restante

Presupuesto restante:

**límite de categoría - gasto realizado de categoría**

Debe mostrarse separado del presupuesto proyectado restante cuando existan gastos planeados todavía no realizados.

### 10.6 Ahorro esperado

El producto debe mostrar dos perspectivas relacionadas:

- **Consumo esperado:** ingresos esperados menos todos los consumos planeados, incluyendo compras de crédito.
- **Efectivo esperado al cierre:** dinero que permanecerá disponible en cuentas de débito y efectivo después de ingresos, pagos planeados, gastos pagados y movimientos planeados hacia o desde fondos de ahorro.

La cifra principal de **ahorro esperado** debe representar el efectivo esperado al cierre, porque responde cuánto dinero quedará disponible al terminar el mes. La aplicación debe mostrar por separado la deuda y los compromisos de crédito para evitar presentar como ahorro dinero que ya está comprometido.

Una compra de crédito cuenta una sola vez como consumo. Si su pago ocurre en otro mes, el pago afecta el efectivo de ese mes, pero no vuelve a sumar el consumo.

Las transferencias internas no deben duplicar el gasto ni el ingreso.

### 10.7 Ahorro real

El ahorro real se calcula con ingresos recibidos, pagos y gastos realizados, respetando la fecha en que cada movimiento afecta el efectivo. Las compras de crédito y la deuda pendiente deben mostrarse por separado cuando todavía no se han pagado.

El resultado debe incluir un detalle que explique:

- ingresos recibidos;
- gastos pagados;
- pagos de crédito;
- movimientos hacia o desde Klar;
- efectivo disponible;
- deuda pendiente.

### 10.8 Recalculo de meses posteriores

Cuando una modificación cambie el saldo final de un mes:

- el saldo inicial del mes siguiente debe cambiar;
- los saldos derivados deben actualizarse;
- las proyecciones posteriores deben actualizarse;
- los movimientos históricos del mes anterior deben conservar su fecha;
- las fórmulas deben producir el mismo resultado si el usuario revisa nuevamente la línea de tiempo.

## 11. Experiencia principal

### Entrada a la aplicación

Después de iniciar sesión, el usuario debe llegar al resumen del mes actual.

El resumen debe responder rápidamente:

- cuánto dinero hay disponible;
- cuánto falta gastar;
- cuánto crédito queda;
- cuánto se espera ahorrar;
- qué categorías requieren atención.

### Flujo para crear o actualizar un mes

1. Seleccionar el mes.
2. Revisar saldo inicial e ingreso.
3. Revisar plantillas recurrentes.
4. Agregar, editar o cancelar movimientos.
5. Confirmar movimientos realizados.
6. Revisar gastos esperados contra reales.
7. Revisar crédito, pagos y Klar.
8. Revisar ahorro proyectado.
9. Consultar impacto en meses posteriores.

### Flujo para corregir un mes anterior

1. Abrir el mes histórico.
2. Editar el movimiento o presupuesto.
3. Ver el impacto desde ese mes hacia adelante.
4. Confirmar la propagación.
5. Revisar el resumen actualizado de los meses afectados.

## 12. Criterios de aceptación del MVP

El MVP se considera funcional cuando:

1. Un usuario no autenticado no puede acceder a ningún dato financiero.
2. Dos usuarios pueden tener meses, cuentas y movimientos con el mismo nombre sin compartir información.
3. El usuario puede crear una cuenta Débito, Crédito y Fondo Klar.
4. El usuario puede agregar otra cuenta sin modificar las anteriores.
5. El sistema crea las reglas base de Mandado, Salidas, Extras y retiro de efectivo.
6. Mandado inicia con tres compras de $2,000.
7. Salidas inicia con cuatro salidas de $500.
8. Extras inicia con presupuesto de $1,400.
9. El retiro combinado inicia con $6,250 y no se cuenta como gasto.
10. El usuario puede agregar, quitar o modificar servicios mensuales.
11. El usuario puede registrar un movimiento con fecha exacta.
12. Un movimiento planeado aparece en la proyección, pero no en el gasto real.
13. Un movimiento realizado aparece en el gasto real y afecta el saldo correspondiente.
14. Un movimiento cancelado no afecta gasto real ni saldo.
15. Ocultar y mostrar movimientos no cambia totales ni proyecciones.
16. Una compra de crédito reduce crédito disponible y aumenta deuda cuando se realiza.
17. Un pago de tarjeta reduce la deuda y el saldo de la cuenta de origen, sin duplicar el gasto.
18. Un depósito o retiro de Klar actualiza su saldo acumulado.
19. Una modificación en Marzo actualiza los saldos y proyecciones de Abril en adelante.
20. Los meses anteriores al cambio conservan sus datos.
21. El sistema muestra gasto esperado, gasto real y ahorro esperado.
22. El usuario puede consultar qué movimientos explican cada total.
23. La aplicación muestra advertencias cuando el gasto supera un límite o el ahorro proyectado se vuelve negativo.
24. El usuario puede aceptar o descartar una sugerencia sin que la aplicación cambie datos automáticamente.

## 13. Riesgos y decisiones de producto

### Riesgo: doble conteo de tarjetas

Una compra con crédito y el pago de esa compra pueden sumarse dos veces si no se distinguen. La aplicación debe tratar la compra como gasto y el pago como transferencia de deuda.

### Riesgo: doble conteo del retiro de efectivo

El retiro de $6,250 no es consumo. Solo debe mover dinero hacia efectivo. Los gastos de Mandado y Salidas representan el consumo posterior.

### Riesgo: propagación inesperada

Editar una plantilla puede cambiar muchos meses. Antes de confirmar, la aplicación debe mostrar el rango afectado y la diferencia en saldos y ahorro.

### Riesgo: pérdida de historial

Eliminar un servicio, cuenta o categoría no debe borrar el significado de los movimientos históricos. La aplicación debe conservar el contexto histórico.

### Riesgo: categorías cambiantes

Las hojas cambian de estructura entre Enero y Agosto. El producto debe conservar categorías base consistentes y permitir categorías personalizadas para no forzar todos los gastos dentro de una estructura rígida.

### Riesgo: confusión entre ahorro y saldo de Klar

El ahorro del mes y el saldo acumulado de Klar deben mostrarse como conceptos separados y con sus respectivos movimientos.

## 14. Evolución posterior

Después de validar el MVP, se pueden considerar:

- importar meses existentes desde hojas de cálculo;
- comparar varios meses con gráficas;
- metas de ahorro;
- recordatorios de fechas de pago;
- detección de servicios recurrentes;
- presupuestos por quincena;
- múltiples fuentes de ingreso;
- cuentas compartidas opcionales;
- integración con bancos;
- reportes exportables;
- reglas personalizadas de sugerencias.

## 15. Definición de éxito del producto

El producto cumple su propósito cuando el usuario puede actualizar un gasto o presupuesto en menos pasos que en su hoja actual, entender inmediatamente el efecto sobre el ahorro y mantener sus saldos sin recalcular fórmulas manualmente.

La señal principal de éxito es que el usuario pueda responder, para cualquier mes:

- cuánto dinero entró;
- cuánto se esperaba gastar;
- cuánto se gastó realmente;
- cuánto crédito quedó;
- cuánto dinero permanece en Klar;
- cuánto ahorro se espera al cierre;
- qué cambios provocaron ese resultado.

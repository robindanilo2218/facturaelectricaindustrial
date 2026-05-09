# EnergíaApp - Gestión Integral de Energía Industrial (Factura Eléctrica)

**EnergíaApp** es una Aplicación Web Progresiva (PWA) diseñada para ayudar a las plantas industriales a procesar, analizar y almacenar de forma segura los datos de sus facturas eléctricas. Su objetivo principal es traducir los cobros del proveedor eléctrico en indicadores de eficiencia y costos de producción (por ejemplo, el costo energético por metro cuadrado fabricado).

## ¿Qué es y cómo funciona?

La aplicación funciona de manera completamente local en el navegador del usuario (o instalada como PWA para uso offline). Permite:
1. **Subir archivos CSV**: El usuario exporta o digita su recibo eléctrico en formato CSV y lo sube al sistema.
2. **Procesamiento Automático**: La aplicación lee y categoriza automáticamente los cobros (energía, potencia máxima, demanda firme, IVA, penalizaciones por bajo factor de potencia, etc.).
3. **Cálculo de Eficiencia**: En la pestaña de la *Calculadora*, el usuario ingresa las horas productivas de sus máquinas. El sistema prorratea el costo total sin IVA de la factura, aislando la "Energía Fantasma" (energía gastada cuando no se produce) de la energía útil.
4. **Almacenamiento Local**: Todo el historial se guarda en una base de datos interna del navegador (IndexedDB) y se puede exportar e importar en archivos de respaldo `.fel` o `.json`.

---

## Explicación de la Aplicación (Módulos Principales)

### 1. Historial y Análisis de Factura (Dashboard)
Esta sección presenta una tabla comparativa de los cobros a través de los meses.
*   **Matriz Comparativa**: Permite seleccionar un "Mes Base" y compararlo contra periodos anteriores o posteriores.
*   **Detalle Expandible**: Al hacer clic en un concepto de cobro, se expande para mostrar su equivalente en Dólares/Quetzales, costo unitario (si aplica) y el costo equivalente por unidad producida (m²).

### 2. Eficiencia y Costo de Producción (Calculadora)
Permite hacer la distribución real del costo de la factura en el piso de producción:
*   **Paso 1 (Datos de Factura)**: Se toman los kWh consumidos y el monto total de la factura sin IVA.
*   **Paso 2 (Registro de Máquinas)**: Se registra la potencia de cada máquina, tiempo productivo, paros de línea y la producción total lograda (ej. m²).
*   **Paso 3 (Resultados y KPIs)**: El sistema revela:
    *   **Energía Fantasma / Servicios**: kWh y dinero desperdiciado o no directamente atribuible a la producción (compresores, iluminación en paros, etc.).
    *   **Costo Real por m²**: Cuánto costó energéticamente fabricar cada unidad en cada máquina específica, con gráficos comparativos.

---

## Partes Claves de la Factura Eléctrica Industrial

El sistema procesa automáticamente estos conceptos típicos de una factura en tarifa industrial:

*   **Energía Consumida (kWh)**: La cantidad física de energía utilizada en el mes.
*   **Precio de Energía Cobrada**: El precio base por kWh. Muchas veces la factura tiene "Ajustes de Precio" que la aplicación consolida para dar el *Precio Real*.
*   **Potencia Máxima (kW)**: El pico más alto de demanda de energía que la planta requirió durante el mes en cualquier horario.
*   **Potencia Pico (kW)**: La demanda máxima registrada en horas pico (generalmente de 18:00 a 22:00 hrs), cuyo cobro suele ser el más caro.
*   **Demanda Firme**: Potencia contratada reservada para la planta.
*   **Bajo Factor de Potencia (Penalización)**: Multa aplicada si la planta tiene motores o equipo inductivo sin bancos de capacitores adecuados. La app rastrea esto incluso en meses donde el cargo es $0, para no perder visibilidad.
*   **Total Sin IVA / Con IVA**: Separación vital, ya que el cálculo de costo de manufactura (costo de producción) siempre se debe hacer en base al subtotal *Sin IVA*.

---

## Historial de Versiones y Mejoras

### v3.3.7 (Actual)
*   **Persistencia de Conceptos Educativos**: El concepto "Bajo Factor de Potencia" ahora se inyecta programáticamente con valor cero en meses donde no hay penalización. Esto mantiene accesibles las descripciones de ayuda y la gráfica anual para mejor gestión de energía.
*   **Corrección de UI**: Mejoras en el z-index de los tooltips ("costo de energía generación") para evitar superposiciones con los conceptos expandibles.

### v3.3.0 - v3.3.5
*   **Soporte Multi-CSV**: Se agregó soporte para cargar múltiples archivos CSV simultáneamente para la reconstrucción rápida del historial.
*   **Persistencia Total JSON/FEL**: Inclusión de todas las variables de producción y métricas en el archivo de respaldo (`.fel`).
*   **Seguridad y UX**: Implementación de código de seguridad (PIN) para prevenir borrados accidentales de la base de datos.
*   **Mejoras de Visibilidad**: Controles de navegación y matriz de selección movidos a una sección fija (*sticky*) para que siempre estén visibles independientemente del scroll y de la pestaña activa.

### v3.2.0 (PWA & Offline)
*   **Estructura PWA**: Conversión a *Progressive Web App* modular (archivos js y css separados).
*   **Trabajo Offline (Service Worker)**: Implementación de la estrategia de caché para garantizar que la app y el framework Chart.js carguen incluso sin acceso a internet.
*   **Instalable**: Se añadió el `manifest.json` y los íconos de Apple/Android para añadir a pantalla de inicio.

### Versiones Anteriores
*   **v3.1.x**: Ajustes de tipo de cambio, soporte multimoneda (USD / GTQ), diseño de panel tipo tarjeta.
*   **v3.0.x**: Lanzamiento inicial de la estructura unificada (Dashboard + Calculadora).

---
*Distribuido bajo la Licencia MIT. Mantenido por crgm.app.*

# JPB SRL - Sistema de Control Financiero y Presupuestario de Obras

Sistema integral para la gestión, seguimiento de costos, control presupuestario y liquidaciones bimonetarias (ARS / USD) de obras de construcción y arquitectura para **JPB SRL**.

---

## 🚀 Características Principales

- **Gestión Multi-Obra**: Control individualizado por obra y visión consolidada "Macro (Todas las Obras)".
- **Control Bimonetario Inteligente (USD / ARS)**:
  - Presupuestos y metas de costo fijados en dólares (`u$s USD`).
  - Imputación de comprobantes y gastos en Pesos Argentinos (`$ ARS`) con conversión por tipo de cambio (`t.c.`) o carga directa en dólares.
  - Indicadores clave de rendimiento por metro cuadrado (`USD/m²`, avance financiero vs. remanente).
- **Control Presupuestario y Desviaciones**:
  - Matriz de rubros de costo (Materiales, Mano de Obra, Aberturas, Honorarios, Climatización, Subcontratos, Pisos, Pintura, etc.).
  - Semáforos visuales de alerta por desvío presupuestario y saldo disponible.
- **Origen y Aplicación de Fondos**:
  - Clasificación de ingresos por concepto (Aportes de Propietarios, Venta de Divisas, Pagos de Terceros, Certificados de Obra).
  - Control de estados de pago (Pagado, Pendiente, En Revisión).
- **Importación y Exportación Excel**:
  - Descarga de plantilla oficial en `.xlsx`.
  - Importación masiva de comprobantes con validación de tipos de cambio y rubros.
  - Exportación de reportes detallados y resúmenes ejecutivos.
- **Seguridad y Roles (RBAC con Firebase Firestore & Auth)**:
  - Roles diferenciados: `Superadmin`, `Administrador`, `Director de Obra` y `Comitente / Lector`.
  - Registro de auditoría y log de actividad.
  - Copias de seguridad (Backup JSON) y restauración controlada.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend / Servidor**: Node.js, Express, Vite, ESBuild.
- **Base de Datos & Autenticación**: Firebase Firestore & Firebase Auth.
- **Procesamiento de Datos**: SheetJS (xlsx) para manejo avanzado de planillas de cálculo.

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/jpb-srl-control-financiero.git
cd jpb-srl-control-financiero
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copiar el archivo de ejemplo y configurar las credenciales necesarias:
```bash
cp .env.example .env
```

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 5. Compilar para Producción
```bash
npm run build
```

### 6. Ejecutar en Producción
```bash
npm start
```

---

## 🏢 Arquitectura del Proyecto

```text
├── src/
│   ├── components/         # Modales, tablas, tarjetas y vistas principales
│   ├── data/               # Datos iniciales y estructuras de cuentas maestras
│   ├── services/           # Conectores de Firebase Firestore & Auth
│   ├── utils/              # Formateadores numéricos y de moneda (formato AR/USD)
│   ├── App.tsx             # Componente raíz y enrutador de vistas
│   ├── types.ts            # Definiciones de TypeScript e interfaces del dominio
│   └── main.tsx            # Punto de entrada del cliente React
├── server.ts               # Servidor Express y middleware de Vite / producción
├── firestore.rules         # Reglas de seguridad de base de datos
├── package.json            # Scripts y dependencias
└── vite.config.ts          # Configuración de compilación Vite y Tailwind
```

---

## 📄 Licencia

Desarrollado para uso exclusivo y gestión interna de **JPB SRL**. Todos los derechos reservados.

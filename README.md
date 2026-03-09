# POS Bar - Sistema Modular

Sistema POS para bares construido con Electron, React (Vite + TS), better-sqlite3 y Socket.IO.

## Requisitos
- Node.js 18+
- Python (para compilar better-sqlite3 en Windows)
- C++ Build Tools (Visual Studio)

## Instalación
```bash
npm install
```

## Desarrollo
Para iniciar el entorno de desarrollo (React + Electron + Express):
```bash
npm run dev
```

## Construcción y Empaquetado (Windows .exe)
Para compilar y generar el instalador `.exe`:
```bash
npm run dist
```
El instalador se generará en la carpeta `release/`.

## Credenciales por defecto
- **Admin**: admin / admin
- **Cajero**: cajero / cajero

## Rutas Web
- **App Principal**: `http://localhost:5173`
- **Pedidos (Móvil)**: `http://localhost:5173/pedidos?t=TWVzYSAwMQ==` (o IP local en red)

## Advertencias de Seguridad
- Cambia las contraseñas por defecto en el primer uso.
- Configura correctamente el `.env` con la IP local del servidor para que los QRs funcionen en la red LAN.
- La API Key de YouTube debe estar restringida para evitar abusos.

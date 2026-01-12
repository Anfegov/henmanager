# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

HenManager es un sistema fullstack de gestión avícola para el seguimiento de producción de huevos, ventas, créditos, insumos e inventario. Usa estructura monorepo con aplicaciones backend y frontend separadas.

## Stack Tecnológico

- **Backend**: ASP.NET Core 8, MongoDB 7, autenticación JWT
- **Frontend**: React 18, Vite 5, Material-UI 6, Axios
- **Base de Datos**: MongoDB con 9 colecciones (Users, Roles, permissions, HenBatches, EggProductions, Sales, Payments, Supplies, Customers)

## Comandos de Desarrollo

### Docker Compose (Recomendado)
```bash
docker-compose up              # Iniciar servicios (frontend:5173, api:5001, mongo:27018)
docker-compose down            # Detener servicios
docker-compose build           # Reconstruir imágenes
```

### Backend (Local)
```bash
cd backend
dotnet restore                 # Instalar paquetes
dotnet run                     # Iniciar API (https://localhost:29295)
dotnet test                    # Ejecutar pruebas xunit
```

### Frontend (Local)
```bash
cd frontend
npm install                    # Instalar dependencias
npm run dev                    # Iniciar servidor dev (localhost:5173)
npm run build                  # Build de producción
```

## Arquitectura

### Estructura Backend
- `Controllers/` - 12 controladores API (Auth, Sales, Credits, Production, Batches, etc.)
- `Domain/Entities.cs` - Todos los modelos MongoDB heredan de `MongoEntity` (Id GUID con representación Standard)
- `Data/MongoDbContext.cs` - Contexto MongoDB con 9 colecciones
- `Data/PermissionSeeder.cs` y `Data/UserRoleSeeder.cs` - Siembra de datos al iniciar

### Estructura Frontend
- `src/api/` - Módulos cliente API (uno por dominio), `axiosClient.js` maneja URL base y token de auth
- `src/auth/` - AuthContext, ProtectedRoute (rutas basadas en permisos), hook useAuth
- `src/pages/` - 10 páginas de funcionalidades
- `src/components/Layout.jsx` - Wrapper del layout principal

### Sistema de Autorización
Los tokens JWT incluyen claims de permisos. El backend usa autorización basada en políticas en `Program.cs` con 13 políticas de permisos:
- Ventas: `RegisterSale`, `ViewSales`, `RegisterPayment`, `CancelCredit`
- Lotes: `ViewBatch`, `CreateBatch`, `CloseBatch`
- Producción: `RegisterDailyProduction`, `ViewProduction`
- Insumos: `RegisterSupply`, `ViewSupplies`
- Admin: `ViewReports`, `ManageUsers`, `ManageRoles`, `ManageCustomers`

El frontend verifica permisos mediante el componente `ProtectedRoute` y `AuthContext`.

### Patrones Clave
- Los IDs de entidades usan `GuidRepresentation.Standard` para almacenamiento binario de GUID en MongoDB
- Hash de contraseñas via ASP.NET Identity `PasswordHasher<User>`
- Expiración JWT: 8 horas
- CORS: Todos los orígenes habilitados (modo desarrollo)

## Configuración

### Backend (`appsettings.json`)
- `Mongo:ConnectionString` - Conexión MongoDB (default: `mongodb://localhost:27017`)
- `Mongo:Database` - Nombre de base de datos (`HenManagerDb`)
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` - Configuración JWT

### Frontend
- `VITE_API_BASE_URL` - URL base del API (default: `http://localhost:5001/api`)

## Credenciales por Defecto
- Login admin: `admin` / `Admin123*`

## URLs de Servicios (Docker)
- Frontend: http://localhost:5173
- API: http://localhost:5001/api
- Swagger: http://localhost:5001/swagger
- MongoDB: localhost:27018

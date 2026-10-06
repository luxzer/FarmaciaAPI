# Farmacia API

Web API REST construida con **ASP.NET Core 9** para la gestión de una farmacia.
Expone el CRUD completo de dos tablas (`medicamentos` y `clientes`) sobre
**MySQL**, usando **ADO.NET puro (MySqlConnector)** sin ningún ORM.

**Integrantes:** Luis Calderón (22-1392) · Rafael Ureña (22-1836)

---

## Requisitos previos

| Requisito | Versión usada |
|---|---|
| .NET SDK | 9.0.200 |
| MySQL Server | 8.4 |

Verificar que el SDK esté instalado:

```bash
dotnet --version
```

---

## Puesta en marcha (3 pasos)

### 1. Crear la base de datos

El script [`FarmaciaAPI/Database/01-schema.sql`](FarmaciaAPI/Database/01-schema.sql)
hace todo de una sola vez: crea la base de datos `farmacia`, el usuario
`farmacia_app`, las tres tablas y los datos de prueba. Se puede ejecutar varias
veces sin duplicar nada.

**Opción A — MySQL Workbench** (la más simple si no recuerdas la contraseña de
root, porque Workbench la tiene guardada):

1. Abrir MySQL Workbench y entrar a la conexión local.
2. `File ▸ Open SQL Script…` y seleccionar `FarmaciaAPI/Database/01-schema.sql`.
3. Pulsar el botón del rayo (**Execute**).
4. Al final debe aparecer una tabla con el conteo de las tres tablas.

**Opción B — línea de comandos:**

```bash
mysql -u root -p < FarmaciaAPI/Database/01-schema.sql
```

En Windows, si `mysql` no está en el PATH:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p -e "source FarmaciaAPI/Database/01-schema.sql"
```

### 2. Verificar la cadena de conexión

El script crea el usuario `farmacia_app` con la contraseña `Farmacia2026*`, que
es exactamente la que ya trae `FarmaciaAPI/appsettings.json`:

```json
"ConnectionStrings": {
  "FarmaciaDb": "Server=localhost;Port=3306;Database=farmacia;User ID=farmacia_app;Password=Farmacia2026*;"
}
```

Si cambias la contraseña en el script SQL, cámbiala también aquí.

**Alternativa recomendada** (no deja la contraseña en el repositorio):

```powershell
# PowerShell
$env:ConnectionStrings__FarmaciaDb = "Server=localhost;Port=3306;Database=farmacia;User ID=farmacia_app;Password=TU_CLAVE;"
```

```bash
# Bash
export ConnectionStrings__FarmaciaDb="Server=localhost;Port=3306;Database=farmacia;User ID=farmacia_app;Password=TU_CLAVE;"
```

`IConfiguration` da prioridad a las variables de entorno sobre el archivo JSON,
así que no hay que tocar el código.

### 3. Ejecutar

```bash
cd FarmaciaAPI
dotnet run
```

Swagger queda disponible en la **raíz** del sitio:

- https://localhost:7218
- http://localhost:5239

Para comprobar que todo quedó bien, abrir `GET /api/diagnostico/salud`: debe
responder **200** con `"baseDatos": "conectada"`.

---

## Endpoints

### Medicamentos — `api/medicamentos`

| Verbo | Ruta | Operación |
|---|---|---|
| GET | `/api/medicamentos` | Lista todos (filtro opcional `?nombre=`) |
| GET | `/api/medicamentos/{id}` | Obtiene uno por Id |
| GET | `/api/medicamentos/stock-bajo` | Los que están bajo el umbral de `appsettings.json` |
| POST | `/api/medicamentos` | Crea uno nuevo |
| PUT | `/api/medicamentos/{id}` | Actualiza uno existente |
| DELETE | `/api/medicamentos/{id}` | Elimina uno |

### Clientes — `api/clientes`

| Verbo | Ruta | Operación |
|---|---|---|
| GET | `/api/clientes` | Lista todos (filtro opcional `?buscar=`) |
| GET | `/api/clientes/{id}` | Obtiene uno por Id |
| POST | `/api/clientes` | Crea uno nuevo (valida documento único) |
| PUT | `/api/clientes/{id}` | Actualiza uno existente |
| DELETE | `/api/clientes/{id}` | Elimina uno |

### Diagnóstico — `api/diagnostico`

| Verbo | Ruta | Operación |
|---|---|---|
| GET | `/api/diagnostico/salud` | Estado de la API y de la conexión a la BD |
| GET | `/api/diagnostico/auditoria` | Últimos movimientos registrados |

---

## Ejemplos de cuerpo JSON

**POST `/api/medicamentos`**

```json
{
  "nombre": "Acetaminofen 500mg",
  "laboratorio": "MK",
  "descripcion": "Analgesico, caja por 24 tabletas",
  "precio": 5400.00,
  "stock": 80,
  "requiereReceta": false,
  "fechaVencimiento": "2027-12-31",
  "activo": true
}
```

**POST `/api/clientes`**

```json
{
  "nombres": "Ana Lucia",
  "apellidos": "Vargas",
  "documento": "1098765432",
  "telefono": "3157778899",
  "email": "ana.vargas@correo.com",
  "direccion": "Calle 100 # 15-20",
  "fechaNacimiento": "1995-03-22",
  "activo": true
}
```

---

## Estructura del proyecto

```
FarmaciaAPI/
├── Program.cs                      Arranque, registro de DI y pipeline HTTP
├── appsettings.json                Cadena de conexión y parámetros de negocio
├── FarmaciaAPI.csproj              Paquetes NuGet instalados
│
├── Controllers/
│   ├── MedicamentosController.cs   CRUD de medicamentos (muestra las 4 DI)
│   ├── ClientesController.cs       CRUD de clientes
│   └── DiagnosticoController.cs    Salud y bitácora de auditoría
│
├── Interfaces/                     NUESTRAS interfaces (abstracciones)
│   ├── IFabricaConexion.cs
│   ├── IMedicamentoRepositorio.cs
│   ├── IClienteRepositorio.cs
│   └── IAuditoriaServicio.cs
│
├── Data/
│   └── FabricaConexionMySql.cs     Abre la conexión con MySqlConnector
│
├── Repositories/                   SQL a mano con ADO.NET
│   ├── MedicamentoRepositorio.cs
│   └── ClienteRepositorio.cs
│
├── Services/
│   └── AuditoriaServicio.cs        Usa ILogger + IConfiguration + interfaz propia
│
├── Models/
│   ├── Medicamento.cs
│   ├── Cliente.cs
│   ├── RegistroAuditoria.cs
│   └── Dtos/                       Objetos de entrada con validaciones
│
└── Database/
    └── 01-schema.sql               Base de datos, usuario, tablas y datos
```

---

## Documentación de la entrega

Ver [NOTAS-PROYECTO.md](NOTAS-PROYECTO.md) para el detalle de integrantes,
librerías, editor de código, guion de la presentación y oportunidades de mejora.

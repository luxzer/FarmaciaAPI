# Notas del proyecto — Farmacia API

**Asignatura:** Desarrollo de Web API con ASP.NET Core
**Artefacto:** API REST para la gestión de una farmacia
**Fecha de entrega:** 6 de octubre de 2026

---

## 1. Integrantes del grupo

| # | Nombre completo | Matrícula |
|---|---|---|
| 1 | Luis Calderón | 22-1392 |
| 2 | Rafael Ureña | 22-1836 |

---

## 2. Librerías utilizadas

### Paquetes NuGet instalados explícitamente

| Librería | Versión | Para qué sirve |
|---|---|---|
| `MySqlConnector` | 2.6.2 | Driver **ADO.NET** de MySQL. Provee `MySqlConnection`, `MySqlCommand` y `MySqlDataReader`. **No es un ORM**: el SQL lo escribimos nosotros. Es totalmente asíncrono, a diferencia de `MySql.Data` (el driver oficial de Oracle), que simula el async. |
| `Swashbuckle.AspNetCore` | 10.2.3 | Genera el documento OpenAPI a partir del código y sirve la interfaz gráfica de **Swagger UI**. |

Comandos usados para instalarlas:

```bash
dotnet add package MySqlConnector
dotnet add package Swashbuckle.AspNetCore
```

### Componentes del framework (vienen con el SDK, no se instalan)

| Componente | Namespace | Uso en el proyecto |
|---|---|---|
| ASP.NET Core MVC | `Microsoft.AspNetCore.Mvc` | `ControllerBase`, `[ApiController]`, `[HttpGet]`, `IActionResult` |
| Logging | `Microsoft.Extensions.Logging` | `ILogger<T>` con el proveedor de consola |
| Configuration | `Microsoft.Extensions.Configuration` | `IConfiguration` para leer `appsettings.json` |
| Dependency Injection | `Microsoft.Extensions.DependencyInjection` | `AddScoped`, `AddSingleton` |
| Validaciones | `System.ComponentModel.DataAnnotations` | `[Required]`, `[Range]`, `[EmailAddress]` en los DTO |

---

## 3. Editor de código usado

| Herramienta | Versión / detalle |
|---|---|
| **Editor principal** | Visual Studio Code |
| Extensión | C# Dev Kit (OmniSharp / Roslyn) |
| SDK | .NET SDK 9.0.200 |
| Terminal | PowerShell 5.1 sobre Windows 11 |
| Cliente de base de datos | MySQL Workbench 8.0 CE y `mysql` (CLI de MySQL 8.4) |
| Pruebas de endpoints | Swagger UI integrado |
| Control de versiones | Git + GitHub |

---

## 4. Link del código

**Repositorio:** _(pegar aquí el enlace de GitHub o Google Drive)_

---

## 5. Base de datos

| Aspecto | Detalle |
|---|---|
| Motor | MySQL 8.4 |
| Método de acceso | **ADO.NET puro** con el driver MySqlConnector |
| Nombre de la BD | `farmacia` |
| Usuario de la API | `farmacia_app` (no usamos `root`; solo tiene permisos SELECT, INSERT, UPDATE y DELETE sobre la base `farmacia`) |
| Script de creación | `FarmaciaAPI/Database/01-schema.sql` — crea la BD, el usuario, las 3 tablas y los datos de prueba. Es idempotente. |

### Tablas

**`medicamentos`** — CRUD del `MedicamentosController`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT | Llave primaria |
| `nombre` | VARCHAR(150) | NOT NULL |
| `laboratorio` | VARCHAR(100) | NOT NULL |
| `descripcion` | TEXT | Opcional |
| `precio` | DECIMAL(10,2) | CHECK >= 0 |
| `stock` | INTEGER | CHECK >= 0 |
| `requiere_receta` | BOOLEAN | Por defecto FALSE |
| `fecha_vencimiento` | DATE | Opcional |
| `activo` | BOOLEAN | Por defecto TRUE |
| `fecha_registro` | DATETIME | Por defecto `CURRENT_TIMESTAMP` |

**`clientes`** — CRUD del `ClientesController`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT | Llave primaria |
| `nombres` | VARCHAR(100) | NOT NULL |
| `apellidos` | VARCHAR(100) | NOT NULL |
| `documento` | VARCHAR(20) | NOT NULL, **UNIQUE** |
| `telefono` | VARCHAR(20) | Opcional |
| `email` | VARCHAR(150) | Opcional |
| `direccion` | VARCHAR(250) | Opcional |
| `fecha_nacimiento` | DATE | Opcional |
| `activo` | BOOLEAN | Por defecto TRUE |
| `fecha_registro` | DATETIME | Por defecto `CURRENT_TIMESTAMP` |

**`auditoria`** — la escribe nuestro servicio `IAuditoriaServicio` en cada
operación de escritura de los otros dos controladores.

---

## 6. Cumplimiento de los requisitos

| Requisito | Dónde se cumple |
|---|---|
| Acceso por Swagger | `Program.cs` → `AddSwaggerGen()`, `UseSwagger()`, `UseSwaggerUI()`. Queda en la raíz del sitio. |
| Al menos dos controladores | `MedicamentosController`, `ClientesController` y `DiagnosticoController` (3 en total). |
| Implementa `ILogger` (DI) | Los 3 controladores, los 2 repositorios, la fábrica de conexiones y el servicio de auditoría lo reciben por constructor. |
| Implementa `IConfiguration` (DI) | `FabricaConexionPostgres` (cadena de conexión), `AuditoriaServicio` (parámetros), `MedicamentosController` (umbral de stock), `DiagnosticoController`. |
| Interfaz creada por nosotros (DI) | 4 interfaces propias: `IFabricaConexion`, `IMedicamentoRepositorio`, `IClienteRepositorio`, `IAuditoriaServicio`. |
| Interfaces bien implementadas en un controlador | `MedicamentosController` recibe las 4 dependencias a la vez (`ILogger`, `IConfiguration` y 2 interfaces propias). |
| Conexión a base de datos | MySQL 8.4 vía ADO.NET / MySqlConnector. |
| CRUD de dos tablas | `medicamentos` y `clientes`, con GET lista, GET por id, POST, PUT y DELETE cada una. |

---

## 7. Guion para la presentación en clase

### 7.1 ¿Qué librerías instalamos?

Solo dos paquetes NuGet: **MySqlConnector** y **Swashbuckle.AspNetCore**. Todo lo demás
(MVC, logging, configuración, inyección de dependencias) ya viene incluido en el
SDK de ASP.NET Core; no hay que instalarlo.

### 7.2 Explicación de `Program.cs`

El archivo usa *top-level statements*: desde .NET 6 no se escribe la clase
`Program` ni el método `Main`, el compilador los genera. Tiene dos mitades:

**Primera mitad — registro de servicios (`builder.Services`)**

1. `WebApplication.CreateBuilder(args)` hace tres cosas de una vez:
   - construye el `IConfiguration` leyendo en orden de prioridad creciente:
     `appsettings.json` → `appsettings.Development.json` → variables de entorno
     → argumentos de línea de comandos (gana el último);
   - configura el sistema de logging;
   - crea el contenedor de inyección de dependencias.
2. `AddControllers()` habilita el descubrimiento y enrutamiento de los controladores.
3. `builder.Logging.ClearProviders()` + `AddSimpleConsole(...)` dejan **solo** el
   proveedor de consola, que es lo que pide el enunciado.
4. **El bloque clave de DI.** Cada línea dice "cuando alguien pida esta interfaz,
   entrégale esta clase":
   ```csharp
   builder.Services.AddSingleton<IFabricaConexion, FabricaConexionPostgres>();
   builder.Services.AddScoped<IMedicamentoRepositorio, MedicamentoRepositorio>();
   builder.Services.AddScoped<IClienteRepositorio, ClienteRepositorio>();
   builder.Services.AddScoped<IAuditoriaServicio, AuditoriaServicio>();
   ```
   Tiempos de vida: **Singleton** una sola instancia en toda la app (la fábrica
   solo guarda la cadena de conexión, que no cambia); **Scoped** una instancia
   nueva por cada petición HTTP (lo recomendado para acceso a datos);
   **Transient** una nueva cada vez que se pida.
5. `AddSwaggerGen(...)` configura el título, la versión y la descripción del
   documento OpenAPI, y con `IncludeXmlComments` incorpora los comentarios
   `///` del código C# a la documentación visible en Swagger.
6. `AddCors(...)` declara la política que permitirá que un front-end en otro
   dominio consuma la API.
7. `builder.Build()` cierra el contenedor: después de esta línea ya no se pueden
   registrar más servicios.

**Segunda mitad — pipeline HTTP (`app.Use...`)**

El orden importa, porque cada middleware se ejecuta de arriba hacia abajo:

1. Manejo de errores: `UseDeveloperExceptionPage()` en desarrollo (muestra el
   stack trace), `UseExceptionHandler("/error")` en producción (no filtra
   detalles internos).
2. `UseSwagger()` publica el JSON y `UseSwaggerUI()` la interfaz gráfica. Con
   `RoutePrefix = string.Empty` Swagger queda en la raíz, así no hay que
   escribir `/swagger` durante la demostración.
3. `UseHttpsRedirection()`, `UseCors("PermitirTodo")` y `MapControllers()`.
4. Antes de `app.Run()` se abre un `scope` para pedir el `IFabricaConexion` y
   probar la conexión a MySQL. Si falla, el error aparece en consola al
   arrancar y no en la primera petición del usuario.
5. `app.Run()` arranca Kestrel y se queda escuchando.

### 7.3 Implementación de las interfaces (DI)

Mostrar el constructor de `MedicamentosController`, que es el que reúne todo:

```csharp
public MedicamentosController(
    IMedicamentoRepositorio repositorio,        // interfaz propia
    IAuditoriaServicio auditoria,               // interfaz propia
    ILogger<MedicamentosController> logger,     // ILogger
    IConfiguration configuracion)               // IConfiguration
```

Puntos a resaltar:

- **No hay un solo `new`**. El controlador no sabe qué clase concreta llega: el
  contenedor la resuelve usando el catálogo de `Program.cs`.
- El controlador depende de `IMedicamentoRepositorio`, no de
  `MedicamentoRepositorio`. Eso es el **principio de inversión de
  dependencias**: si mañana cambiamos MySQL por otro motor, o ponemos un
  repositorio falso para pruebas unitarias, solo se cambia **una línea** en
  `Program.cs`.
- `AuditoriaServicio` es el mejor ejemplo porque recibe las tres dependencias
  del enunciado al mismo tiempo: `ILogger` (escribe en consola),
  `IConfiguration` (lee si la auditoría está habilitada) e `IFabricaConexion`
  (nuestra interfaz, para guardar el evento en la tabla).

### 7.4 Métodos creados

Demostración sugerida en Swagger, en este orden:

1. `GET /api/diagnostico/salud` → confirma que la BD está conectada y muestra
   los valores leídos de `appsettings.json`.
2. `GET /api/medicamentos` → lista los 6 medicamentos de prueba.
3. `POST /api/medicamentos` → crea uno nuevo; devuelve **201** y la cabecera
   `Location`.
4. `POST /api/medicamentos` con `fechaVencimiento` en el pasado → devuelve
   **400** (regla de negocio).
5. `PUT /api/medicamentos/{id}` → actualiza; `DELETE` → devuelve **204**.
6. `GET /api/medicamentos/999` → devuelve **404**.
7. `GET /api/medicamentos/stock-bajo` → usa el umbral de `IConfiguration`.
8. `POST /api/clientes` con un documento que ya existe → devuelve **409**.
9. `GET /api/diagnostico/auditoria` → muestra que todas las operaciones
   anteriores quedaron registradas en la base de datos.
10. **Mostrar la consola**: cada paso dejó su línea de log escrita por `ILogger`.

### 7.5 Método de conexión a la base de datos

**ADO.NET puro con el driver MySqlConnector.** No usamos Entity Framework ni
ningún ORM: el SQL lo escribimos nosotros y el mapeo a objetos también.

El flujo en cada operación de lectura es siempre el mismo:

```csharp
await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
await using var comando  = new MySqlCommand(sql, conexion);
comando.Parameters.AddWithValue("@id", id);
await using var lector   = await comando.ExecuteReaderAsync(ct);
while (await lector.ReadAsync(ct)) { /* mapeo manual columna por columna */ }
```

Las tres clases de ADO.NET que hay que nombrar:

| Clase | Para qué sirve |
|---|---|
| `MySqlConnection` | Abre y cierra el canal con el servidor MySQL. |
| `MySqlCommand` | Lleva el texto SQL y sus parámetros. |
| `MySqlDataReader` | Recorre el resultado fila por fila, en modo *forward-only*. |

Y los tres métodos de ejecución que usamos según lo que devuelve la consulta:

| Método | Devuelve | Dónde lo usamos |
|---|---|---|
| `ExecuteReaderAsync` | Un conjunto de filas | Todos los `SELECT` |
| `ExecuteNonQueryAsync` | Número de filas afectadas | `INSERT`, `UPDATE`, `DELETE` |
| `ExecuteScalarAsync` | Un único valor | `SELECT EXISTS(...)` y `SELECT 1` |

**Puntos a resaltar en la presentación**

- **`IFabricaConexion` centraliza la conexión.** Ningún repositorio lee la
  cadena de conexión por su cuenta ni hace `new MySqlConnection(...)`. Solo
  `FabricaConexionMySql` conoce la cadena, y la obtiene de `IConfiguration`.

- **Parámetros, nunca concatenación.** Todos los valores viajan como
  `@parametro`. Eso es lo que evita la **inyección SQL**. Si escribiéramos
  `"WHERE id = " + id`, alguien podría enviar `1; DROP TABLE clientes` y la API
  sería vulnerable.

- **`await using` cierra la conexión siempre**, incluso si ocurre una
  excepción, porque genera un `try/finally` por debajo. MySqlConnector mantiene
  un *pool* interno, así que abrir y cerrar en cada operación es la práctica
  recomendada: no se crea una conexión TCP nueva cada vez, se toma prestada una
  del pool y se devuelve al terminar.

- **Cómo obtenemos el `id` recién insertado.** MySQL no tiene la cláusula
  `RETURNING`. Después del `INSERT` leemos `comando.LastInsertedId`, que trae
  el valor que generó el `AUTO_INCREMENT`, y con ese id releemos la fila para
  devolverla completa (con la `fecha_registro` que puso la base de datos por
  defecto). Reutilizamos la **misma conexión** para esa segunda consulta, para
  no pedir otra al pool.

- **Un detalle de MySQL que nos obligó a cambiar el código.**
  `ExecuteNonQueryAsync` en un `UPDATE` devuelve las filas **modificadas**, no
  las **encontradas**. Si el usuario envía exactamente los mismos valores que ya
  estaban guardados, MySQL responde `0` aunque el registro sí exista. Por eso en
  `ActualizarAsync` **no** usamos ese número para decidir si devolver 404:
  primero comprobamos la existencia con un `SELECT` y después ejecutamos el
  `UPDATE`. En el `DELETE` sí podemos confiar en las filas afectadas, porque ahí
  o la fila existía y se borró (1), o no existía (0).

- **MySQL no tiene tipo booleano real.** `BOOLEAN` es en realidad un
  `TINYINT(1)`, y `SELECT EXISTS(...)` devuelve `1` o `0`, no `true`/`false`.
  Por eso en `ExisteDocumentoAsync` convertimos con `Convert.ToInt32(resultado)`
  en lugar de comparar contra `true`.

- **`DateOnly` no existe en MySQL.** Convertimos a `DateTime` a medianoche al
  guardar (`ToDateTime(TimeOnly.MinValue)`) y de vuelta a `DateOnly` al leer
  (`DateOnly.FromDateTime(...)`). La columna es `DATE`, así que la hora se
  descarta.

- **El mapeo manual** (`lector.GetString(lector.GetOrdinal("nombre"))`) es
  exactamente el trabajo que un ORM haría por nosotros. Es la contrapartida de
  elegir ADO.NET: más control, cero capas intermedias y se ve el SQL exacto que
  se ejecuta, a cambio de bastante más código repetitivo.

### 7.6 Oportunidades de mejora

**Seguridad**

1. **Autenticación y autorización.** Hoy cualquiera puede borrar un
   medicamento. Faltaría JWT con `[Authorize]` y roles (administrador,
   farmacéutico, cajero).
2. **Secretos fuera del repositorio.** La contraseña está en `appsettings.json`.
   Debería estar en *User Secrets* durante el desarrollo y en Azure Key Vault o
   variables de entorno en producción.
3. **HTTPS obligatorio y HSTS** en producción.
4. **CORS restringido.** `AllowAnyOrigin()` sirve para la demo, pero en
   producción habría que listar los dominios permitidos.

**Datos y rendimiento**

5. **Paginación.** `GET /api/medicamentos` trae toda la tabla. Con 50.000
   medicamentos la respuesta sería inmanejable: hace falta `?pagina=1&tamano=20`
   con `LIMIT` y `OFFSET`.
6. **Borrado lógico en lugar de físico.** Ya existe la columna `activo`, pero el
   `DELETE` borra la fila. Sería mejor marcarla como inactiva para no perder el
   histórico.
7. **Transacciones.** Cada operación es independiente. Una venta real
   (descontar stock + registrar la venta) tendría que ir dentro de una
   `MySqlTransaction` para que ambas cosas ocurran o ninguna.
8. **Migraciones versionadas.** Hoy el esquema se crea con un script manual.
   Herramientas como DbUp, Flyway o las migraciones de EF Core permitirían
   versionar los cambios de la base de datos junto con el código.
9. **Caché.** Las consultas repetidas al catálogo podrían guardarse en
   `IMemoryCache` o Redis.

**Calidad y arquitectura**

10. **Pruebas automatizadas.** No hay ninguna. Gracias a que todo depende de
    interfaces, se podrían escribir pruebas unitarias con xUnit y Moq
    sustituyendo `IMedicamentoRepositorio` por un doble de prueba, más pruebas
    de integración con Testcontainers.
11. **Capa de servicios separada.** Las reglas de negocio (como rechazar un
    medicamento vencido) están en el controlador. En un proyecto más grande
    irían en una capa de servicios intermedia, dejando al controlador solo el
    trabajo de HTTP.
12. **Middleware global de excepciones.** Un `IExceptionHandler` que convierta
    cualquier error en un `ProblemDetails` consistente.
13. **PATCH para actualizaciones parciales.** Hoy el `PUT` exige enviar el
    objeto completo.
14. **`IOptions<T>` en lugar de `IConfiguration` directo.** Mapear la sección
    `Farmacia` a una clase `OpcionesFarmacia` daría validación al arrancar y
    tipado fuerte, en vez de leer claves por texto.
15. **Modelo de datos más rico.** Faltan tablas de proveedores, ventas y detalle
    de ventas con sus llaves foráneas, que es el siguiente paso natural para una
    farmacia real.
16. **Health checks estándar.** Reemplazar `/api/diagnostico/salud` por el
    paquete `AspNetCore.HealthChecks.MySql`, que se integra con orquestadores
    como Kubernetes.
17. **Versionado de la API** (`/api/v1/...`) para poder evolucionar los
    contratos sin romper a los clientes existentes.

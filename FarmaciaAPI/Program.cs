// =============================================================================
//  FarmaciaAPI - Program.cs
//
//  Este es el punto de entrada de la aplicacion. Desde .NET 6 se usa el
//  modelo de "top-level statements": no hay clase Program ni metodo Main
//  visibles, el compilador los genera por nosotros.
//
//  El archivo tiene dos mitades bien diferenciadas:
//
//    1) CONFIGURACION DE SERVICIOS  (builder.Services...)
//       Aqui se registra todo en el contenedor de INYECCION DE DEPENDENCIAS.
//       Es un catalogo: "cuando alguien pida esta interfaz, entregale esta clase".
//
//    2) CONFIGURACION DEL PIPELINE  (app.Use...)
//       Aqui se arma la cadena de middlewares por la que pasa cada peticion
//       HTTP. El ORDEN importa: se ejecutan de arriba hacia abajo.
// =============================================================================

using System.Reflection;
using FarmaciaAPI.Data;
using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Repositories;
using FarmaciaAPI.Services;
using Microsoft.OpenApi;

// WebApplication.CreateBuilder hace tres cosas importantes de una sola vez:
//   - Construye el objeto IConfiguration leyendo, EN ESTE ORDEN DE PRIORIDAD:
//       appsettings.json  ->  appsettings.{Environment}.json  ->
//       variables de entorno  ->  argumentos de linea de comandos.
//     Lo ultimo gana, por eso una variable de entorno puede sobrescribir la
//     contrasena de la base de datos sin tocar el archivo JSON.
//   - Configura el sistema de logging (ILogger) con el proveedor de Consola.
//   - Crea el contenedor de servicios (builder.Services).
var builder = WebApplication.CreateBuilder(args);

// =============================================================================
//  1. SERVICIOS
// =============================================================================

// --- 1.1 Controladores -------------------------------------------------------
// Registra el servicio de MVC necesario para descubrir las clases que heredan
// de ControllerBase y enrutar las peticiones hacia sus metodos.
builder.Services.AddControllers();

// --- 1.2 Logging (ILogger) ---------------------------------------------------
// El logging ya viene configurado por CreateBuilder. Lo dejamos explicito para
// poder explicarlo en la presentacion:
//   ClearProviders() elimina los proveedores por defecto y AddConsole() deja
//   solo la consola, que es lo que pide el enunciado.
//   AddSimpleConsole con timestamp hace los mensajes mas legibles en la demo.
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(opciones =>
{
    opciones.IncludeScopes = false;
    opciones.SingleLine = true;
    opciones.TimestampFormat = "HH:mm:ss ";
});

// Los niveles minimos de log (Information, Warning, etc.) se leen de la seccion
// "Logging" de appsettings.json, otro uso de IConfiguration.

// --- 1.3 Inyeccion de dependencias: NUESTRAS INTERFACES ----------------------
// Esta es la parte central del ejercicio. Cada linea dice:
//   "cuando una clase pida <Interfaz>, construye y entrega <Implementacion>".
//
// TIEMPOS DE VIDA disponibles:
//   Singleton -> una sola instancia para toda la aplicacion.
//   Scoped    -> una instancia nueva por cada peticion HTTP.
//   Transient -> una instancia nueva cada vez que se pida.

// La fabrica de conexiones solo guarda la cadena de conexion (que no cambia),
// por eso Singleton: se crea una vez al arrancar y se reutiliza.
builder.Services.AddSingleton<IFabricaConexion, FabricaConexionMySql>();

// Los repositorios son Scoped: uno por peticion HTTP. Es el tiempo de vida
// recomendado para el acceso a datos.
builder.Services.AddScoped<IMedicamentoRepositorio, MedicamentoRepositorio>();
builder.Services.AddScoped<IClienteRepositorio, ClienteRepositorio>();

// El servicio de auditoria tambien es Scoped porque depende de la peticion.
builder.Services.AddScoped<IAuditoriaServicio, AuditoriaServicio>();

// --- 1.4 Swagger / OpenAPI ---------------------------------------------------
// AddEndpointsApiExplorer descubre los endpoints y AddSwaggerGen genera el
// documento JSON de OpenAPI que alimenta la interfaz de Swagger.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opciones =>
{
    opciones.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Farmacia API",
        Version = "v1",
        Description =
            "Web API REST para la gestion de una farmacia.\n\n" +
            "- **Medicamentos**: CRUD completo del inventario.\n" +
            "- **Clientes**: CRUD completo de los clientes.\n" +
            "- **Diagnostico**: estado de la conexion y bitacora de auditoria.\n\n" +
            "Base de datos: MySQL mediante ADO.NET (MySqlConnector), sin ORM.",
        Contact = new OpenApiContact { Name = "Equipo de desarrollo" }
    });

    // Incorpora los comentarios /// <summary> del codigo C# a la documentacion
    // de Swagger. Requiere <GenerateDocumentationFile> en el .csproj.
    var archivoXml = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var rutaXml = Path.Combine(AppContext.BaseDirectory, archivoXml);
    if (File.Exists(rutaXml))
        opciones.IncludeXmlComments(rutaXml, includeControllerXmlComments: true);
});

// --- 1.5 CORS ----------------------------------------------------------------
// Permite que una pagina web alojada en otro dominio (por ejemplo un front-end
// en React) pueda consumir esta API desde el navegador.
builder.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PermitirTodo", politica =>
        politica.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());
});

// Construye la aplicacion. A partir de aqui el contenedor de servicios queda
// cerrado: ya no se pueden registrar mas dependencias.
var app = builder.Build();

// =============================================================================
//  2. PIPELINE HTTP (middlewares)
// =============================================================================

// Pedimos un ILogger al contenedor para registrar el arranque. Es la forma de
// usar logging fuera de un controlador.
var logger = app.Services.GetRequiredService<ILogger<Program>>();

// Mostramos en consola datos leidos de IConfiguration al iniciar.
logger.LogInformation("Iniciando {Farmacia} - Entorno: {Entorno}",
    app.Configuration.GetValue<string>("Farmacia:Nombre") ?? "Farmacia",
    app.Environment.EnvironmentName);

// --- 2.1 Manejo de errores ---------------------------------------------------
if (app.Environment.IsDevelopment())
{
    // En desarrollo mostramos la pagina de excepciones con el stack trace.
    app.UseDeveloperExceptionPage();
}
else
{
    // En produccion devolvemos un ProblemDetails estandar (RFC 7807) sin
    // filtrar detalles internos al cliente.
    app.UseExceptionHandler("/error");
}

// --- 2.2 Swagger -------------------------------------------------------------
// UseSwagger expone el JSON en /swagger/v1/swagger.json
// UseSwaggerUI expone la interfaz grafica.
app.UseSwagger();
app.UseSwaggerUI(opciones =>
{
    opciones.SwaggerEndpoint("/swagger/v1/swagger.json", "Farmacia API v1");
    opciones.DocumentTitle = "Farmacia API - Documentacion";

    // RoutePrefix vacio hace que Swagger quede en la raiz (https://localhost:puerto/),
    // asi no hay que escribir /swagger a mano durante la presentacion.
    opciones.RoutePrefix = string.Empty;
});

// --- 2.3 Middlewares restantes ----------------------------------------------
// Solo forzamos https fuera de desarrollo. Si lo activamos siempre y la app
// se arranca unicamente en http (como hace EJECUTAR-API.bat), el middleware
// no encuentra un puerto https al que redirigir y escribe una advertencia
// confusa en la consola en cada peticion.
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();  // redirige http -> https

app.UseCors("PermitirTodo");    // aplica la politica de CORS declarada arriba
app.MapControllers();           // conecta las rutas de los controladores

// Endpoint minimo para el manejador de excepciones de produccion.
app.MapGet("/error", () => Results.Problem(
    title: "Ocurrio un error inesperado.",
    statusCode: StatusCodes.Status500InternalServerError))
   .ExcludeFromDescription();

// =============================================================================
//  3. VERIFICACION DE LA BASE DE DATOS AL ARRANCAR
// =============================================================================
// Probamos la conexion una vez al iniciar para que el error salga en consola
// de inmediato y no en la primera peticion del usuario.
using (var alcance = app.Services.CreateScope())
{
    var fabrica = alcance.ServiceProvider.GetRequiredService<IFabricaConexion>();
    var conectado = await fabrica.ProbarConexionAsync();

    if (conectado)
        logger.LogInformation("Conexion a MySQL verificada correctamente.");
    else
        logger.LogError("No fue posible conectarse a MySQL. " +
                        "Revisa la cadena de conexion 'FarmaciaDb' en appsettings.json.");
}

logger.LogInformation("API lista. Swagger disponible en la raiz del sitio.");

// Arranca el servidor web (Kestrel) y se queda escuchando peticiones.
app.Run();

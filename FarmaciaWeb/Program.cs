// =============================================================================
//  FarmaciaWeb - Program.cs
//
//  Punto de entrada del sitio Blazor. Igual que en la Web API, tiene dos
//  mitades: arriba se registran los servicios en el contenedor de inyeccion
//  de dependencias, abajo se arma el pipeline HTTP.
// =============================================================================

using FarmaciaWeb.Components;
using FarmaciaWeb.Servicios;

var builder = WebApplication.CreateBuilder(args);

// =============================================================================
//  1. SERVICIOS
// =============================================================================

// --- 1.1 Blazor --------------------------------------------------------------
// AddRazorComponents registra el motor de componentes y
// AddInteractiveServerComponents habilita el modo interactivo en SERVIDOR:
// el C# se ejecuta en el servidor y los cambios de la pantalla viajan al
// navegador por una conexion SignalR.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// --- 1.2 Logging (ILogger) ---------------------------------------------------
// Dejamos solo la consola, para poder mostrar en la presentacion cada llamada
// que el servicio hace a la Web API.
builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(opciones =>
{
    opciones.SingleLine = true;
    opciones.TimestampFormat = "HH:mm:ss ";
});

// --- 1.3 El servicio que habla con la Web API --------------------------------
// AddHttpClient<TInterfaz, TImplementacion> hace dos cosas de una vez:
//   1. registra FarmaciaApiServicio como implementacion de IFarmaciaApiServicio;
//   2. le inyecta un HttpClient administrado por la fabrica de HttpClient, que
//      reutiliza las conexiones en lugar de abrir una nueva cada vez.
//
// USO DE IConfiguration: la direccion de la API y el tiempo de espera salen de
// appsettings.json, no estan escritos en el codigo.
var direccionApi = builder.Configuration["FarmaciaApi:BaseUrl"]
    ?? throw new InvalidOperationException(
        "Falta la clave 'FarmaciaApi:BaseUrl' en appsettings.json.");

var segundosEspera = builder.Configuration.GetValue<int>("FarmaciaApi:TiempoEsperaSegundos", 15);

builder.Services.AddHttpClient<IFarmaciaApiServicio, FarmaciaApiServicio>(cliente =>
{
    cliente.BaseAddress = new Uri(direccionApi);
    cliente.Timeout = TimeSpan.FromSeconds(segundosEspera);
});

var app = builder.Build();

// =============================================================================
//  2. PIPELINE HTTP
// =============================================================================

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Iniciando {Sitio}. API configurada en {Api}",
    app.Configuration["Sitio:Nombre"] ?? "FarmaciaWeb", direccionApi);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

// Sirve los archivos estaticos de wwwroot: nuestro CSS y las imagenes SVG.
app.UseStaticFiles();

// Protege los formularios contra peticiones falsificadas (CSRF).
app.UseAntiforgery();

// Conecta el enrutador de Blazor y activa el modo interactivo en servidor.
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

using FarmaciaWeb.Components;
using FarmaciaWeb.Servicios;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(opciones =>
{
    opciones.SingleLine = true;
    opciones.TimestampFormat = "HH:mm:ss ";
});

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

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Iniciando {Sitio}. API configurada en {Api}",
    app.Configuration["Sitio:Nombre"] ?? "FarmaciaWeb", direccionApi);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

// css e imagenes de wwwroot
app.UseStaticFiles();

app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();

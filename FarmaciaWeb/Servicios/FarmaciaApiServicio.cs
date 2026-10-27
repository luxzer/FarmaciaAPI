using System.Net.Http.Json;
using System.Text.Json;
using FarmaciaWeb.Models;

namespace FarmaciaWeb.Servicios;

/// <summary>
/// Implementacion de <see cref="IFarmaciaApiServicio"/> sobre HttpClient.
///
/// Esta clase es la que exige el enunciado: toda la comunicacion con la Web API
/// pasa por aqui, y recibe por INYECCION DE DEPENDENCIAS las tres cosas que
/// necesita, sin construir ninguna con "new":
///   - HttpClient      -> lo entrega la fabrica registrada en Program.cs
///   - ILogger         -> registra en consola cada llamada y cada fallo
///   - IConfiguration  -> lee parametros de appsettings.json
/// </summary>
public class FarmaciaApiServicio : IFarmaciaApiServicio
{
    private readonly HttpClient _http;                           // DI
    private readonly ILogger<FarmaciaApiServicio> _logger;       // DI: ILogger
    private readonly bool _registrarDetalle;                     // viene de IConfiguration

    // La API devuelve el JSON en camelCase ("fechaVencimiento") y nuestras
    // propiedades estan en PascalCase, por eso ignoramos may/minusculas.
    private static readonly JsonSerializerOptions OpcionesJson = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public FarmaciaApiServicio(
        HttpClient http,
        IConfiguration configuracion,                            // DI: IConfiguration
        ILogger<FarmaciaApiServicio> logger)                     // DI: ILogger
    {
        _http = http;
        _logger = logger;

        // --- USO DE IConfiguration -------------------------------------------
        // La direccion base de la API se configura en Program.cs. Aqui leemos
        // un parametro de comportamiento, para poder activar o desactivar el
        // detalle de los logs sin recompilar.
        _registrarDetalle = configuracion.GetValue<bool>("FarmaciaApi:RegistrarDetalle", true);
    }

    public async Task<IReadOnlyList<Medicamento>> ObtenerMedicamentosAsync(string? nombre = null, CancellationToken ct = default)
    {
        // Uri.EscapeDataString evita que un texto con espacios o acentos rompa
        // la direccion.
        var ruta = string.IsNullOrWhiteSpace(nombre)
            ? "api/medicamentos"
            : $"api/medicamentos?nombre={Uri.EscapeDataString(nombre.Trim())}";

        return await PedirListaAsync<Medicamento>(ruta, "medicamentos", ct);
    }

    public async Task<ResultadoStockBajo?> ObtenerStockBajoAsync(CancellationToken ct = default)
        => await PedirAsync<ResultadoStockBajo>("api/medicamentos/stock-bajo", "stock bajo", ct);

    public async Task<IReadOnlyList<Cliente>> ObtenerClientesAsync(string? buscar = null, CancellationToken ct = default)
    {
        var ruta = string.IsNullOrWhiteSpace(buscar)
            ? "api/clientes"
            : $"api/clientes?buscar={Uri.EscapeDataString(buscar.Trim())}";

        return await PedirListaAsync<Cliente>(ruta, "clientes", ct);
    }

    public async Task<EstadoApi?> ObtenerEstadoAsync(CancellationToken ct = default)
        => await PedirAsync<EstadoApi>("api/diagnostico/salud", "estado", ct);

    // ------------------------------------------------------------- Auxiliares

    /// <summary>
    /// Hace la peticion GET y convierte el JSON al tipo pedido. Centralizar
    /// aqui el manejo de errores evita repetir el try/catch en cada metodo.
    /// </summary>
    private async Task<T?> PedirAsync<T>(string ruta, string descripcion, CancellationToken ct)
    {
        try
        {
            if (_registrarDetalle)
                _logger.LogInformation("GET {Ruta}", ruta);

            var respuesta = await _http.GetAsync(ruta, ct);

            // El endpoint de salud responde 503 cuando MySQL no contesta, pero
            // el cuerpo sigue trayendo informacion util, asi que lo leemos igual.
            if (!respuesta.IsSuccessStatusCode && respuesta.StatusCode != System.Net.HttpStatusCode.ServiceUnavailable)
            {
                _logger.LogWarning("La API respondio {Codigo} al pedir {Descripcion}.",
                    (int)respuesta.StatusCode, descripcion);
                return default;
            }

            return await respuesta.Content.ReadFromJsonAsync<T>(OpcionesJson, ct);
        }
        catch (OperationCanceledException)
        {
            // El usuario cambio de pagina o escribio otra busqueda: no es un error.
            throw;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "No se pudo contactar la API al pedir {Descripcion}. " +
                                 "Comprueba que FarmaciaAPI este corriendo.", descripcion);
            return default;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "La API devolvio un JSON que no se pudo leer al pedir {Descripcion}.", descripcion);
            return default;
        }
    }

    /// <summary>Igual que PedirAsync, pero nunca devuelve null: una lista vacia basta.</summary>
    private async Task<IReadOnlyList<T>> PedirListaAsync<T>(string ruta, string descripcion, CancellationToken ct)
    {
        var lista = await PedirAsync<List<T>>(ruta, descripcion, ct);

        if (_registrarDetalle && lista is not null)
            _logger.LogInformation("Se recibieron {Total} {Descripcion}.", lista.Count, descripcion);

        return lista ?? new List<T>();
    }
}

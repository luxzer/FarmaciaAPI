using System.Net.Http.Json;
using System.Text.Json;
using FarmaciaWeb.Models;

namespace FarmaciaWeb.Servicios;

public class FarmaciaApiServicio : IFarmaciaApiServicio
{
    private readonly HttpClient _http;
    private readonly ILogger<FarmaciaApiServicio> _logger;
    private readonly bool _registrarDetalle;

    // la API manda el JSON en camelCase
    private static readonly JsonSerializerOptions OpcionesJson = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public FarmaciaApiServicio(
        HttpClient http,
        IConfiguration configuracion,
        ILogger<FarmaciaApiServicio> logger)
    {
        _http = http;
        _logger = logger;

        // para apagar los logs de cada peticion sin recompilar
        _registrarDetalle = configuracion.GetValue<bool>("FarmaciaApi:RegistrarDetalle", true);
    }

    public async Task<IReadOnlyList<Medicamento>> ObtenerMedicamentosAsync(string? nombre = null, CancellationToken ct = default)
    {
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

    private async Task<T?> PedirAsync<T>(string ruta, string descripcion, CancellationToken ct)
    {
        try
        {
            if (_registrarDetalle)
                _logger.LogInformation("GET {Ruta}", ruta);

            var respuesta = await _http.GetAsync(ruta, ct);

            // /salud devuelve 503 si MySQL no responde, pero el body igual nos sirve
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
            // se cancelo (cambio de pagina o nueva busqueda), no es un error
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

    private async Task<IReadOnlyList<T>> PedirListaAsync<T>(string ruta, string descripcion, CancellationToken ct)
    {
        var lista = await PedirAsync<List<T>>(ruta, descripcion, ct);

        if (_registrarDetalle && lista is not null)
            _logger.LogInformation("Se recibieron {Total} {Descripcion}.", lista.Count, descripcion);

        return lista ?? new List<T>();
    }
}

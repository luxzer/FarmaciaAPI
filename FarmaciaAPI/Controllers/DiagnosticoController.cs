using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FarmaciaAPI.Controllers;

/// <summary>
/// Controlador de apoyo para la demostracion en clase. No es un CRUD: sirve
/// para comprobar en vivo que la configuracion, la conexion a la base de datos
/// y el servicio de auditoria estan funcionando.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DiagnosticoController : ControllerBase
{
    private readonly IFabricaConexion _fabrica;
    private readonly IAuditoriaServicio _auditoria;
    private readonly IConfiguration _configuracion;
    private readonly ILogger<DiagnosticoController> _logger;

    public DiagnosticoController(
        IFabricaConexion fabrica,                       // DI: interfaz propia
        IAuditoriaServicio auditoria,                   // DI: interfaz propia
        IConfiguration configuracion,                   // DI: IConfiguration
        ILogger<DiagnosticoController> logger)          // DI: ILogger
    {
        _fabrica = fabrica;
        _auditoria = auditoria;
        _configuracion = configuracion;
        _logger = logger;
    }

    /// <summary>
    /// Verifica que la API responda y que la base de datos este accesible.
    /// Los valores que devuelve salen de appsettings.json via IConfiguration.
    /// </summary>
    /// <response code="200">La API y la base de datos responden.</response>
    /// <response code="503">La base de datos no responde.</response>
    [HttpGet("salud")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Salud(CancellationToken ct)
    {
        var baseDatosOk = await _fabrica.ProbarConexionAsync(ct);

        // Varias lecturas de IConfiguration en un solo lugar, facil de mostrar.
        var respuesta = new
        {
            api = "FarmaciaAPI",
            farmacia = _configuracion.GetValue<string>("Farmacia:Nombre"),
            nit = _configuracion.GetValue<string>("Farmacia:Nit"),
            ciudad = _configuracion.GetValue<string>("Farmacia:Ciudad"),
            stockMinimoConfigurado = _configuracion.GetValue<int>("Farmacia:StockMinimo"),
            auditoriaHabilitada = _configuracion.GetValue<bool>("Farmacia:AuditoriaHabilitada"),
            motorBaseDatos = "MySQL 8.4 (ADO.NET / MySqlConnector)",
            baseDatos = baseDatosOk ? "conectada" : "sin conexion",
            fechaServidor = DateTime.Now
        };

        if (!baseDatosOk)
        {
            _logger.LogError("Chequeo de salud fallido: la base de datos no responde.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, respuesta);
        }

        _logger.LogInformation("Chequeo de salud correcto.");
        return Ok(respuesta);
    }

    /// <summary>
    /// Devuelve los ultimos movimientos registrados por el servicio de
    /// auditoria. Sirve para demostrar en clase que cada POST, PUT y DELETE
    /// de los otros controladores dejo rastro en la base de datos.
    /// </summary>
    /// <param name="cantidad">Cuantos registros devolver (entre 1 y 200).</param>
    /// <response code="200">Lista de movimientos, del mas reciente al mas antiguo.</response>
    [HttpGet("auditoria")]
    [ProducesResponseType(typeof(IEnumerable<RegistroAuditoria>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RegistroAuditoria>>> Auditoria(
        [FromQuery] int cantidad = 20,
        CancellationToken ct = default)
    {
        var registros = await _auditoria.ObtenerUltimosAsync(cantidad, ct);
        return Ok(registros);
    }
}

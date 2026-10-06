using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace FarmaciaAPI.Controllers;

/// <summary>
/// CRUD completo de la tabla <c>medicamentos</c>.
///
/// ======================================================================
///  ESTE ES EL CONTROLADOR QUE MUESTRA LAS CUATRO INYECCIONES JUNTAS
/// ======================================================================
///   1. ILogger&lt;MedicamentosController&gt;  -> registra eventos en consola
///   2. IConfiguration                       -> lee parametros de appsettings
///   3. IMedicamentoRepositorio (propia)     -> acceso a datos
///   4. IAuditoriaServicio      (propia)     -> deja rastro de cada cambio
///
/// Ninguna de las cuatro se crea con "new": todas llegan por el constructor
/// y el contenedor de servicios de ASP.NET Core las resuelve.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MedicamentosController : ControllerBase
{
    private readonly IMedicamentoRepositorio _repositorio;
    private readonly IAuditoriaServicio _auditoria;
    private readonly ILogger<MedicamentosController> _logger;
    private readonly IConfiguration _configuracion;

    public MedicamentosController(
        IMedicamentoRepositorio repositorio,            // DI: interfaz propia
        IAuditoriaServicio auditoria,                   // DI: interfaz propia
        ILogger<MedicamentosController> logger,         // DI: ILogger
        IConfiguration configuracion)                   // DI: IConfiguration
    {
        _repositorio = repositorio;
        _auditoria = auditoria;
        _logger = logger;
        _configuracion = configuracion;
    }

    // =======================================================================
    // READ - GET api/medicamentos
    // =======================================================================
    /// <summary>Lista todos los medicamentos del inventario.</summary>
    /// <param name="nombre">Filtro opcional por nombre (busqueda parcial).</param>
    /// <response code="200">Lista de medicamentos.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Medicamento>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Medicamento>>> ObtenerTodos(
        [FromQuery] string? nombre,
        CancellationToken ct)
    {
        _logger.LogInformation("GET api/medicamentos - Filtro={Filtro}", nombre ?? "(ninguno)");

        var medicamentos = await _repositorio.ObtenerTodosAsync(nombre, ct);
        return Ok(medicamentos);
    }

    // =======================================================================
    // READ - GET api/medicamentos/5
    // =======================================================================
    /// <summary>Obtiene un medicamento por su Id.</summary>
    /// <response code="200">Medicamento encontrado.</response>
    /// <response code="404">No existe un medicamento con ese Id.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Medicamento), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Medicamento>> ObtenerPorId(int id, CancellationToken ct)
    {
        _logger.LogInformation("GET api/medicamentos/{Id}", id);

        var medicamento = await _repositorio.ObtenerPorIdAsync(id, ct);

        if (medicamento is null)
            return NotFound(new { mensaje = $"No existe un medicamento con Id {id}." });

        return Ok(medicamento);
    }

    // =======================================================================
    // READ (extra) - GET api/medicamentos/stock-bajo
    // Endpoint que demuestra el uso de IConfiguration dentro de un controlador.
    // =======================================================================
    /// <summary>
    /// Lista los medicamentos cuyo stock esta por debajo del umbral minimo
    /// definido en appsettings.json (clave <c>Farmacia:StockMinimo</c>).
    /// </summary>
    /// <response code="200">Medicamentos con stock bajo y el umbral aplicado.</response>
    [HttpGet("stock-bajo")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerStockBajo(CancellationToken ct)
    {
        // --- USO DE IConfiguration EN EL CONTROLADOR -------------------------
        // El umbral no esta escrito en el codigo: se lee de la configuracion,
        // asi se puede cambiar sin recompilar la aplicacion.
        var stockMinimo = _configuracion.GetValue<int>("Farmacia:StockMinimo", 20);

        var todos = await _repositorio.ObtenerTodosAsync(null, ct);
        var bajos = todos.Where(m => m.Stock <= stockMinimo).ToList();

        _logger.LogWarning(
            "Revision de inventario: {Total} medicamentos con stock menor o igual a {Umbral}.",
            bajos.Count, stockMinimo);

        return Ok(new
        {
            umbral = stockMinimo,
            total = bajos.Count,
            medicamentos = bajos
        });
    }

    // =======================================================================
    // CREATE - POST api/medicamentos
    // =======================================================================
    /// <summary>Registra un medicamento nuevo en el inventario.</summary>
    /// <response code="201">Medicamento creado. La cabecera Location apunta al recurso.</response>
    /// <response code="400">Los datos enviados no pasaron la validacion.</response>
    [HttpPost]
    [ProducesResponseType(typeof(Medicamento), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Medicamento>> Crear([FromBody] MedicamentoDto dto, CancellationToken ct)
    {
        // Gracias a [ApiController] las validaciones del DTO ya se ejecutaron:
        // si fallaran, ASP.NET Core habria devuelto un 400 sin entrar aqui.
        // Esta validacion extra es una regla de negocio que los atributos no cubren.
        if (dto.FechaVencimiento.HasValue &&
            dto.FechaVencimiento.Value < DateOnly.FromDateTime(DateTime.Today))
        {
            _logger.LogWarning("Se rechazo un medicamento ya vencido: {Nombre}", dto.Nombre);
            return BadRequest(new { mensaje = "No se puede registrar un medicamento con fecha de vencimiento pasada." });
        }

        var creado = await _repositorio.CrearAsync(dto, ct);

        // Dejamos rastro con nuestro servicio propio.
        await _auditoria.RegistrarAsync(
            entidad: "medicamentos",
            operacion: "CREATE",
            idRegistro: creado.Id,
            detalle: $"Se registro '{creado.Nombre}' con stock {creado.Stock}.",
            ct: ct);

        // CreatedAtAction devuelve 201 y la URL del recurso en la cabecera Location.
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    // =======================================================================
    // UPDATE - PUT api/medicamentos/5
    // =======================================================================
    /// <summary>Actualiza todos los datos de un medicamento existente.</summary>
    /// <response code="200">Medicamento actualizado.</response>
    /// <response code="400">Los datos enviados no pasaron la validacion.</response>
    /// <response code="404">No existe un medicamento con ese Id.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(Medicamento), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Medicamento>> Actualizar(int id, [FromBody] MedicamentoDto dto, CancellationToken ct)
    {
        var actualizado = await _repositorio.ActualizarAsync(id, dto, ct);

        if (actualizado is null)
            return NotFound(new { mensaje = $"No existe un medicamento con Id {id}." });

        await _auditoria.RegistrarAsync(
            entidad: "medicamentos",
            operacion: "UPDATE",
            idRegistro: id,
            detalle: $"Se actualizo '{actualizado.Nombre}'. Precio {actualizado.Precio:N2}, stock {actualizado.Stock}.",
            ct: ct);

        return Ok(actualizado);
    }

    // =======================================================================
    // DELETE - DELETE api/medicamentos/5
    // =======================================================================
    /// <summary>Elimina un medicamento del inventario.</summary>
    /// <response code="204">Medicamento eliminado, sin contenido de respuesta.</response>
    /// <response code="404">No existe un medicamento con ese Id.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        // Leemos el registro antes de borrarlo para poder auditar su nombre.
        var existente = await _repositorio.ObtenerPorIdAsync(id, ct);
        if (existente is null)
            return NotFound(new { mensaje = $"No existe un medicamento con Id {id}." });

        var eliminado = await _repositorio.EliminarAsync(id, ct);
        if (!eliminado)
            return NotFound(new { mensaje = $"No existe un medicamento con Id {id}." });

        await _auditoria.RegistrarAsync(
            entidad: "medicamentos",
            operacion: "DELETE",
            idRegistro: id,
            detalle: $"Se elimino '{existente.Nombre}'.",
            ct: ct);

        return NoContent();
    }
}

using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace FarmaciaAPI.Controllers;

/// <summary>
/// CRUD completo de la tabla <c>clientes</c>.
///
/// Recibe por inyeccion de dependencias:
///   - IClienteRepositorio (interfaz propia)
///   - IAuditoriaServicio  (interfaz propia)
///   - ILogger&lt;ClientesController&gt;
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ClientesController : ControllerBase
{
    private readonly IClienteRepositorio _repositorio;
    private readonly IAuditoriaServicio _auditoria;
    private readonly ILogger<ClientesController> _logger;

    public ClientesController(
        IClienteRepositorio repositorio,            // DI: interfaz propia
        IAuditoriaServicio auditoria,               // DI: interfaz propia
        ILogger<ClientesController> logger)         // DI: ILogger
    {
        _repositorio = repositorio;
        _auditoria = auditoria;
        _logger = logger;
    }

    // =======================================================================
    // READ - GET api/clientes
    // =======================================================================
    /// <summary>Lista los clientes registrados en la farmacia.</summary>
    /// <param name="buscar">Filtro opcional por documento, nombres o apellidos.</param>
    /// <response code="200">Lista de clientes.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Cliente>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Cliente>>> ObtenerTodos(
        [FromQuery] string? buscar,
        CancellationToken ct)
    {
        _logger.LogInformation("GET api/clientes - Filtro={Filtro}", buscar ?? "(ninguno)");

        var clientes = await _repositorio.ObtenerTodosAsync(buscar, ct);
        return Ok(clientes);
    }

    // =======================================================================
    // READ - GET api/clientes/5
    // =======================================================================
    /// <summary>Obtiene un cliente por su Id.</summary>
    /// <response code="200">Cliente encontrado.</response>
    /// <response code="404">No existe un cliente con ese Id.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Cliente), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Cliente>> ObtenerPorId(int id, CancellationToken ct)
    {
        _logger.LogInformation("GET api/clientes/{Id}", id);

        var cliente = await _repositorio.ObtenerPorIdAsync(id, ct);

        if (cliente is null)
            return NotFound(new { mensaje = $"No existe un cliente con Id {id}." });

        return Ok(cliente);
    }

    // =======================================================================
    // CREATE - POST api/clientes
    // =======================================================================
    /// <summary>Registra un cliente nuevo.</summary>
    /// <response code="201">Cliente creado.</response>
    /// <response code="400">Datos invalidos.</response>
    /// <response code="409">Ya existe un cliente con ese documento.</response>
    [HttpPost]
    [ProducesResponseType(typeof(Cliente), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<Cliente>> Crear([FromBody] ClienteDto dto, CancellationToken ct)
    {
        // Regla de negocio: el documento es unico. Lo validamos antes de
        // insertar para devolver un 409 claro en lugar de dejar que explote la
        // restriccion UNIQUE de PostgreSQL con un error 500.
        if (await _repositorio.ExisteDocumentoAsync(dto.Documento, null, ct))
        {
            _logger.LogWarning("Documento duplicado al crear cliente: {Documento}", dto.Documento);
            return Conflict(new { mensaje = $"Ya existe un cliente con el documento {dto.Documento}." });
        }

        var creado = await _repositorio.CrearAsync(dto, ct);

        await _auditoria.RegistrarAsync(
            entidad: "clientes",
            operacion: "CREATE",
            idRegistro: creado.Id,
            detalle: $"Se registro al cliente '{creado.NombreCompleto}' (doc. {creado.Documento}).",
            ct: ct);

        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    // =======================================================================
    // UPDATE - PUT api/clientes/5
    // =======================================================================
    /// <summary>Actualiza los datos de un cliente existente.</summary>
    /// <response code="200">Cliente actualizado.</response>
    /// <response code="400">Datos invalidos.</response>
    /// <response code="404">No existe un cliente con ese Id.</response>
    /// <response code="409">Otro cliente ya usa ese documento.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(Cliente), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<Cliente>> Actualizar(int id, [FromBody] ClienteDto dto, CancellationToken ct)
    {
        // Al editar excluimos el propio Id para que no choque consigo mismo.
        if (await _repositorio.ExisteDocumentoAsync(dto.Documento, id, ct))
        {
            _logger.LogWarning("Documento duplicado al actualizar el cliente {Id}: {Documento}", id, dto.Documento);
            return Conflict(new { mensaje = $"Otro cliente ya tiene el documento {dto.Documento}." });
        }

        var actualizado = await _repositorio.ActualizarAsync(id, dto, ct);

        if (actualizado is null)
            return NotFound(new { mensaje = $"No existe un cliente con Id {id}." });

        await _auditoria.RegistrarAsync(
            entidad: "clientes",
            operacion: "UPDATE",
            idRegistro: id,
            detalle: $"Se actualizaron los datos de '{actualizado.NombreCompleto}'.",
            ct: ct);

        return Ok(actualizado);
    }

    // =======================================================================
    // DELETE - DELETE api/clientes/5
    // =======================================================================
    /// <summary>Elimina un cliente.</summary>
    /// <response code="204">Cliente eliminado.</response>
    /// <response code="404">No existe un cliente con ese Id.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        var existente = await _repositorio.ObtenerPorIdAsync(id, ct);
        if (existente is null)
            return NotFound(new { mensaje = $"No existe un cliente con Id {id}." });

        var eliminado = await _repositorio.EliminarAsync(id, ct);
        if (!eliminado)
            return NotFound(new { mensaje = $"No existe un cliente con Id {id}." });

        await _auditoria.RegistrarAsync(
            entidad: "clientes",
            operacion: "DELETE",
            idRegistro: id,
            detalle: $"Se elimino al cliente '{existente.NombreCompleto}' (doc. {existente.Documento}).",
            ct: ct);

        return NoContent();
    }
}

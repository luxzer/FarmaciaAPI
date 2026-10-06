using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;

namespace FarmaciaAPI.Interfaces;

/// <summary>
/// INTERFAZ PROPIA #3 - Contrato del CRUD de la tabla <c>clientes</c>.
/// </summary>
public interface IClienteRepositorio
{
    /// <summary>READ - Lista los clientes, con filtro opcional por documento o apellido.</summary>
    Task<IReadOnlyList<Cliente>> ObtenerTodosAsync(string? buscar = null, CancellationToken ct = default);

    /// <summary>READ - Obtiene un cliente por su llave primaria.</summary>
    Task<Cliente?> ObtenerPorIdAsync(int id, CancellationToken ct = default);

    /// <summary>CREATE - Inserta un cliente y devuelve la fila creada con su Id.</summary>
    Task<Cliente> CrearAsync(ClienteDto dto, CancellationToken ct = default);

    /// <summary>UPDATE - Actualiza un cliente. Devuelve null si el Id no existe.</summary>
    Task<Cliente?> ActualizarAsync(int id, ClienteDto dto, CancellationToken ct = default);

    /// <summary>DELETE - Elimina un cliente. Devuelve false si el Id no existe.</summary>
    Task<bool> EliminarAsync(int id, CancellationToken ct = default);

    /// <summary>
    /// Valida la regla de negocio "documento unico" antes de insertar o actualizar.
    /// <paramref name="idExcluir"/> sirve para que al editar no choque consigo mismo.
    /// </summary>
    Task<bool> ExisteDocumentoAsync(string documento, int? idExcluir = null, CancellationToken ct = default);
}

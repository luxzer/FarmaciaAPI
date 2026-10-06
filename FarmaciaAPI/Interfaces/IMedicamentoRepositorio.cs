using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;

namespace FarmaciaAPI.Interfaces;

/// <summary>
/// INTERFAZ PROPIA #2 - Contrato del CRUD de la tabla <c>medicamentos</c>.
///
/// El MedicamentosController depende de esta abstraccion, no de la clase
/// concreta MedicamentoRepositorio. Ese es el principio de inversion de
/// dependencias: el controlador no sabe si los datos vienen de PostgreSQL,
/// de un archivo o de una API externa.
/// </summary>
public interface IMedicamentoRepositorio
{
    /// <summary>READ - Lista los medicamentos, con filtro opcional por nombre.</summary>
    Task<IReadOnlyList<Medicamento>> ObtenerTodosAsync(string? nombre = null, CancellationToken ct = default);

    /// <summary>READ - Obtiene un medicamento por su llave primaria.</summary>
    Task<Medicamento?> ObtenerPorIdAsync(int id, CancellationToken ct = default);

    /// <summary>CREATE - Inserta un medicamento y devuelve la fila creada con su Id.</summary>
    Task<Medicamento> CrearAsync(MedicamentoDto dto, CancellationToken ct = default);

    /// <summary>UPDATE - Actualiza un medicamento. Devuelve null si el Id no existe.</summary>
    Task<Medicamento?> ActualizarAsync(int id, MedicamentoDto dto, CancellationToken ct = default);

    /// <summary>DELETE - Elimina un medicamento. Devuelve false si el Id no existe.</summary>
    Task<bool> EliminarAsync(int id, CancellationToken ct = default);
}

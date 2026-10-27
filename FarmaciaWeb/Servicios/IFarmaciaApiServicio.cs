using FarmaciaWeb.Models;

namespace FarmaciaWeb.Servicios;

/// <summary>
/// Contrato del servicio que habla con la Web API de la farmacia.
///
/// Las paginas y los componentes dependen de esta interfaz, nunca de HttpClient
/// directamente. Asi la pantalla no sabe si los datos vienen de una API REST,
/// de un archivo o de datos de prueba.
/// </summary>
public interface IFarmaciaApiServicio
{
    /// <summary>Lista los medicamentos. Si llega un nombre, filtra por el.</summary>
    Task<IReadOnlyList<Medicamento>> ObtenerMedicamentosAsync(string? nombre = null, CancellationToken ct = default);

    /// <summary>Medicamentos por debajo del umbral de stock configurado en la API.</summary>
    Task<ResultadoStockBajo?> ObtenerStockBajoAsync(CancellationToken ct = default);

    /// <summary>Lista los clientes. Si llega un texto, busca por documento, nombres o apellidos.</summary>
    Task<IReadOnlyList<Cliente>> ObtenerClientesAsync(string? buscar = null, CancellationToken ct = default);

    /// <summary>Estado de la API y de su conexion a MySQL.</summary>
    Task<EstadoApi?> ObtenerEstadoAsync(CancellationToken ct = default);
}

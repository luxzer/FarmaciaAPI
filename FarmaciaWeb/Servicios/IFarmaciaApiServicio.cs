using FarmaciaWeb.Models;

namespace FarmaciaWeb.Servicios;

public interface IFarmaciaApiServicio
{
    Task<IReadOnlyList<Medicamento>> ObtenerMedicamentosAsync(string? nombre = null, CancellationToken ct = default);

    Task<ResultadoStockBajo?> ObtenerStockBajoAsync(CancellationToken ct = default);

    Task<IReadOnlyList<Cliente>> ObtenerClientesAsync(string? buscar = null, CancellationToken ct = default);

    Task<EstadoApi?> ObtenerEstadoAsync(CancellationToken ct = default);
}

using FarmaciaAPI.Models;

namespace FarmaciaAPI.Interfaces;

/// <summary>
/// INTERFAZ PROPIA #4 - Servicio de auditoria.
///
/// Es el mejor ejemplo del proyecto para explicar DI en clase, porque su
/// implementacion recibe por constructor las TRES dependencias que exige el
/// enunciado al mismo tiempo:
///   - ILogger&lt;AuditoriaServicio&gt;  -> escribe el evento en la consola
///   - IConfiguration                   -> lee si la auditoria esta habilitada
///   - IFabricaConexion (nuestra)       -> guarda el evento en la tabla auditoria
/// </summary>
public interface IAuditoriaServicio
{
    /// <summary>Registra una operacion en la consola (ILogger) y en la tabla auditoria.</summary>
    Task RegistrarAsync(string entidad, string operacion, int? idRegistro, string detalle, CancellationToken ct = default);

    /// <summary>Devuelve los ultimos movimientos registrados.</summary>
    Task<IReadOnlyList<RegistroAuditoria>> ObtenerUltimosAsync(int cantidad = 20, CancellationToken ct = default);
}

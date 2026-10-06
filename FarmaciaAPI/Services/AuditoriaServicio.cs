using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using MySqlConnector;

namespace FarmaciaAPI.Services;

/// <summary>
/// Implementacion de <see cref="IAuditoriaServicio"/>.
///
/// Esta clase es el ejemplo mas completo de INYECCION DE DEPENDENCIAS del
/// proyecto: recibe por constructor las tres dependencias que pide el
/// enunciado y no construye ninguna con "new".
/// </summary>
public class AuditoriaServicio : IAuditoriaServicio
{
    private readonly IFabricaConexion _fabrica;                 // DI: interfaz propia
    private readonly ILogger<AuditoriaServicio> _logger;        // DI: ILogger
    private readonly bool _habilitada;                          // viene de IConfiguration
    private readonly string _nombreFarmacia;                    // viene de IConfiguration
    private readonly string _usuarioSistema;                    // viene de IConfiguration

    public AuditoriaServicio(
        IFabricaConexion fabrica,
        IConfiguration configuracion,                           // DI: IConfiguration
        ILogger<AuditoriaServicio> logger)
    {
        _fabrica = fabrica;
        _logger = logger;

        // --- USO DE IConfiguration -------------------------------------------
        // GetValue<T> lee la clave y convierte el tipo. El segundo argumento es
        // el valor por defecto si la clave no existe en appsettings.json.
        _habilitada      = configuracion.GetValue<bool>("Farmacia:AuditoriaHabilitada", true);
        _nombreFarmacia  = configuracion.GetValue<string>("Farmacia:Nombre") ?? "Farmacia";
        _usuarioSistema  = configuracion.GetValue<string>("Farmacia:UsuarioSistema") ?? "sistema";

        // Usamos LogDebug y no LogInformation a proposito: este servicio esta
        // registrado como Scoped, asi que el contenedor lo construye de nuevo
        // en CADA peticion HTTP. Si el mensaje fuera Information, se repetiria
        // una vez por peticion y ensuciaria la consola. Con Debug solo aparece
        // si se baja el nivel minimo de log en appsettings.json.
        _logger.LogDebug(
            "Servicio de auditoria inicializado para {Farmacia}. Habilitada={Habilitada}",
            _nombreFarmacia, _habilitada);
    }

    /// <summary>
    /// Deja rastro de la operacion en dos lugares: la consola (ILogger) y la
    /// tabla auditoria. Si la auditoria esta deshabilitada por configuracion,
    /// solo escribe en consola.
    /// </summary>
    public async Task RegistrarAsync(string entidad, string operacion, int? idRegistro, string detalle, CancellationToken ct = default)
    {
        // --- USO DE ILogger ---------------------------------------------------
        // El logging estructurado con {Llaves} permite filtrar por campo en
        // herramientas como Seq o Application Insights, no es solo texto.
        _logger.LogInformation(
            "AUDITORIA [{Farmacia}] {Operacion} sobre {Entidad} Id={IdRegistro} :: {Detalle}",
            _nombreFarmacia, operacion, entidad, idRegistro, detalle);

        if (!_habilitada)
            return;

        try
        {
            const string sql =
                "INSERT INTO auditoria (entidad, operacion, id_registro, detalle, usuario) " +
                "VALUES (@entidad, @operacion, @id_registro, @detalle, @usuario);";

            await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
            await using var comando = new MySqlCommand(sql, conexion);
            comando.Parameters.AddWithValue("@entidad", entidad);
            comando.Parameters.AddWithValue("@operacion", operacion);
            comando.Parameters.AddWithValue("@id_registro",
                idRegistro.HasValue ? idRegistro.Value : (object)DBNull.Value);
            comando.Parameters.AddWithValue("@detalle", detalle);
            comando.Parameters.AddWithValue("@usuario", _usuarioSistema);

            await comando.ExecuteNonQueryAsync(ct);
        }
        catch (Exception ex)
        {
            // La auditoria no debe tumbar la operacion principal: si el INSERT
            // falla lo reportamos como error y seguimos.
            _logger.LogError(ex,
                "No se pudo guardar el registro de auditoria. Entidad={Entidad} Operacion={Operacion}",
                entidad, operacion);
        }
    }

    public async Task<IReadOnlyList<RegistroAuditoria>> ObtenerUltimosAsync(int cantidad = 20, CancellationToken ct = default)
    {
        // Acotamos la cantidad para que nadie pida 1.000.000 de filas.
        cantidad = Math.Clamp(cantidad, 1, 200);

        const string sql =
            "SELECT id, entidad, operacion, id_registro, detalle, usuario, fecha " +
            "FROM auditoria ORDER BY fecha DESC, id DESC LIMIT @cantidad;";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@cantidad", cantidad);

        var lista = new List<RegistroAuditoria>();
        await using var lector = await comando.ExecuteReaderAsync(ct);
        while (await lector.ReadAsync(ct))
        {
            lista.Add(new RegistroAuditoria
            {
                Id         = lector.GetInt32(0),
                Entidad    = lector.GetString(1),
                Operacion  = lector.GetString(2),
                IdRegistro = lector.IsDBNull(3) ? null : lector.GetInt32(3),
                Detalle    = lector.IsDBNull(4) ? null : lector.GetString(4),
                Usuario    = lector.IsDBNull(5) ? null : lector.GetString(5),
                Fecha      = lector.GetDateTime(6)
            });
        }

        return lista;
    }
}

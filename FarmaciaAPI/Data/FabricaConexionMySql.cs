using FarmaciaAPI.Interfaces;
using MySqlConnector;

namespace FarmaciaAPI.Data;

/// <summary>
/// Implementacion de <see cref="IFabricaConexion"/> para MySQL usando
/// ADO.NET puro (el paquete MySqlConnector), sin ningun ORM.
///
/// INYECCION DE DEPENDENCIAS: el contenedor de ASP.NET Core le pasa por
/// constructor IConfiguration y ILogger. Nosotros nunca hacemos "new" de esta
/// clase; se registra en Program.cs y el framework la construye.
/// </summary>
public class FabricaConexionMySql : IFabricaConexion
{
    private readonly ILogger<FabricaConexionMySql> _logger;
    private readonly string _cadenaConexion;

    public FabricaConexionMySql(
        IConfiguration configuracion,                      // DI: IConfiguration
        ILogger<FabricaConexionMySql> logger)              // DI: ILogger
    {
        _logger = logger;

        // --- USO DE IConfiguration -------------------------------------------
        // Lee la cadena de conexion de appsettings.json, seccion
        // "ConnectionStrings:FarmaciaDb". Si existe una variable de entorno
        // ConnectionStrings__FarmaciaDb, IConfiguration le da prioridad
        // automaticamente, asi la contrasena no queda en el repositorio.
        _cadenaConexion = configuracion.GetConnectionString("FarmaciaDb")
            ?? throw new InvalidOperationException(
                "No se encontro la cadena de conexion 'FarmaciaDb'. " +
                "Revisa appsettings.json o define la variable de entorno " +
                "ConnectionStrings__FarmaciaDb.");

        // Nunca registramos la cadena completa en el log: lleva la contrasena.
        // MySqlConnectionStringBuilder nos deja leer las partes sueltas.
        var constructor = new MySqlConnectionStringBuilder(_cadenaConexion);
        _logger.LogInformation(
            "Fabrica de conexiones lista. Servidor={Servidor} Puerto={Puerto} BaseDatos={BaseDatos} Usuario={Usuario}",
            constructor.Server, constructor.Port, constructor.Database, constructor.UserID);
    }

    /// <summary>
    /// Crea la conexion y la abre. MySqlConnector mantiene internamente un
    /// pool, por lo que abrir y cerrar en cada operacion es la practica
    /// recomendada: no se crea un socket nuevo cada vez, se reutiliza uno del
    /// pool.
    /// </summary>
    public async Task<MySqlConnection> CrearConexionAbiertaAsync(CancellationToken ct = default)
    {
        var conexion = new MySqlConnection(_cadenaConexion);
        await conexion.OpenAsync(ct);
        return conexion;
    }

    /// <summary>Ejecuta un SELECT 1 para comprobar que la base de datos responde.</summary>
    public async Task<bool> ProbarConexionAsync(CancellationToken ct = default)
    {
        try
        {
            await using var conexion = await CrearConexionAbiertaAsync(ct);
            await using var comando = new MySqlCommand("SELECT 1;", conexion);
            await comando.ExecuteScalarAsync(ct);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo la prueba de conexion contra MySQL.");
            return false;
        }
    }
}

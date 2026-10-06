using MySqlConnector;

namespace FarmaciaAPI.Interfaces;

/// <summary>
/// INTERFAZ PROPIA #1 - Fabrica de conexiones.
///
/// Encapsula la creacion de la conexion a MySQL. Los repositorios piden esta
/// interfaz por constructor y nunca leen la cadena de conexion por su cuenta:
/// eso lo hace la implementacion concreta a traves de IConfiguration.
///
/// Ventaja: si manana cambiamos de MySQL a otro motor, o queremos usar una
/// conexion falsa en las pruebas unitarias, solo cambiamos el registro de esta
/// interfaz en Program.cs sin tocar los repositorios ni los controladores.
/// </summary>
public interface IFabricaConexion
{
    /// <summary>Crea y abre una nueva conexion a la base de datos.</summary>
    Task<MySqlConnection> CrearConexionAbiertaAsync(CancellationToken ct = default);

    /// <summary>Verifica que la base de datos responda. Lo usa el endpoint de salud.</summary>
    Task<bool> ProbarConexionAsync(CancellationToken ct = default);
}

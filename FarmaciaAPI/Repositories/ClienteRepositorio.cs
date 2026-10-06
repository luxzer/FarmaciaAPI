using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;
using MySqlConnector;

namespace FarmaciaAPI.Repositories;

/// <summary>
/// Implementacion de <see cref="IClienteRepositorio"/> con ADO.NET puro
/// (MySqlConnector). Misma tecnica que MedicamentoRepositorio: SQL escrito a
/// mano, parametros y mapeo manual del MySqlDataReader.
/// </summary>
public class ClienteRepositorio : IClienteRepositorio
{
    private readonly IFabricaConexion _fabrica;                // DI: interfaz propia
    private readonly ILogger<ClienteRepositorio> _logger;      // DI: ILogger

    private const string Columnas =
        "id, nombres, apellidos, documento, telefono, email, " +
        "direccion, fecha_nacimiento, activo, fecha_registro";

    public ClienteRepositorio(IFabricaConexion fabrica, ILogger<ClienteRepositorio> logger)
    {
        _fabrica = fabrica;
        _logger = logger;
    }

    // --------------------------------------------------------- READ (lista completa)
    public async Task<IReadOnlyList<Cliente>> ObtenerTodosAsync(string? buscar = null, CancellationToken ct = default)
    {
        var sql = $"SELECT {Columnas} FROM clientes";

        // Un solo parametro busca en documento, nombres y apellidos.
        if (!string.IsNullOrWhiteSpace(buscar))
            sql += " WHERE documento LIKE @buscar " +
                   "    OR nombres   LIKE @buscar " +
                   "    OR apellidos LIKE @buscar";

        sql += " ORDER BY apellidos, nombres";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);

        if (!string.IsNullOrWhiteSpace(buscar))
            comando.Parameters.AddWithValue("@buscar", $"%{buscar.Trim()}%");

        var lista = new List<Cliente>();
        await using var lector = await comando.ExecuteReaderAsync(ct);
        while (await lector.ReadAsync(ct))
            lista.Add(Mapear(lector));

        _logger.LogInformation(
            "Consulta de clientes ejecutada. Filtro={Filtro} Resultados={Total}",
            buscar ?? "(ninguno)", lista.Count);

        return lista;
    }

    // ------------------------------------------------------------- READ (por Id)
    public async Task<Cliente?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        var encontrado = await ObtenerPorIdAsync(conexion, id, ct);

        if (encontrado is null)
            _logger.LogWarning("No existe el cliente con Id={Id}.", id);

        return encontrado;
    }

    // ------------------------------------------------------------------- CREATE
    public async Task<Cliente> CrearAsync(ClienteDto dto, CancellationToken ct = default)
    {
        const string sql =
            "INSERT INTO clientes " +
            "(nombres, apellidos, documento, telefono, email, direccion, fecha_nacimiento, activo) " +
            "VALUES (@nombres, @apellidos, @documento, @telefono, @email, @direccion, @fecha_nacimiento, @activo);";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        AgregarParametros(comando, dto);

        await comando.ExecuteNonQueryAsync(ct);

        // LastInsertedId trae el valor que genero el AUTO_INCREMENT.
        var nuevoId = (int)comando.LastInsertedId;

        var creado = await ObtenerPorIdAsync(conexion, nuevoId, ct)
            ?? throw new InvalidOperationException(
                $"El cliente se inserto con Id {nuevoId} pero no se pudo releer.");

        _logger.LogInformation("Cliente creado. Id={Id} Documento={Documento}",
            creado.Id, creado.Documento);
        return creado;
    }

    // ------------------------------------------------------------------- UPDATE
    public async Task<Cliente?> ActualizarAsync(int id, ClienteDto dto, CancellationToken ct = default)
    {
        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);

        // Igual que en medicamentos: en MySQL las filas afectadas por un UPDATE
        // pueden ser 0 aunque el registro exista (si los valores no cambiaron),
        // asi que verificamos la existencia aparte.
        if (await ObtenerPorIdAsync(conexion, id, ct) is null)
        {
            _logger.LogWarning("Intento de actualizar un cliente inexistente. Id={Id}", id);
            return null;
        }

        const string sql =
            "UPDATE clientes SET " +
            "   nombres          = @nombres, " +
            "   apellidos        = @apellidos, " +
            "   documento        = @documento, " +
            "   telefono         = @telefono, " +
            "   email            = @email, " +
            "   direccion        = @direccion, " +
            "   fecha_nacimiento = @fecha_nacimiento, " +
            "   activo           = @activo " +
            "WHERE id = @id;";

        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);
        AgregarParametros(comando, dto);
        await comando.ExecuteNonQueryAsync(ct);

        var actualizado = await ObtenerPorIdAsync(conexion, id, ct);

        _logger.LogInformation("Cliente actualizado. Id={Id} Documento={Documento}",
            actualizado!.Id, actualizado.Documento);
        return actualizado;
    }

    // ------------------------------------------------------------------- DELETE
    public async Task<bool> EliminarAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM clientes WHERE id = @id;";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);

        var filasAfectadas = await comando.ExecuteNonQueryAsync(ct);

        if (filasAfectadas == 0)
        {
            _logger.LogWarning("Intento de eliminar un cliente inexistente. Id={Id}", id);
            return false;
        }

        _logger.LogInformation("Cliente eliminado. Id={Id}", id);
        return true;
    }

    // ------------------------------------------------------- Regla de negocio
    public async Task<bool> ExisteDocumentoAsync(string documento, int? idExcluir = null, CancellationToken ct = default)
    {
        // EXISTS es mas eficiente que COUNT(*): MySQL deja de buscar en cuanto
        // encuentra la primera coincidencia.
        var sql = "SELECT EXISTS (SELECT 1 FROM clientes WHERE documento = @documento";
        if (idExcluir.HasValue)
            sql += " AND id <> @idExcluir";
        sql += ");";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@documento", documento.Trim());
        if (idExcluir.HasValue)
            comando.Parameters.AddWithValue("@idExcluir", idExcluir.Value);

        // ExecuteScalarAsync devuelve el primer valor de la primera fila.
        // MySQL no tiene tipo booleano real: EXISTS devuelve 1 o 0 como entero,
        // por eso convertimos en lugar de comparar contra true.
        var resultado = await comando.ExecuteScalarAsync(ct);
        return resultado is not null && Convert.ToInt32(resultado) == 1;
    }

    // --------------------------------------------------------------- Auxiliares

    private static async Task<Cliente?> ObtenerPorIdAsync(
        MySqlConnection conexion, int id, CancellationToken ct)
    {
        var sql = $"SELECT {Columnas} FROM clientes WHERE id = @id;";

        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);

        await using var lector = await comando.ExecuteReaderAsync(ct);
        return await lector.ReadAsync(ct) ? Mapear(lector) : null;
    }

    private static void AgregarParametros(MySqlCommand comando, ClienteDto dto)
    {
        comando.Parameters.AddWithValue("@nombres", dto.Nombres.Trim());
        comando.Parameters.AddWithValue("@apellidos", dto.Apellidos.Trim());
        comando.Parameters.AddWithValue("@documento", dto.Documento.Trim());

        comando.Parameters.AddWithValue("@telefono",
            string.IsNullOrWhiteSpace(dto.Telefono) ? DBNull.Value : dto.Telefono.Trim());
        comando.Parameters.AddWithValue("@email",
            string.IsNullOrWhiteSpace(dto.Email) ? DBNull.Value : dto.Email.Trim());
        comando.Parameters.AddWithValue("@direccion",
            string.IsNullOrWhiteSpace(dto.Direccion) ? DBNull.Value : dto.Direccion.Trim());

        comando.Parameters.AddWithValue("@fecha_nacimiento",
            dto.FechaNacimiento.HasValue
                ? dto.FechaNacimiento.Value.ToDateTime(TimeOnly.MinValue)
                : DBNull.Value);

        comando.Parameters.AddWithValue("@activo", dto.Activo);
    }

    private static Cliente Mapear(MySqlDataReader lector) => new()
    {
        Id              = lector.GetInt32(lector.GetOrdinal("id")),
        Nombres         = lector.GetString(lector.GetOrdinal("nombres")),
        Apellidos       = lector.GetString(lector.GetOrdinal("apellidos")),
        Documento       = lector.GetString(lector.GetOrdinal("documento")),
        Telefono        = LeerTextoOpcional(lector, "telefono"),
        Email           = LeerTextoOpcional(lector, "email"),
        Direccion       = LeerTextoOpcional(lector, "direccion"),
        FechaNacimiento = LeerFechaOpcional(lector, "fecha_nacimiento"),
        Activo          = lector.GetBoolean(lector.GetOrdinal("activo")),
        FechaRegistro   = lector.GetDateTime(lector.GetOrdinal("fecha_registro"))
    };

    private static string? LeerTextoOpcional(MySqlDataReader lector, string columna)
    {
        var indice = lector.GetOrdinal(columna);
        return lector.IsDBNull(indice) ? null : lector.GetString(indice);
    }

    private static DateOnly? LeerFechaOpcional(MySqlDataReader lector, string columna)
    {
        var indice = lector.GetOrdinal(columna);
        return lector.IsDBNull(indice)
            ? null
            : DateOnly.FromDateTime(lector.GetDateTime(indice));
    }
}

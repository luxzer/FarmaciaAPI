using FarmaciaAPI.Interfaces;
using FarmaciaAPI.Models;
using FarmaciaAPI.Models.Dtos;
using MySqlConnector;

namespace FarmaciaAPI.Repositories;

/// <summary>
/// Implementacion de <see cref="IMedicamentoRepositorio"/> con ADO.NET puro.
///
/// METODO DE CONEXION: MySqlConnection + MySqlCommand + MySqlDataReader.
/// Escribimos el SQL a mano y mapeamos columna por columna. No hay ORM.
///
/// SEGURIDAD: todos los valores viajan como PARAMETROS (@nombre, @precio...),
/// nunca concatenados al texto del SQL. Eso es lo que evita la inyeccion SQL.
/// </summary>
public class MedicamentoRepositorio : IMedicamentoRepositorio
{
    private readonly IFabricaConexion _fabrica;                   // DI: interfaz propia
    private readonly ILogger<MedicamentoRepositorio> _logger;     // DI: ILogger

    // Lista de columnas en un solo lugar para que todos los SELECT devuelvan
    // exactamente lo que espera el metodo Mapear.
    private const string Columnas =
        "id, nombre, laboratorio, descripcion, precio, stock, " +
        "requiere_receta, fecha_vencimiento, activo, fecha_registro";

    public MedicamentoRepositorio(IFabricaConexion fabrica, ILogger<MedicamentoRepositorio> logger)
    {
        _fabrica = fabrica;
        _logger = logger;
    }

    // --------------------------------------------------------- READ (lista completa)
    public async Task<IReadOnlyList<Medicamento>> ObtenerTodosAsync(string? nombre = null, CancellationToken ct = default)
    {
        var sql = $"SELECT {Columnas} FROM medicamentos";

        // Filtro opcional: solo agregamos el WHERE si llego el parametro.
        if (!string.IsNullOrWhiteSpace(nombre))
            sql += " WHERE nombre LIKE @nombre";

        sql += " ORDER BY id";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);

        if (!string.IsNullOrWhiteSpace(nombre))
            comando.Parameters.AddWithValue("@nombre", $"%{nombre.Trim()}%");

        var lista = new List<Medicamento>();
        await using var lector = await comando.ExecuteReaderAsync(ct);
        while (await lector.ReadAsync(ct))
            lista.Add(Mapear(lector));

        _logger.LogInformation(
            "Consulta de medicamentos ejecutada. Filtro={Filtro} Resultados={Total}",
            nombre ?? "(ninguno)", lista.Count);

        return lista;
    }

    // ------------------------------------------------------------- READ (por Id)
    public async Task<Medicamento?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        var encontrado = await ObtenerPorIdAsync(conexion, id, ct);

        if (encontrado is null)
            _logger.LogWarning("No existe el medicamento con Id={Id}.", id);

        return encontrado;
    }

    // ------------------------------------------------------------------- CREATE
    public async Task<Medicamento> CrearAsync(MedicamentoDto dto, CancellationToken ct = default)
    {
        const string sql =
            "INSERT INTO medicamentos " +
            "(nombre, laboratorio, descripcion, precio, stock, requiere_receta, fecha_vencimiento, activo) " +
            "VALUES (@nombre, @laboratorio, @descripcion, @precio, @stock, @requiere_receta, @fecha_vencimiento, @activo);";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        AgregarParametros(comando, dto);

        await comando.ExecuteNonQueryAsync(ct);

        // MySQL no tiene la clausula RETURNING de PostgreSQL. En su lugar, el
        // comando expone LastInsertedId con el valor que genero el
        // AUTO_INCREMENT. Con ese id releemos la fila para devolverla completa,
        // ya con la fecha_registro que puso la base de datos por defecto.
        var nuevoId = (int)comando.LastInsertedId;

        var creado = await ObtenerPorIdAsync(conexion, nuevoId, ct)
            ?? throw new InvalidOperationException(
                $"El medicamento se inserto con Id {nuevoId} pero no se pudo releer.");

        _logger.LogInformation("Medicamento creado. Id={Id} Nombre={Nombre}", creado.Id, creado.Nombre);
        return creado;
    }

    // ------------------------------------------------------------------- UPDATE
    public async Task<Medicamento?> ActualizarAsync(int id, MedicamentoDto dto, CancellationToken ct = default)
    {
        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);

        // Comprobamos primero que el registro exista.
        //
        // OJO, detalle importante de MySQL: ExecuteNonQuery devuelve el numero
        // de filas MODIFICADAS, no las encontradas. Si el usuario envia los
        // mismos valores que ya estaban, MySQL responde 0 filas afectadas
        // aunque el registro si exista. Por eso no podemos usar ese numero para
        // decidir si devolver 404, y verificamos la existencia aparte.
        if (await ObtenerPorIdAsync(conexion, id, ct) is null)
        {
            _logger.LogWarning("Intento de actualizar un medicamento inexistente. Id={Id}", id);
            return null;
        }

        const string sql =
            "UPDATE medicamentos SET " +
            "   nombre            = @nombre, " +
            "   laboratorio       = @laboratorio, " +
            "   descripcion       = @descripcion, " +
            "   precio            = @precio, " +
            "   stock             = @stock, " +
            "   requiere_receta   = @requiere_receta, " +
            "   fecha_vencimiento = @fecha_vencimiento, " +
            "   activo            = @activo " +
            "WHERE id = @id;";

        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);
        AgregarParametros(comando, dto);
        await comando.ExecuteNonQueryAsync(ct);

        // Releemos para devolver el estado real que quedo guardado.
        var actualizado = await ObtenerPorIdAsync(conexion, id, ct)!;

        _logger.LogInformation("Medicamento actualizado. Id={Id} Nombre={Nombre}",
            actualizado!.Id, actualizado.Nombre);
        return actualizado;
    }

    // ------------------------------------------------------------------- DELETE
    public async Task<bool> EliminarAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM medicamentos WHERE id = @id;";

        await using var conexion = await _fabrica.CrearConexionAbiertaAsync(ct);
        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);

        // En un DELETE si podemos confiar en las filas afectadas: o la fila
        // existia y se borro (1), o no existia (0).
        var filasAfectadas = await comando.ExecuteNonQueryAsync(ct);

        if (filasAfectadas == 0)
        {
            _logger.LogWarning("Intento de eliminar un medicamento inexistente. Id={Id}", id);
            return false;
        }

        _logger.LogInformation("Medicamento eliminado. Id={Id}", id);
        return true;
    }

    // --------------------------------------------------------------- Auxiliares

    /// <summary>
    /// Lee un medicamento reutilizando una conexion ya abierta. Lo usan CrearAsync
    /// y ActualizarAsync para no abrir una segunda conexion del pool.
    /// </summary>
    private static async Task<Medicamento?> ObtenerPorIdAsync(
        MySqlConnection conexion, int id, CancellationToken ct)
    {
        var sql = $"SELECT {Columnas} FROM medicamentos WHERE id = @id;";

        await using var comando = new MySqlCommand(sql, conexion);
        comando.Parameters.AddWithValue("@id", id);

        await using var lector = await comando.ExecuteReaderAsync(ct);
        return await lector.ReadAsync(ct) ? Mapear(lector) : null;
    }

    /// <summary>Carga los parametros que comparten el INSERT y el UPDATE.</summary>
    private static void AgregarParametros(MySqlCommand comando, MedicamentoDto dto)
    {
        comando.Parameters.AddWithValue("@nombre", dto.Nombre.Trim());
        comando.Parameters.AddWithValue("@laboratorio", dto.Laboratorio.Trim());

        // Las columnas que aceptan NULL necesitan DBNull.Value, no el null de C#.
        comando.Parameters.AddWithValue("@descripcion",
            string.IsNullOrWhiteSpace(dto.Descripcion) ? DBNull.Value : dto.Descripcion.Trim());

        comando.Parameters.AddWithValue("@precio", dto.Precio);
        comando.Parameters.AddWithValue("@stock", dto.Stock);
        comando.Parameters.AddWithValue("@requiere_receta", dto.RequiereReceta);

        // MySQL no conoce el tipo DateOnly de C#, asi que lo convertimos a
        // DateTime a medianoche. La columna es DATE, por lo que la hora se
        // descarta al guardar.
        comando.Parameters.AddWithValue("@fecha_vencimiento",
            dto.FechaVencimiento.HasValue
                ? dto.FechaVencimiento.Value.ToDateTime(TimeOnly.MinValue)
                : DBNull.Value);

        comando.Parameters.AddWithValue("@activo", dto.Activo);
    }

    /// <summary>
    /// Convierte la fila actual del lector en un objeto Medicamento.
    /// Este mapeo manual es exactamente el trabajo que un ORM haria por nosotros.
    /// </summary>
    private static Medicamento Mapear(MySqlDataReader lector) => new()
    {
        Id               = lector.GetInt32(lector.GetOrdinal("id")),
        Nombre           = lector.GetString(lector.GetOrdinal("nombre")),
        Laboratorio      = lector.GetString(lector.GetOrdinal("laboratorio")),
        Descripcion      = LeerTextoOpcional(lector, "descripcion"),
        Precio           = lector.GetDecimal(lector.GetOrdinal("precio")),
        Stock            = lector.GetInt32(lector.GetOrdinal("stock")),
        RequiereReceta   = lector.GetBoolean(lector.GetOrdinal("requiere_receta")),
        FechaVencimiento = LeerFechaOpcional(lector, "fecha_vencimiento"),
        Activo           = lector.GetBoolean(lector.GetOrdinal("activo")),
        FechaRegistro    = lector.GetDateTime(lector.GetOrdinal("fecha_registro"))
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

namespace FarmaciaAPI.Models;

/// <summary>
/// Representa una fila de la tabla <c>clientes</c>.
/// </summary>
public class Cliente
{
    public int Id { get; set; }
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public DateOnly? FechaNacimiento { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }

    /// <summary>Nombre completo calculado, no existe como columna en la base de datos.</summary>
    public string NombreCompleto => $"{Nombres} {Apellidos}".Trim();
}

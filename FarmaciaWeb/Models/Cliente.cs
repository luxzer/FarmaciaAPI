namespace FarmaciaWeb.Models;

/// <summary>Cliente tal como lo devuelve el endpoint /api/clientes.</summary>
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
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Iniciales para el avatar de la tarjeta.</summary>
    public string Iniciales =>
        string.Concat(
            Nombres.FirstOrDefault(char.IsLetter),
            Apellidos.FirstOrDefault(char.IsLetter)).ToUpperInvariant();
}

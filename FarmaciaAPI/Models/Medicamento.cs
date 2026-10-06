namespace FarmaciaAPI.Models;

/// <summary>
/// Representa una fila de la tabla <c>medicamentos</c>.
/// Es el modelo que la API devuelve al cliente (salida).
/// </summary>
public class Medicamento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public bool RequiereReceta { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaRegistro { get; set; }
}

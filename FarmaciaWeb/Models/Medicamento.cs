namespace FarmaciaWeb.Models;

/// <summary>Medicamento tal como lo devuelve el endpoint /api/medicamentos.</summary>
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

    /// <summary>Faltan 90 dias o menos para que venza.</summary>
    public bool PorVencer =>
        FechaVencimiento.HasValue &&
        FechaVencimiento.Value <= DateOnly.FromDateTime(DateTime.Today.AddDays(90));
}

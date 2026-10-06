namespace FarmaciaAPI.Models;

/// <summary>
/// Representa una fila de la tabla <c>auditoria</c>, escrita por
/// <see cref="FarmaciaAPI.Interfaces.IAuditoriaServicio"/>.
/// </summary>
public class RegistroAuditoria
{
    public int Id { get; set; }
    public string Entidad { get; set; } = string.Empty;
    public string Operacion { get; set; } = string.Empty;
    public int? IdRegistro { get; set; }
    public string? Detalle { get; set; }
    public string? Usuario { get; set; }
    public DateTime Fecha { get; set; }
}

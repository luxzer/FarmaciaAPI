using System.ComponentModel.DataAnnotations;

namespace FarmaciaAPI.Models.Dtos;

/// <summary>
/// Datos que el cliente envia para crear o actualizar un medicamento.
/// Usamos un DTO separado del modelo para que el Id y la fecha de registro
/// no se puedan enviar desde fuera: los asigna la base de datos.
/// Los atributos [Required], [Range], etc. los valida ASP.NET Core de forma
/// automatica gracias a [ApiController] y devuelve un 400 con el detalle.
/// </summary>
public class MedicamentoDto
{
    [Required(ErrorMessage = "El nombre del medicamento es obligatorio.")]
    [StringLength(150, MinimumLength = 3, ErrorMessage = "El nombre debe tener entre 3 y 150 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El laboratorio es obligatorio.")]
    [StringLength(100, ErrorMessage = "El laboratorio no puede exceder 100 caracteres.")]
    public string Laboratorio { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "La descripcion no puede exceder 1000 caracteres.")]
    public string? Descripcion { get; set; }

    [Range(0, 99_999_999.99, ErrorMessage = "El precio debe ser un valor positivo.")]
    public decimal Precio { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
    public int Stock { get; set; }

    public bool RequiereReceta { get; set; }

    public DateOnly? FechaVencimiento { get; set; }

    public bool Activo { get; set; } = true;
}

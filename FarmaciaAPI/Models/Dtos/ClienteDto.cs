using System.ComponentModel.DataAnnotations;

namespace FarmaciaAPI.Models.Dtos;

/// <summary>
/// Datos que el cliente envia para crear o actualizar un cliente de la farmacia.
/// </summary>
public class ClienteDto
{
    [Required(ErrorMessage = "Los nombres son obligatorios.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Los nombres deben tener entre 2 y 100 caracteres.")]
    public string Nombres { get; set; } = string.Empty;

    [Required(ErrorMessage = "Los apellidos son obligatorios.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Los apellidos deben tener entre 2 y 100 caracteres.")]
    public string Apellidos { get; set; } = string.Empty;

    [Required(ErrorMessage = "El documento de identidad es obligatorio.")]
    [StringLength(20, MinimumLength = 5, ErrorMessage = "El documento debe tener entre 5 y 20 caracteres.")]
    public string Documento { get; set; } = string.Empty;

    [Phone(ErrorMessage = "El telefono no tiene un formato valido.")]
    [StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo electronico no tiene un formato valido.")]
    [StringLength(150)]
    public string? Email { get; set; }

    [StringLength(250)]
    public string? Direccion { get; set; }

    public DateOnly? FechaNacimiento { get; set; }

    public bool Activo { get; set; } = true;
}

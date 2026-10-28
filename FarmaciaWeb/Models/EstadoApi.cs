namespace FarmaciaWeb.Models;

public class EstadoApi
{
    public string? Api { get; set; }
    public string? Farmacia { get; set; }
    public string? Ciudad { get; set; }
    public string? MotorBaseDatos { get; set; }
    public string? BaseDatos { get; set; }
    public int StockMinimoConfigurado { get; set; }
    public DateTime FechaServidor { get; set; }

    public bool Conectada => string.Equals(BaseDatos, "conectada", StringComparison.OrdinalIgnoreCase);
}

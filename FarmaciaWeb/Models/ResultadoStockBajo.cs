namespace FarmaciaWeb.Models;

public class ResultadoStockBajo
{
    public int Umbral { get; set; }
    public int Total { get; set; }
    public List<Medicamento> Medicamentos { get; set; } = new();
}

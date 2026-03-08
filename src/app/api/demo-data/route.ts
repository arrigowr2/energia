import { NextResponse } from 'next/server';

export async function POST() {
  // Dados de demonstração realistas de energia
  const demoData = [
    {
      date: '2024-03-08',
      energiaProduzida: 15.2,
      energiaConsumida: 12.8,
      energiaVendida: 2.4,
      energiaComprada: 0.0
    },
    {
      date: '2024-03-07',
      energiaProduzida: 18.5,
      energiaConsumida: 14.2,
      energiaVendida: 4.3,
      energiaComprada: 0.0
    },
    {
      date: '2024-03-06',
      energiaProduzida: 12.1,
      energiaConsumida: 16.8,
      energiaVendida: 0.0,
      energiaComprada: 4.7
    },
    {
      date: '2024-03-05',
      energiaProduzida: 20.3,
      energiaConsumida: 13.5,
      energiaVendida: 6.8,
      energiaComprada: 0.0
    },
    {
      date: '2024-03-04',
      energiaProduzida: 8.9,
      energiaConsumida: 15.2,
      energiaVendida: 0.0,
      energiaComprada: 6.3
    },
    {
      date: '2024-03-03',
      energiaProduzida: 22.1,
      energiaConsumida: 11.7,
      energiaVendida: 10.4,
      energiaComprada: 0.0
    },
    {
      date: '2024-03-02',
      energiaProduzida: 16.7,
      energiaConsumida: 18.9,
      energiaVendida: 0.0,
      energiaComprada: 2.2
    }
  ];

  return NextResponse.json({
    message: 'Dados de demonstração carregados com sucesso!',
    data: demoData,
    source: 'DEMO',
    note: 'Estes são dados simulados para demonstração do sistema'
  });
}

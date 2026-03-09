import { NextResponse } from 'next/server';

// Dados de teste para verificar se o fluxo está funcionando
const testData = [
  {
    date: '2024-03-08',
    energiaConsumida: 25.5,
    energiaComprada: 15.2,
    energiaVendida: 8.3,
    energiaGerada: 18.6
  },
  {
    date: '2024-03-07',
    energiaConsumida: 23.1,
    energiaComprada: 14.8,
    energiaVendida: 7.9,
    energiaGerada: 17.2
  },
  {
    date: '2024-03-06',
    energiaConsumida: 26.8,
    energiaComprada: 16.1,
    energiaVendida: 9.2,
    energiaGerada: 19.9
  }
];

export async function GET() {
  console.log('🧪 Endpoint de teste chamado');
  
  return NextResponse.json({
    message: 'Dados de teste retornados com sucesso',
    data: testData,
    debug: {
      source: 'test',
      timestamp: new Date().toISOString()
    }
  });
}

export async function POST() {
  console.log('🧪 Endpoint de teste POST chamado');
  
  return NextResponse.json({
    message: 'Dados de teste retornados com sucesso (POST)',
    data: testData,
    debug: {
      source: 'test',
      timestamp: new Date().toISOString()
    }
  });
}

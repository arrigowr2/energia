import { NextResponse } from 'next/server';

export async function POST() {
  const alternatives = {
    title: "Alternativas ao Processamento de E-mail",
    solutions: [
      {
        name: "API da Companhia Elétrica",
        description: "Muitas companhias têm APIs REST para consulta de dados",
        advantages: ["Dados em tempo real", "Mais confiável", "Sem dependência de e-mail"],
        how: "Verificar no portal da sua companhia por 'API' ou 'Integração'",
        examples: ["API da CPFL", "API da Eletropaulo", "API da Light"]
      },
      {
        name: "Upload de Arquivos",
        description: "Importar faturas em PDF ou CSV",
        advantages: ["Funciona com qualquer formato", "Offline", "Controle total"],
        how: "Usuário faz upload dos arquivos da fatura",
        examples: ["PDF da fatura", "Exportação Excel", "Arquivo CSV"]
      },
      {
        name: "Web Scraping",
        description: "Extrair dados diretamente do portal da companhia",
        advantages: ["Dados atualizados", "Automático", "Sem e-mail"],
        how: "Login no portal e extração dos dados",
        examples: ["Portal da CEMIG", "Área do cliente COELBA", "Neoenergia"]
      },
      {
        name: "Integração com Smart Meter",
        description: "Conectar diretamente ao medidor inteligente",
        advantages: ["Dados em tempo real", "Precisão máxima", "Sem intermediários"],
        how: "Protocolo Modbus, Zigbee ou WiFi do medidor",
        examples: ["Medidor Landis+Gyr", "GE Smart Meter", "Kamstrup"]
      }
    ],
    immediate: {
      title: "Solução Imediata",
      description: "Use o modo DEMO para ver o sistema funcionando",
      steps: [
        "1. Clique no botão verde 'Demo'",
        "2. Veja o dashboard com dados reais",
        "3. Teste todos os gráficos e funcionalidades",
        "4. Depois implemente uma das alternativas"
      ]
    }
  };

  return NextResponse.json(alternatives);
}

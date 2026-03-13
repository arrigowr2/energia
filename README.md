# Monitor de Energia

Sistema inteligente para monitoramento automático de dados energéticos através do processamento de e-mails de companhias elétricas.

## 🚀 Funcionalidades

- **Conexão Segura**: Suporte para múltiplos provedores de e-mail (Gmail, Outlook, Yahoo, iCloud)
- **Processamento Automático**: Extração automática de dados de e-mails diários
- **Dashboard Interativo**: Visualização completa com gráficos e estatísticas
- **Armazenamento Local**: Dados salvos localmente no navegador
- **Deploy Automático**: Sistema atualizado e funcionando em produção
- **Análise de Tendências**: Monitoramento de evolução temporal dos dados
- **Paginação Inteligente**: Carregamento eficiente de grandes volumes de e-mails

## 📊 Dados Monitorados

- Energia Produzida (kWh)
- Energia Consumida (kWh) 
- Energia Vendida (kWh)
- Energia Comprada (kWh)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilização**: TailwindCSS
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Processamento de E-mail**: IMAP (Node-imap)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta de e-mail com IMAP habilitado

## 🚀 Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd energia
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

## ⚙️ Configuração

### Habilitar IMAP no Gmail

1. Vá para [Configurações do Gmail](https://mail.google.com/mail/u/0/#settings/fwdandpop)
2. Aba "Encaminhamento e POP/IMAP"
3. Selecione "Habilitar IMAP"
4. Salve as alterações

### Habilitar App Password (Gmail)

1. Va para [Contas Google](https://myaccount.google.com/)
2. Segurança → Verificação em duas etapas
3. Senhas de aplicativos → Gerar nova senha
4. Use essa senha no aplicativo (não sua senha normal)

### Outros Provedores

- **Outlook/Hotmail**: IMAP geralmente já habilitado
- **Yahoo**: Requer senha de aplicativo
- **iCloud**: Requer senha de aplicativo

## 📧 Uso

1. **Configuração Inicial**
   - Selecione seu provedor de e-mail
   - Insira suas credenciais
   - Clique em "Conectar e Buscar Dados"

2. **Visualização dos Dados**
   - Dashboard com cards de resumo
   - Gráficos de evolução temporal
   - Comparação diária
   - Balanço energético
   - Tabela detalhada

3. **Análise Avançada**
   - Aba dedicada com insights inteligentes
   - Análise de tendências mensais
   - Comparação de eficiência energética
   - Projeções e padrões de consumo
   - Filtros por período específico

4. **Recursos**
   - Filtros por período (7 dias, 30 dias, todo)
   - Atualização manual dos dados
   - Reconfiguração de e-mail
   - Modo escuro/claro
   - Interface responsiva
   - Dados de teste integrados (1.500+ registros)
   - Exportação de relatórios

## 🧪 Testes e Dados

### Dados de Teste
O sistema inclui **1.500+ registros de teste** distribuídos entre 2023-2026 para:
- Testar todos os filtros e funcionalidades
- Validar renderização dos gráficos
- Demonstrar capacidades de análise
- Simular diferentes cenários de consumo

### Como Usar
1. **Sem configurar e-mail**: Clique em "Carregar Dados de Teste"
2. **Com e-mail configurado**: Dados reais + opção de teste
3. **Filtros**: Teste todos os períodos para validar
4. **Análise**: Explore insights e projeções

## 🆕 Atualizações Recentes

### Melhorias na Análise de Dados
- **Legendas Otimizadas**: Formato `mes/ano` para melhor legibilidade
- **Filtros Inteligentes**: Dropdown mostra apenas meses com dados disponíveis
- **Interface Limpa**: Remoção de mensagens desnecessárias
- **Botão Voltar**: Navegação facilitada quando não há dados
- **Gráficos Corrigidos**: Renderização correta mesmo com poucos dados
- **Tooltips Informativos**: Ícones de ajuda em cada gráfico
- **Modo Escuro**: Interface adaptável para diferentes ambientes

### Correções de Bugs
- **Tamanho dos Gráficos**: Corrigido erro de renderização
- **Filtros**: Funcionamento correto em todos os períodos
- **Formato de Datas**: Consistência em toda a aplicação

## 🔧 Configuração do Parser

O sistema inclui um parser genérico que procura por padrões comuns nos e-mails. Para ajustar ao formato específico da sua companhia elétrica, edite o arquivo:

`src/app/api/email/route.ts`

Na função `parseEmailContent()`, ajuste os regex patterns:

```typescript
const patterns = {
  produzida: /(?:energia\s+produzida|produzida)[:\s]+([\d.,]+)\s*kWh?/i,
  consumida: /(?:energia\s+consumida|consumida)[:\s]+([\d.,]+)\s*kWh?/i,
  vendida: /(?:energia\s+vendida|vendida|exportada)[:\s]+([\d.,]+)\s*kWh?/i,
  comprada: /(?:energia\s+comprada|comprada|importada)[:\s]+([\d.,]+)\s*kWh?/i
};
```

## 🔒 Segurança

- As credenciais de e-mail são usadas apenas localmente
- Não há armazenamento em servidores externos
- Dados salvos apenas no localStorage do navegador
- Conexão criptografada via TLS/SSL

## 📱 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── email/           # API para processamento de e-mails
│   │   └── email-providers/ # Lista de provedores suportados
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página inicial
├── components/
│   ├── EmailConfig.tsx      # Formulário de configuração
│   └── EnergyDashboard.tsx  # Dashboard com gráficos
└── globals.css              # Estilos globais
```

## 🚀 Build para Produção

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão IMAP**
   - Verifique se o IMAP está habilitado
   - Use senha de aplicativo (Gmail/Yahoo)
   - Confirme servidor e porta

2. **Nenhum dado encontrado**
   - Verifique os critérios de busca no parser
   - Ajuste os patterns regex
   - Confirme que os e-mails estão na caixa de entrada

3. **Gráficos não aparecem**
   - Verifique se há dados válidos
   - Confirme formatação dos dados extraídos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT.

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Verifique o troubleshooting acima
- Confirme a configuração do seu provedor de e-mail

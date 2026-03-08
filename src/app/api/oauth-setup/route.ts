import { NextResponse } from 'next/server';

export async function POST() {
  const oauthSetup = {
    title: "Configuração OAuth2 para Gmail/Outlook",
    description: "Login via navegador como apps normais",
    
    gmail: {
      name: "Gmail OAuth2",
      steps: [
        "1. Ir para Google Cloud Console",
        "2. Criar novo projeto",
        "3. Ativar Gmail API",
        "4. Criar credenciais OAuth2",
        "5. Configurar redirect URI",
        "6. Usar NextAuth.js no frontend"
      ],
      code: `
// Instalar: npm install next-auth
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: 'https://www.googleapis.com/auth/gmail.readonly'
    })
  ]
})
      `,
      advantages: ["Login normal", "Seguro", "Funciona com 2FA"]
    },

    outlook: {
      name: "Microsoft OAuth2", 
      steps: [
        "1. Ir para Azure Portal",
        "2. Registrar novo app",
        "3. Adicionar permissão Mail.Read",
        "4. Configurar redirect URI",
        "5. Usar NextAuth.js"
      ],
      code: `
import MicrosoftProvider from 'next-auth/providers/azure-ad'

MicrosoftProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  authorization: {
    params: {
      scope: 'https://graph.microsoft.com/Mail.Read'
    }
  }
})
      `,
      advantages: ["Login corporativo", "Seguro", "Padrão Microsoft"]
    },

    implementation: {
      title: "Como Implementar",
      overview: "Usar NextAuth.js simplifica todo o processo",
      benefits: [
        "Login com popup/botão",
        "Gerenciamento de tokens automático",
        "Refresh automático",
        "Seguro por padrão"
      ],
      time: "2-3 dias para implementação completa"
    }
  };

  return NextResponse.json(oauthSetup);
}

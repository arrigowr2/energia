import { NextResponse } from 'next/server';

export interface EmailProvider {
  name: string;
  host: string;
  port: number;
  tls: boolean;
  icon: string;
}

export async function GET() {
  const providers: EmailProvider[] = [
    {
      name: 'Gmail',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      icon: '📧'
    },
    {
      name: 'Outlook/Hotmail',
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
      icon: '🔷'
    },
    {
      name: 'Office 365',
      host: 'outlook.office365.com',
      port: 993,
      tls: true,
      icon: '🏢'
    },
    {
      name: 'Outlook (Port 143)',
      host: 'outlook.office365.com',
      port: 143,
      tls: false,
      icon: '📪'
    },
    {
      name: 'Outlook (Alt)',
      host: 'imap-mail.outlook.com',
      port: 993,
      tls: true,
      icon: '🌐'
    },
    {
      name: 'Live.com',
      host: 'imap-mail.outlook.com',
      port: 993,
      tls: true,
      icon: '📮'
    },
    {
      name: 'Yahoo',
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
      icon: '🟣'
    },
    {
      name: 'iCloud',
      host: 'imap.mail.me.com',
      port: 993,
      tls: true,
      icon: '☁️'
    },
    {
      name: 'Custom',
      host: '',
      port: 993,
      tls: true,
      icon: '⚙️'
    }
  ];

  return NextResponse.json(providers);
}

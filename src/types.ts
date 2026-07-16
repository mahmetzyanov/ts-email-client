export interface EmailConfig {
  protocol: 'IMAP' | 'POP3';
  host: string;
  port: number;
  secure: boolean;
  email: string;
  password: string;
}

export interface EmailMeta {
  id: string;
  sender: string;
  subject: string;
  date: string;
  flags: string[];
  snippet?: string;
}

export interface EmailBody {
  html: string;
  subject: string;
  sender: string;
  recipient?: string;
  date: string;
}

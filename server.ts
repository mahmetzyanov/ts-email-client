import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import POP3Client from "node-pop3";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API ROUTES

  app.post("/api/emails", async (req, res) => {
    try {
      const config = req.body;
      let emails = [];
      if (config.protocol === "IMAP") {
        emails = await getImapEmails(config);
      } else {
        emails = await getPop3Emails(config);
      }
      res.json(emails);
    } catch (error: any) {
      
      let message = error.message;
      if (error.authenticationFailed || message?.includes('AUTHENTICATIONFAILED') || message?.includes('Invalid credentials') || message?.includes('Auth failed') || message?.includes('Command failed')) {
         message = "Authentication failed. Please ensure you are using an App Password (not your regular password) and the correct email address.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/emails/:id", async (req, res) => {
    try {
      const config = req.body;
      const { id } = req.params;
      let email;
      if (config.protocol === "IMAP") {
        email = await getImapEmailBody(config, id);
      } else {
        email = await getPop3EmailBody(config, id);
      }
      res.json({
        html: email.html || email.textAsHtml || email.text,
        subject: email.subject,
        sender: email.from?.text,
        recipient: email.to?.text,
        date: email.date
      });
    } catch (error: any) {
      
      let message = error.message;
      if (error.authenticationFailed || message?.includes('AUTHENTICATIONFAILED') || message?.includes('Invalid credentials') || message?.includes('Auth failed') || message?.includes('Command failed')) {
         message = "Authentication failed. Please ensure you are using an App Password (not your regular password) and the correct email address.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const config = req.body;
      const { id } = req.params;
      if (config.protocol === "IMAP") {
        await deleteImapEmail(config, id);
      } else {
        await deletePop3Email(config, id);
      }
      res.json({ success: true });
    } catch (error: any) {
      
      let message = error.message;
      if (error.authenticationFailed || message?.includes('AUTHENTICATIONFAILED') || message?.includes('Invalid credentials') || message?.includes('Auth failed') || message?.includes('Command failed')) {
         message = "Authentication failed. Please ensure you are using an App Password (not your regular password) and the correct email address.";
      }
      res.status(500).json({ error: message });
    }
  });


  // IMAP Logic
  async function getImapEmails(config: any) {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.email,
        pass: config.password,
      },
      logger: false,
    });
    client.on("error", () => {});


    await client.connect();
    const emails = [];
    
    let lock = await client.getMailboxLock("INBOX");
    try {
      const count = client.mailbox && typeof client.mailbox !== 'boolean' ? client.mailbox.exists : 0;
      if (count > 0) {
        const start = Math.max(1, count - 9);
        for await (let msg of client.fetch(`${start}:*`, { envelope: true, uid: true, flags: true, source: { start: 0, maxLength: 2048 } })) {
          let snippet = "";
          if (msg.source) {
            try {
              const parsed = await simpleParser(msg.source);
              if (parsed.text) snippet = parsed.text.substring(0, 150).replace(/\s+/g, ' ').trim();
            } catch(e) {}
          }
          emails.push({
            id: msg.uid.toString(),
            sender: msg.envelope.from?.map((f: any) => f.address).join(", ") || "Unknown",
            subject: msg.envelope.subject,
            date: msg.envelope.date,
            flags: Array.from(msg.flags || []),
            snippet
          });
        }
      }
    } finally {
      lock.release();
    }
    
    await client.logout();
    return emails.reverse();
  }

  async function getImapEmailBody(config: any, uid: string) {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.email,
        pass: config.password,
      },
      logger: false,
    });
    client.on("error", () => {});


    await client.connect();
    
    let lock = await client.getMailboxLock("INBOX");
    let parsedEmail: any;
    try {
      let msg = await client.fetchOne(uid, { source: true }, { uid: true });
      if (msg) {
        parsedEmail = await simpleParser(msg.source);
      }
    } finally {
      lock.release();
    }
    
    await client.logout();
    return parsedEmail;
  }

  async function deleteImapEmail(config: any, uid: string) {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.email,
        pass: config.password,
      },
      logger: false,
    });
    client.on("error", () => {});


    await client.connect();
    
    let lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageDelete(uid, {uid: true});
    } finally {
      lock.release();
    }
    
    await client.logout();
  }

  // POP3 Logic
  async function getPop3Emails(config: any) {
    const client = new POP3Client({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
    });
    
    let listResponse: any = [];
    try {
        listResponse = await client.UIDL();
    } catch(e) {
        listResponse = [];
    }
    
    const count = listResponse.length;
    
    const emails = [];
    if (count > 0) {
      const start = Math.max(1, count - 9);
      for (let i = start; i <= count; i++) {
        try {
          const msgInfo = listResponse[i - 1]; // UIDL array is 0-indexed, msgNum is 1-indexed
          const msgNum = parseInt(msgInfo ? msgInfo[0] : i.toString(), 10);
          const raw = await client.RETR(msgNum);
          const parsed = await simpleParser(raw);
          let snippet = "";
          if (parsed.text) snippet = parsed.text.substring(0, 150).replace(/\s+/g, ' ').trim();
          emails.push({
            id: msgNum.toString(),
            sender: parsed.from?.text || "Unknown",
            subject: parsed.subject || "No Subject",
            date: parsed.date || new Date(),
            flags: [],
            snippet
          });
        } catch (e) {
          
        }
      }
    }
    
    await client.QUIT();
    return emails.reverse();
  }

  async function getPop3EmailBody(config: any, id: string) {
    const client = new POP3Client({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
    });
    const raw = await client.RETR(parseInt(id, 10));
    const parsed = await simpleParser(raw);
    await client.QUIT();
    return parsed;
  }

  async function deletePop3Email(config: any, id: string) {
    const client = new POP3Client({
      user: config.email,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
    });
    
    await client.DELE(parseInt(id, 10));
    await client.QUIT();
  }


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 5.x, use `*all` instead of `*`
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

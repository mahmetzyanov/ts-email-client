const { simpleParser } = require('mailparser');
const raw = `From: test@example.com
To: user@example.com
Subject: Hello
Content-Type: text/plain

This is a test message that is long.
EOF`;

async function run() {
  const parsed = await simpleParser(raw);
  console.log("TEXT:", parsed.text);
}
run();

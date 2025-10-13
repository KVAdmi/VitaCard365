// Inject GMS_API_KEY from env into Info.plist if provided. No-op if missing.
const fs = require('fs');
const path = require('path');

const apiKey = process.env.GMS_API_KEY || process.env.IOS_GMS_API_KEY;
if (!apiKey) {
  console.log('[ios-set-gms-key] No GMS_API_KEY env provided, skipping.');
  process.exit(0);
}

const plistPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');
let xml = fs.readFileSync(plistPath, 'utf8');

if (xml.includes('<key>GMSApiKey</key>')) {
  xml = xml.replace(/<key>GMSApiKey<\/key>\s*<string>[^<]*<\/string>/, `<key>GMSApiKey<\/key>\n    <string>${apiKey}<\/string>`);
  fs.writeFileSync(plistPath, xml);
  console.log('[ios-set-gms-key] Updated GMSApiKey in Info.plist');
} else {
  console.log('[ios-set-gms-key] GMSApiKey key not found in Info.plist, skipping.');
}

const fs = require('fs');
const https = require('https');

// Read the sitemap file
let sitemap;
try {
  sitemap = fs.readFileSync('src/sitemap.xml', 'utf8');
} catch (e) {
  console.error('Could not read src/sitemap.xml', e);
  process.exit(1);
}

// Extract URLs from <loc> tags
const urls = [];
const regex = /<loc>(.*?)<\/loc>/g;
let match;
while ((match = regex.exec(sitemap)) !== null) {
  urls.push(match[1]);
}

if (urls.length === 0) {
  console.log('No URLs found in sitemap.');
  process.exit(0);
}

// Prepare the payload for IndexNow
const data = JSON.stringify({
  host: 'www.phcalculators.com',
  key: '8f82a9d2b28c467a9159048a97b2d56a',
  keyLocation: 'https://www.phcalculators.com/8f82a9d2b28c467a9159048a97b2d56a.txt',
  urlList: urls
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log(`Submitting ${urls.length} URLs to IndexNow...`);

const req = https.request(options, (res) => {
  console.log(`IndexNow Response Status: ${res.statusCode}`);
  let resData = '';
  res.on('data', (chunk) => {
    resData += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('Successfully submitted URLs to IndexNow.');
    } else {
      console.log('IndexNow responded with an error:', resData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error pinging IndexNow:', error);
  process.exit(1);
});

req.write(data);
req.end();

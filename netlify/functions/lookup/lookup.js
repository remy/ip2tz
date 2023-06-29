/* eslint-env node */
const geoLookup = require('maxmind');
const fs = require('fs');

async function open() {
  return new Promise((resolve, reject) => {
    geoLookup.open('./data/GeoLite2-City.mmdb', (err, lookup) => {
      console.log({
        cwd: process.cwd(),
        dir: __dirname,
        list: JSON.stringify(fs.readdirSync(process.cwd())),
      });

      if (err) reject(err);
      else resolve(lookup);
    });
  });
}

const db = open();

const handler = (req) => {
  return db
    .then((lookup) => {
      let ip =
        req.queryStringParameters.ip ||
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress;

      if (
        ip === '::1' ||
        ip === '::ffff:127.0.0.1' ||
        ip === '::ffff:127.0.0.1'
      ) {
        ip = '0.0.0.0';
      }

      if (ip === '0.0.0.0' || process.env.TEST) {
        ip = '86.13.179.215';
      }

      if (ip.includes(',')) {
        [ip] = ip.split(',');
      }

      const data = lookup.get(ip);

      try {
        return {
          statusCode: 200,
          body: JSON.stringify({ ...data.location, ip }),
        };
      } catch (e) {
        return { statusCode: 500, body: e.message };
      }
    })
    .catch((e) => {
      return { statusCode: 500, body: e.message };
    });
};

// module.exports = cors(handler);

module.exports = { handler };

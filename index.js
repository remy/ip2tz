/* eslint-env node */
const cors = require('micro-cors')();
const query = require('micro-query');
const { send } = require('micro');
const geoLookup = require('maxmind');

async function open() {
  return new Promise((resolve, reject) => {
    geoLookup.open('./data/GeoLite2-City.mmdb', (err, lookup) =>
      resolve(lookup)
    );
  });
}

const db = open();

const handler = (req, res) => {
  db.then(lookup => {
    let ip =
      query(req).ip ||
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress;

    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '0.0.0.0';
    }

    if (ip === '0.0.0.0' || process.env.TEST) {
      ip = '86.13.179.215';
    }

    if (ip.includes(',')) {
      [ip] = ip.split(',');
    }

    const start = process.hrtime();

    const data = lookup.get(ip);

    const end = process.hrtime(start);
    const delta = (end[0] * 1e9 + end[1]) / 1e6;

    const timings = `Lookup;dur=${delta}`;

    res.setHeader('Server-Timing', timings);

    try {
      send(res, 200, { ...data.location, ip });
    } catch (e) {
      send(res, 500, { error: e.message });
    }
  });
};

module.exports = cors(handler);

const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const { auth, requiresAuth } = require('express-openid-connect');
const app = express();
const PORT = 3000;
require('dotenv').config();

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ORlabDB',
  password: 'admin',
  port: 5432,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Auth0 middleware
app.use(auth(config));

// Middleware to wrap responses
app.use((req, res, next) => {
  const ignoredPaths = ['/', '/dataset', '/punionice.json', '/punionice.csv', '/data', '/profile', '/refresh'];
  if (!ignoredPaths.includes(req.path)) {
    res.wrap = (status, message, data = null) => {
      res.status(status).json({
        status: status === 200 ? 'OK' : 'Error',
        message,
        response: data,
      });
    };
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

// Middleware to handle unsupported HTTP methods
app.use((req, res, next) => {
  res.methodNotAllowed = () => {
    res.wrap(501, 'Method not implemented for requested resource');
  };
  next();
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route to get data from the database with optional search and column filtering
app.get('/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM punionica JOIN stanicazapunjenje ON punionica.id_punionice = stanicazapunjenje.id_punionice');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.wrap(500, 'Server Error');
  }
});

// Route to serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Route to serve the dataset page
app.get('/dataset', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'datatable.html'));
});

// Route to download JSON file
app.get('/punionice.json', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="punionice.json"');
  res.sendFile(path.join(__dirname, 'punionice.json'));
});

// Route to download CSV file
app.get('/punionice.csv', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="punionice.csv"');
  res.sendFile(path.join(__dirname, 'punionice.csv'));
});

// Route to handle login
app.get('/login', (req, res) => {
  res.oidc.login({ returnTo: '/' });
});

// Route to handle logout
app.get('/logout', (req, res) => {
  res.oidc.logout({ returnTo: '/' });
});

// Route to handle Auth0 callback
app.get('/callback', (req, res) => {
  res.oidc.callback({ redirectUri: '/' });
});

// Route to serve the profile page
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(`<h1>Profile</h1><pre>${JSON.stringify(req.oidc.user, null, 2)}</pre>`);
});

// Route to refresh data
app.get('/refresh', requiresAuth(), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM punionica JOIN stanicazapunjenje ON punionica.id_punionice = stanicazapunjenje.id_punionice');
    const jsonData = JSON.stringify(result.rows);
    const csvData = result.rows.map(row => Object.values(row).join(',')).join('\n');
    require('fs').writeFileSync('punionice.json', jsonData);
    require('fs').writeFileSync('punionice.csv', csvData);
    res.send('Data refreshed');
    console.log("Data refreshed " + result.rows.length);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Helper function to add hypermedia links to a station object
function addLinksToStation(station) {
  return {
    ...station,
    links: [
      {
        href: `/stations/${station.id_punionice}`,
        rel: 'self',
        type: 'GET',
      },
      {
        href: `/stations/${station.id_punionice}`,
        rel: 'update',
        type: 'PUT',
      },
      {
        href: `/stations/${station.id_punionice}`,
        rel: 'delete',
        type: 'DELETE',
      },
    ],
  };
}

// Helper function to parse address
function parseAddress(address) {
  const [streetAddress, postalCode, addressLocality] = address.split(',').map(part => part.trim());
  let addressRegion = "";
  if (address.includes("Zagreb")) {
    addressRegion = "Zagreb";
  } else if (address.includes("Osijek")) {
    addressRegion = "Osijek";
  }
  const addressCountry = "Croatia"; // Assuming the country is Croatia for all addresses
  return { streetAddress, postalCode, addressLocality, addressRegion, addressCountry };
}

// Get all charging stations
app.get('/stations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
    `);

    const stations = result.rows.reduce((acc, row) => {
      const {
        id_punionice,
        naziv_punionice,
        adresa,
        geografska_sirina,
        geografska_duzina,
        vrsta_punjenja,
        broj_punjaca,
        snaga_punjenja,
        cijena_po_kwh,
        otvorenje,
        zatvaranje,
        id_stanice,
        tip_konektora,
        snaga_stanice,
        pruzatelj
      } = row;

      const { streetAddress, postalCode, addressLocality, addressRegion, addressCountry } = parseAddress(adresa);

      if (!acc[id_punionice]) {
        acc[id_punionice] = {
          "@context": "https://schema.org",
          "@type": "Place",
          "name": naziv_punionice,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": streetAddress,
            "addressLocality": addressLocality,
            "addressRegion": addressRegion,
            "postalCode": postalCode,
            "addressCountry": addressCountry
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": geografska_sirina,
            "longitude": geografska_duzina
          },
          "chargingStation": {
            "@type": "ElectricVehicleChargingStation",
            "name": naziv_punionice,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": streetAddress,
              "addressLocality": addressLocality,
              "addressRegion": addressRegion,
              "postalCode": postalCode,
              "addressCountry": addressCountry
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": geografska_sirina,
              "longitude": geografska_duzina
            },
            "numberOfChargingPoints": broj_punjaca,
            "chargingPointCapacity": snaga_punjenja,
            "pricePerKWh": cijena_po_kwh,
            "openingHours": otvorenje,
            "closingHours": zatvaranje,
            "stanicazapunjenje": [] // Initialize the array here
          }
        };
      }

      if (id_stanice) {
        acc[id_punionice].chargingStation.stanicazapunjenje.push({
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        });
      }

      return acc;
    }, {});

    const stationsArray = Object.values(stations).map(addLinksToStation);

    res.wrap(200, 'List of all charging stations', stationsArray);
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Get a charging station by ID
app.get('/stations/:id_punionice', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
      WHERE p.id_punionice = $1
    `, [parseInt(req.params.id_punionice)]);

    if (result.rows.length > 0) {
      const station = result.rows.reduce((acc, row) => {
        const {
          id_punionice,
          naziv_punionice,
          adresa,
          geografska_sirina,
          geografska_duzina,
          vrsta_punjenja,
          broj_punjaca,
          snaga_punjenja,
          cijena_po_kwh,
          otvorenje,
          zatvaranje,
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        } = row;

        const { streetAddress, postalCode, addressLocality, addressRegion, addressCountry } = parseAddress(adresa);

        if (!acc) {
          acc = {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": naziv_punionice,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": streetAddress,
              "addressLocality": addressLocality,
              "addressRegion": addressRegion,
              "postalCode": postalCode,
              "addressCountry": addressCountry
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": geografska_sirina,
              "longitude": geografska_duzina
            },
            "chargingStation": {
              "@type": "ElectricVehicleChargingStation",
              "name": naziv_punionice,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": streetAddress,
                "addressLocality": addressLocality,
                "addressRegion": addressRegion,
                "postalCode": postalCode,
                "addressCountry": addressCountry
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": geografska_sirina,
                "longitude": geografska_duzina
              },
              "numberOfChargingPoints": broj_punjaca,
              "chargingPointCapacity": snaga_punjenja,
              "pricePerKWh": cijena_po_kwh,
              "openingHours": otvorenje,
              "closingHours": zatvaranje,
              "stanicazapunjenje": []
            }
          };
        }

        if (id_stanice) {
          acc.chargingStation.stanicazapunjenje.push({
            id_stanice,
            tip_konektora,
            snaga_stanice,
            pruzatelj
          });
        }

        return acc;
      }, null);

      const stationWithLinks = addLinksToStation(station);

      res.wrap(200, 'Station found', stationWithLinks);
    } else {
      res.wrap(404, 'Station not found');
    }
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Get a charging station by ID
app.get('/stations/:id_punionice', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
      WHERE p.id_punionice = $1
    `, [parseInt(req.params.id_punionice)]);

    if (result.rows.length > 0) {
      const station = result.rows.reduce((acc, row) => {
        const {
          id_punionice,
          naziv_punionice,
          adresa,
          geografska_sirina,
          geografska_duzina,
          vrsta_punjenja,
          broj_punjaca,
          snaga_punjenja,
          cijena_po_kwh,
          otvorenje,
          zatvaranje,
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        } = row;

        const { streetAddress, postalCode, addressLocality, addressRegion, addressCountry } = parseAddress(adresa);

        if (!acc) {
          acc = {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": naziv_punionice,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": streetAddress,
              "addressLocality": addressLocality,
              "addressRegion": addressRegion,
              "postalCode": postalCode,
              "addressCountry": addressCountry
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": geografska_sirina,
              "longitude": geografska_duzina
            },
            "chargingStation": {
              "@type": "ElectricVehicleChargingStation",
              "name": naziv_punionice,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": streetAddress,
                "addressLocality": addressLocality,
                "addressRegion": addressRegion,
                "postalCode": postalCode,
                "addressCountry": addressCountry
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": geografska_sirina,
                "longitude": geografska_duzina
              },
              "numberOfChargingPoints": broj_punjaca,
              "chargingPointCapacity": snaga_punjenja,
              "pricePerKWh": cijena_po_kwh,
              "openingHours": otvorenje,
              "closingHours": zatvaranje,
              "stanicazapunjenje": []
            }
          };
        }

        if (id_stanice) {
          acc.chargingStation.stanicazapunjenje.push({
            id_stanice,
            tip_konektora,
            snaga_stanice,
            pruzatelj
          });
        }

        return acc;
      }, null);

      const stationWithLinks = addLinksToStation(station);

      res.wrap(200, 'Station found', stationWithLinks);
    } else {
      res.wrap(404, 'Station not found');
    }
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Add a new charging station
app.post('/stations', async (req, res) => {
  const {
    naziv_punionice,
    adresa,
    geografska_sirina,
    geografska_duzina,
    vrsta_punjenja,
    broj_punjaca,
    snaga_punjenja,
    cijena_po_kwh,
    otvorenje,
    zatvaranje,
    stanicazapunjenje // This should be an array of objects
  } = req.body;
  try {
    await pool.query('BEGIN');
    
    const punionicaResult = await pool.query(
      'INSERT INTO punionica (naziv_punionice, adresa, geografska_sirina, geografska_duzina, vrsta_punjenja, broj_punjaca, snaga_punjenja, cijena_po_kwh, otvorenje, zatvaranje) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_punionice',
      [
        naziv_punionice,
        adresa,
        geografska_sirina,
        geografska_duzina,
        vrsta_punjenja,
        broj_punjaca,
        snaga_punjenja,
        cijena_po_kwh,
        otvorenje,
        zatvaranje
      ]
    );

    const id_punionice = punionicaResult.rows[0].id_punionice;

    // Insert new stanicazapunjenje entries
    for (const stanica of stanicazapunjenje) {
      await pool.query(
        'INSERT INTO stanicazapunjenje (id_punionice, tip_konektora, snaga_stanice, pruzatelj) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          id_punionice,
          stanica.tip_konektora,
          stanica.snaga_stanice,
          stanica.pruzatelj
        ]
      );
    }

    await pool.query('COMMIT');

    // Fetch the newly added station with its stanicazapunjenje
    const newStationResult = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
      WHERE p.id_punionice = $1
    `, [id_punionice]);

    const newStation = newStationResult.rows.reduce((acc, row) => {
      const {
        id_punionice,
        naziv_punionice,
        adresa,
        geografska_sirina,
        geografska_duzina,
        vrsta_punjenja,
        broj_punjaca,
        snaga_punjenja,
        cijena_po_kwh,
        otvorenje,
        zatvaranje,
        id_stanice,
        tip_konektora,
        snaga_stanice,
        pruzatelj
      } = row;

      if (!acc) {
        acc = {
          id_punionice,
          naziv_punionice,
          adresa,
          geografska_sirina,
          geografska_duzina,
          vrsta_punjenja,
          broj_punjaca,
          snaga_punjenja,
          cijena_po_kwh,
          otvorenje,
          zatvaranje,
          stanicazapunjenje: []
        };
      }

      if (id_stanice) {
        acc.stanicazapunjenje.push({
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        });
      }

      return acc;
    }, null);

    const stationWithLinks = addLinksToStation(newStation);

    res.wrap(200, 'Station added successfully', stationWithLinks);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.wrap(500, err.message);
  }
});

// Get a charging station by ID
app.get('/stations/:id_punionice', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
      WHERE p.id_punionice = $1
    `, [parseInt(req.params.id_punionice)]);

    if (result.rows.length > 0) {
      const station = result.rows.reduce((acc, row) => {
        const {
          id_punionice,
          naziv_punionice,
          adresa,
          geografska_sirina,
          geografska_duzina,
          vrsta_punjenja,
          broj_punjaca,
          snaga_punjenja,
          cijena_po_kwh,
          otvorenje,
          zatvaranje,
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        } = row;

        if (!acc) {
          acc = {
            "@context": "https://schema.org",
            "@type": "Place",
            "name": naziv_punionice,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": adresa,
              "addressLocality": "Grad",
              "addressRegion": "Regija",
              "postalCode": "Poštanski broj",
              "addressCountry": "Država"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": geografska_sirina,
              "longitude": geografska_duzina
            },
            "additionalType": "https://schema.org/ElectricVehicleChargingStation",
            "chargingStation": {
              "@type": "ElectricVehicleChargingStation",
              "name": naziv_punionice,
              "address": {
                "@type": "PostalAddress",
                "streetAddress": adresa,
                "addressLocality": "Grad",
                "addressRegion": "Regija",
                "postalCode": "Poštanski broj",
                "addressCountry": "Država"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": geografska_sirina,
                "longitude": geografska_duzina
              },
              "numberOfChargingPoints": broj_punjaca,
              "chargingPointCapacity": snaga_punjenja,
              "pricePerKWh": cijena_po_kwh,
              "openingHours": otvorenje,
              "closingHours": zatvaranje,
              "stanicazapunjenje": []
            }
          };
        }

        if (id_stanice) {
          acc.chargingStation.stanicazapunjenje.push({
            id_stanice,
            tip_konektora,
            snaga_stanice,
            pruzatelj
          });
        }

        return acc;
      }, null);

      const stationWithLinks = addLinksToStation(station);

      res.wrap(200, 'Station found', stationWithLinks);
    } else {
      res.wrap(404, 'Station not found');
    }
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Update a charging station by ID
app.put('/stations/:id_punionice', async (req, res) => {
  const {
    naziv_punionice,
    adresa,
    geografska_sirina,
    geografska_duzina,
    vrsta_punjenja,
    broj_punjaca,
    snaga_punjenja,
    cijena_po_kwh,
    otvorenje,
    zatvaranje,
    stanicazapunjenje // This should be an array of objects
  } = req.body;
  const { id_punionice } = req.params;
  try {
    await pool.query('BEGIN');

    const punionicaResult = await pool.query(
      'UPDATE punionica SET naziv_punionice = $1, adresa = $2, geografska_sirina = $3, geografska_duzina = $4, vrsta_punjenja = $5, broj_punjaca = $6, snaga_punjenja = $7, cijena_po_kwh = $8, otvorenje = $9, zatvaranje = $10 WHERE id_punionice = $11 RETURNING *',
      [
        naziv_punionice,
        adresa,
        geografska_sirina,
        geografska_duzina,
        vrsta_punjenja,
        broj_punjaca,
        snaga_punjenja,
        cijena_po_kwh,
        otvorenje,
        zatvaranje,
        id_punionice
      ]
    );

    // Delete existing stanicazapunjenje entries for the station
    await pool.query(
      'DELETE FROM stanicazapunjenje WHERE id_punionice = $1',
      [id_punionice]
    );

    // Insert new stanicazapunjenje entries
    for (const stanica of stanicazapunjenje) {
      await pool.query(
        'INSERT INTO stanicazapunjenje (id_punionice, tip_konektora, snaga_stanice, pruzatelj) VALUES ($1, $2, $3, $4)',
        [
          id_punionice,
          stanica.tip_konektora,
          stanica.snaga_stanice,
          stanica.pruzatelj
        ]
      );
    }

    await pool.query('COMMIT');

    // Fetch the updated station with its stanicazapunjenje
    const updatedStationResult = await pool.query(`
      SELECT 
        p.id_punionice, 
        p.naziv_punionice, 
        p.adresa, 
        p.geografska_sirina, 
        p.geografska_duzina, 
        p.vrsta_punjenja, 
        p.broj_punjaca, 
        p.snaga_punjenja, 
        p.cijena_po_kwh, 
        p.otvorenje, 
        p.zatvaranje,
        s.id_stanice,
        s.tip_konektora,
        s.snaga_stanice,
        s.pruzatelj
      FROM punionica p
      LEFT JOIN stanicazapunjenje s ON p.id_punionice = s.id_punionice
      WHERE p.id_punionice = $1
    `, [id_punionice]);

    const updatedStation = updatedStationResult.rows.reduce((acc, row) => {
      const {
        id_punionice,
        naziv_punionice,
        adresa,
        geografska_sirina,
        geografska_duzina,
        vrsta_punjenja,
        broj_punjaca,
        snaga_punjenja,
        cijena_po_kwh,
        otvorenje,
        zatvaranje,
        id_stanice,
        tip_konektora,
        snaga_stanice,
        pruzatelj
      } = row;

      if (!acc) {
        acc = {
          id_punionice,
          naziv_punionice,
          adresa,
          geografska_sirina,
          geografska_duzina,
          vrsta_punjenja,
          broj_punjaca,
          snaga_punjenja,
          cijena_po_kwh,
          otvorenje,
          zatvaranje,
          stanicazapunjenje: []
        };
      }

      if (id_stanice) {
        acc.stanicazapunjenje.push({
          id_stanice,
          tip_konektora,
          snaga_stanice,
          pruzatelj
        });
      }

      return acc;
    }, null);

    const stationWithLinks = addLinksToStation(updatedStation);

    res.wrap(200, 'Station updated successfully', stationWithLinks);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.wrap(500, err.message);
  }
});

// Delete a charging station by ID
app.delete('/stations/:id_punionice', async (req, res) => {
  const { id_punionice } = req.params;
  try {
    await pool.query('BEGIN');

    const stanicazapunjenjeResult = await pool.query(
      'DELETE FROM stanicazapunjenje WHERE id_punionice = $1 RETURNING *',
      [parseInt(id_punionice)]
    );

    const punionicaResult = await pool.query(
      'DELETE FROM punionica WHERE id_punionice = $1 RETURNING *',
      [parseInt(id_punionice)]
    );

    await pool.query('COMMIT');

    if (punionicaResult.rows.length > 0) {
      res.wrap(200, 'Station deleted successfully', {
        links: [
          {
            href: '/stations',
            rel: 'list',
            type: 'GET',
          },
        ],
      });
    } else {
      res.wrap(404, "Station with the provided ID doesn't exist");
    }
  } catch (err) {
    await pool.query('ROLLBACK');
    res.wrap(500, err.message);
  }
});

// Get stations by provider
app.get('/stations/provider/:provider', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stanicazapunjenje WHERE pruzatelj = $1', [req.params.provider]);
    const stations = result.rows.map(addLinksToStation);
    res.wrap(200, `List of stations for provider ${req.params.provider}`, stations);
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Get stations by connector type
app.get('/stations/connector/:connector', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stanicazapunjenje WHERE tip_konektora = $1', [req.params.connector]);
    const stations = result.rows.map(addLinksToStation);
    res.wrap(200, `List of stations for connector type ${req.params.connector}`, stations);
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Get stations by minimum power
app.get('/stations/power/:power', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stanicazapunjenje WHERE snaga_stanice >= $1', [parseInt(req.params.power)]);
    const stations = result.rows.map(addLinksToStation);
    res.wrap(200, `List of stations with power above ${req.params.power}`, stations);
  } catch (err) {
    res.wrap(500, err.message);
  }
});

// Handle unsupported HTTP methods
app.all('/stations/:id_punionice', (req, res) => {
  res.methodNotAllowed();
});

// Handle non-existent endpoints
app.use((req, res) => {
  res.wrap(404, "Unimplemented endpoint");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
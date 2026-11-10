import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'rekonda_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper to load db
  const loadDatabase = () => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file:', err);
    }
    return null;
  };

  // Helper to save db
  const saveDatabase = (data: any) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error saving database file:', err);
      return false;
    }
  };

  // API Routes
  app.get('/api/data', (_req: Request, res: Response) => {
    const data = loadDatabase();
    res.json({ success: true, data });
  });

  app.post('/api/save-all', (req: Request, res: Response) => {
    const { database } = req.body;
    if (!database) {
      return res.status(400).json({ success: false, error: 'Database payload is required' });
    }
    const saved = saveDatabase(database);
    res.json({ success: saved });
  });

  app.post('/api/kabupaten/update', (req: Request, res: Response) => {
    const { key, kabupaten } = req.body;
    if (!key || !kabupaten) {
      return res.status(400).json({ success: false, error: 'Key and kabupaten required' });
    }
    const currentDb = loadDatabase() || {};
    const list = currentDb[key] || [];
    const index = list.findIndex((item: any) => item.id === kabupaten.id || item.kode === kabupaten.kode);
    if (index >= 0) {
      list[index] = kabupaten;
    } else {
      list.push(kabupaten);
    }
    currentDb[key] = list;
    saveDatabase(currentDb);
    res.json({ success: true, data: kabupaten });
  });

  app.post('/api/anomali/update', (req: Request, res: Response) => {
    const { key, kabupatenId, statusRekon, aksiRekon, catatan } = req.body;
    const currentDb = loadDatabase() || {};
    const list = currentDb[key] || [];
    const target = list.find((item: any) => item.id === kabupatenId || item.kode === kabupatenId);
    if (target) {
      if (statusRekon) target.statusRekon = statusRekon;
      if (aksiRekon !== undefined) target.aksiRekon = aksiRekon;
      if (catatan !== undefined) target.catatan = catatan;
      saveDatabase(currentDb);
      return res.json({ success: true, target });
    }
    res.status(404).json({ success: false, error: 'Kabupaten not found' });
  });

  // Export Notes / Anomali as CSV
  app.get('/api/export/catatan-csv', (req: Request, res: Response) => {
    const currentDb = loadDatabase() || {};
    const key = (req.query.key as string) || '61_0102';
    const list = currentDb[key] || [];

    let csvContent = 'Kode Kab,Kabupaten,Harga 2027,Harga 2026,Rasio,Koefisien Variasi,Status Rekon,Aksi Rekon,Catatan Lapangan\n';
    list.forEach((item: any) => {
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csvContent += `${item.kode},${escape(item.nama)},${item.harga2027},${item.harga2026},${item.rasio},${item.koefisienVariasi},${item.statusRekon},${escape(item.aksiRekon)},${escape(item.catatan)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Catatan_Anomali_${key}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csvContent);
  });

  // Mount Vite or static build
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

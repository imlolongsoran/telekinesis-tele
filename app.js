const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cron = require('node-cron');
const moment = require('moment');
require('moment/locale/id');  // Import locale Indonesia
const momentTz = require('moment-timezone');

// Set default timezone dan locale untuk seluruh aplikasi
moment.locale('id');
momentTz.tz.setDefault('Asia/Jakarta');

const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Hanya gambar yang diperbolehkan!');
    }
  }
});

// Create data files if they don't exist
const dataPath = path.join(__dirname, 'data');
const tokenFile = path.join(dataPath, 'token.json');
const channelFile = path.join(dataPath, 'channel.json');
const configFile = path.join(dataPath, 'config.json');

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

if (!fs.existsSync(tokenFile)) {
  fs.writeFileSync(tokenFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(channelFile)) {
  fs.writeFileSync(channelFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(configFile)) {
  fs.writeFileSync(configFile, JSON.stringify([], null, 2));
}

// Helper functions
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    return false;
  }
};

// Routes
app.get('/', (req, res) => {
  res.render('pages/index', {
    tokens: readJsonFile(tokenFile),
    channels: readJsonFile(channelFile),
    configs: readJsonFile(configFile)
  });
});

// Token Management
app.get('/tokens', (req, res) => {
  res.render('pages/tokens', {
    tokens: readJsonFile(tokenFile)
  });
});

app.post('/tokens/add', (req, res) => {
  const { name, token } = req.body;
  
  if (!name || !token) {
    return res.status(400).send('Nama dan token harus diisi');
  }
  
  const tokens = readJsonFile(tokenFile);
  const id = Date.now().toString();
  
  tokens.push({ id, name, token });
  writeJsonFile(tokenFile, tokens);
  
  res.redirect('/tokens');
});

app.post('/tokens/delete/:id', (req, res) => {
  const { id } = req.params;
  const tokens = readJsonFile(tokenFile).filter(token => token.id !== id);
  
  writeJsonFile(tokenFile, tokens);
  res.redirect('/tokens');
});

// Channel Management
app.get('/channels', (req, res) => {
  res.render('pages/channels', {
    channels: readJsonFile(channelFile)
  });
});

app.post('/channels/add', (req, res) => {
  const { name, channelId } = req.body;
  
  if (!name || !channelId) {
    return res.status(400).send('Nama dan ID channel harus diisi');
  }
  
  const channels = readJsonFile(channelFile);
  const id = Date.now().toString();
  
  channels.push({ id, name, channelId });
  writeJsonFile(channelFile, channels);
  
  res.redirect('/channels');
});

app.post('/channels/delete/:id', (req, res) => {
  const { id } = req.params;
  const channels = readJsonFile(channelFile).filter(channel => channel.id !== id);
  
  writeJsonFile(channelFile, channels);
  res.redirect('/channels');
});

// Post Configuration
app.get('/posts', (req, res) => {
  res.render('pages/posts', {
    tokens: readJsonFile(tokenFile),
    channels: readJsonFile(channelFile),
    configs: readJsonFile(configFile)
  });
});

app.post('/posts/add', upload.single('image'), (req, res) => {
  const { tokenId, channelId, title, message, scheduleDate, scheduleTime } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : '';
  
  if (!tokenId || !channelId || !message || !scheduleDate || !scheduleTime) {
    return res.status(400).send('Semua field wajib diisi kecuali gambar dan judul');
  }
  
  const configs = readJsonFile(configFile);
  const tokens = readJsonFile(tokenFile);
  const channels = readJsonFile(channelFile);
  
  // Cari token dan channel untuk disimpan lengkap
  const token = tokens.find(t => t.id === tokenId);
  const channel = channels.find(c => c.id === channelId);
  
  if (!token || !channel) {
    return res.status(400).send('Token atau channel tidak ditemukan');
  }
  
  const id = Date.now().toString();
  
  // Parsing waktu dengan timezone Indonesia/Jakarta
  const jakartaTime = moment.tz(`${scheduleDate}T${scheduleTime}`, 'Asia/Jakarta');
  const scheduleTimestamp = jakartaTime.valueOf();
  
  // Gabungkan judul dengan pesan jika judul ada
  let fullMessage = message;
  if (title && title.trim() !== '') {
    fullMessage = `${title.toUpperCase()}\n\n${message}`;
  }
  
  configs.push({
    id,
    tokenId: token.id,
    tokenName: token.name,
    tokenValue: token.token,
    channelId: channel.id, 
    channelName: channel.name,
    channelValue: channel.channelId,
    title: title || '',
    message: fullMessage,
    originalMessage: message,
    imagePath,
    scheduleDate,
    scheduleTime,
    scheduleTimestamp,
    status: 'pending',
    createdAt: moment().tz('Asia/Jakarta').valueOf()
  });
  
  writeJsonFile(configFile, configs);
  res.redirect('/posts');
});

app.post('/posts/delete/:id', (req, res) => {
  const { id } = req.params;
  const configs = readJsonFile(configFile).filter(config => config.id !== id);
  
  writeJsonFile(configFile, configs);
  res.redirect('/posts');
});

// Telegram Posting Scheduler
const checkScheduledPosts = () => {
  const configs = readJsonFile(configFile);
  
  // Gunakan waktu Jakarta
  const now = moment().tz('Asia/Jakarta').valueOf();
  
  let updated = false;
  
  // Tangani hanya post dengan status 'pending' yang waktunya sudah tiba
  const pendingConfigs = configs.filter(config => 
    config.status === 'pending' && now >= config.scheduleTimestamp
  );
  
  // Jika tidak ada yang perlu dikirim, keluar dari fungsi
  if (pendingConfigs.length === 0) return;
  
  // Log untuk monitoring dengan format waktu Jakarta
  console.log(`[${moment().tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss')}] Memeriksa ${pendingConfigs.length} post pending...`);
  
  // Proses satu per satu post pending
  pendingConfigs.forEach(async (config) => {
    sendTelegramPost(config);
  });
};

// Fungsi untuk mengirim post Telegram (dipisahkan agar bisa dipanggil manual)
const sendTelegramPost = async (config) => {
  const configs = readJsonFile(configFile);
  // Temukan config yang akan diproses
  const configToUpdate = configs.find(c => c.id === config.id);
  
  // Cek apakah post sudah diproses, kecuali jika ada flag force
  if (!configToUpdate) {
    console.log(`Post dengan ID ${config.id} tidak ditemukan`);
    return false;
  }
  
  // Cek status, bisa kirim jika pending atau jika memiliki force flag
  if (configToUpdate.status !== 'pending' && !config.forcedAt) {
    console.log(`Post dengan ID ${config.id} status ${configToUpdate.status}, bukan pending`);
    return false;
  }
  
  // Gunakan waktu Jakarta
  const now = moment().tz('Asia/Jakarta').valueOf();
  
  // Gunakan token dan channel yang sudah disimpan dalam config
  const token = { id: config.tokenId, name: config.tokenName, token: config.tokenValue };
  const channel = { id: config.channelId, name: config.channelName, channelId: config.channelValue };
  
  let updated = false;
  
  if (!token.token || !channel.channelId) {
    console.error(`Post ID ${config.id}: Token atau channel tidak ditemukan atau tidak lengkap`);
    // Tandai sebagai gagal dan update flag
    configToUpdate.status = 'failed';
    configToUpdate.failedReason = 'Token atau channel tidak lengkap';
    configToUpdate.processedAt = now;
    updated = true;
    writeJsonFile(configFile, configs);
    return false;
  }
  
  // Tandai sebagai 'processing' untuk menghindari pengiriman ganda
  configToUpdate.status = 'processing';
  writeJsonFile(configFile, configs);
  
  try {
    console.log(`[${moment().tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss')}] Mencoba mengirim post ${config.id} ke channel ${config.channelName}`);
    
    // Cek terlebih dahulu validitas token dengan membuat instance bot dengan timeout
    let bot;
    try {
      bot = new TelegramBot(config.tokenValue, { 
        polling: false,
        request: {
          timeout: 10000 // 10 detik timeout untuk API Telegram
        }
      });
      
      // Coba mendapatkan info bot untuk memastikan token valid
      await bot.getMe();
    } catch (botError) {
      console.error(`Error inisialisasi bot untuk post ID ${config.id}:`, botError);
      configToUpdate.status = 'failed';
      configToUpdate.failedReason = 'Token bot tidak valid: ' + (botError.message || 'Tidak dapat terhubung ke Telegram API');
      configToUpdate.processedAt = now;
      writeJsonFile(configFile, configs);
      return false;
    }
    
    try {
      if (config.imagePath) {
        const imagePath = path.join(__dirname, 'public', config.imagePath);
        if (!fs.existsSync(imagePath)) {
          throw new Error(`File gambar tidak ditemukan: ${imagePath}`);
        }
        
        // Kirim gambar dengan timeout
        await Promise.race([
          bot.sendPhoto(config.channelValue, fs.readFileSync(imagePath), {
            caption: config.message
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout mengirim foto ke Telegram')), 20000)
          )
        ]);
      } else {
        // Kirim teks dengan timeout
        await Promise.race([
          bot.sendMessage(config.channelValue, config.message),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout mengirim pesan ke Telegram')), 10000)
          )
        ]);
      }
      
      // Update status menjadi sukses
      configToUpdate.status = 'sent';
      configToUpdate.processedAt = now;
      console.log(`[${moment().tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss')}] Berhasil mengirim post ${config.id}`);
      
      // Reload configs karena mungkin ada perubahan dari proses lain
      const updatedConfigs = readJsonFile(configFile);
      const indexToUpdate = updatedConfigs.findIndex(c => c.id === config.id);
      if (indexToUpdate !== -1) {
        updatedConfigs[indexToUpdate].status = 'sent';
        updatedConfigs[indexToUpdate].processedAt = now;
        writeJsonFile(configFile, updatedConfigs);
      }
      
      return true;
    } catch (sendError) {
      console.error(`Error mengirim message post ID ${config.id}:`, sendError);
      configToUpdate.status = 'failed';
      configToUpdate.failedReason = sendError.message || 'Gagal mengirim pesan';
      configToUpdate.processedAt = now;
      writeJsonFile(configFile, configs);
      return false;
    }
  } catch (error) {
    console.error(`Error umum untuk post ID ${config.id}:`, error);
    configToUpdate.status = 'failed';
    configToUpdate.failedReason = error.message || 'Kesalahan tidak diketahui';
    configToUpdate.processedAt = now;
    writeJsonFile(configFile, configs);
    return false;
  }
};

// Endpoint untuk memicu pengiriman post secara manual
app.post('/posts/send/:id', (req, res) => {
  const { id } = req.params;
  const configs = readJsonFile(configFile);
  const config = configs.find(c => c.id === id);
  
  if (!config) {
    return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
  }
  
  // Modifikasi: Memperbolehkan pengiriman ulang post yang sudah terkirim atau dalam proses eksekusi
  if (config.status !== 'pending' && config.status !== 'sent' && config.status !== 'failed' && config.status !== 'processing') {
    return res.status(400).json({ success: false, message: 'Post tidak dapat dikirim dengan status saat ini' });
  }
  
  // Cek parameter force untuk mengirim paksa meskipun sedang dalam status processing
  const forceResend = req.query.force === 'true' || req.body.force === true;
  
  // Update status ke pending jika sedang mencoba mengirim ulang
  if (config.status === 'sent' || config.status === 'failed' || (config.status === 'processing' && forceResend)) {
    // Update ke config di file
    const updatedConfigs = readJsonFile(configFile);
    const configIndex = updatedConfigs.findIndex(c => c.id === id);
    if (configIndex !== -1) {
      updatedConfigs[configIndex].status = 'pending';
      updatedConfigs[configIndex].resendAttempt = (updatedConfigs[configIndex].resendAttempt || 0) + 1;
      
      // Jika ini adalah kirim paksa, catat di log
      if (config.status === 'processing') {
        console.log(`[${moment().tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss')}] Memaksa kirim ulang post ID ${id} dari status processing`);
        updatedConfigs[configIndex].forcedAt = moment().tz('Asia/Jakarta').valueOf();
      }
      
      writeJsonFile(configFile, updatedConfigs);
    }
    
    // Update config yang akan digunakan
    config.status = 'pending';
    config.resendAttempt = (config.resendAttempt || 0) + 1;
    if (config.status === 'processing') {
      config.forcedAt = moment().tz('Asia/Jakarta').valueOf();
    }
  }
  
  // Menambahkan timeout untuk mencegah permintaan menggantung
  const sendTimeout = setTimeout(() => {
    console.error(`Timeout saat mengirim post ID ${id}`);
    res.status(408).json({ success: false, message: 'Timeout saat mengirim post' });
  }, 15000); // 15 detik timeout
  
  // Kirim post secara asinkron
  sendTelegramPost(config)
    .then(success => {
      clearTimeout(sendTimeout);
      if (success) {
        // Berhasil
        res.json({ success: true, message: 'Post berhasil dikirim' });
      } else {
        // Gagal
        res.json({ success: false, message: 'Gagal mengirim post, cek log untuk detail' });
      }
    })
    .catch(err => {
      clearTimeout(sendTimeout);
      console.error('Error pada proses pengiriman manual:', err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan internal: ' + (err.message || 'Unknown error') });
    });
});

// Endpoint untuk menjadwalkan ulang post
app.post('/posts/reschedule/:id', (req, res) => {
  const { id } = req.params;
  const { scheduleDate, scheduleTime } = req.body;
  
  // Validasi input
  if (!scheduleDate || !scheduleTime) {
    return res.status(400).json({ success: false, message: 'Tanggal dan waktu wajib diisi' });
  }
  
  try {
    // Baca config yang ada
    const configs = readJsonFile(configFile);
    const configIndex = configs.findIndex(c => c.id === id);
    
    if (configIndex === -1) {
      return res.status(404).json({ success: false, message: 'Post tidak ditemukan' });
    }
    
    // Parsing waktu baru dengan timezone Indonesia/Jakarta
    const jakartaTime = moment.tz(`${scheduleDate}T${scheduleTime}`, 'Asia/Jakarta');
    const scheduleTimestamp = jakartaTime.valueOf();
    
    // Update jadwal dan status
    configs[configIndex].scheduleDate = scheduleDate;
    configs[configIndex].scheduleTime = scheduleTime;
    configs[configIndex].scheduleTimestamp = scheduleTimestamp;
    configs[configIndex].status = 'pending';
    configs[configIndex].rescheduledAt = moment().tz('Asia/Jakarta').valueOf();
    configs[configIndex].rescheduledCount = (configs[configIndex].rescheduledCount || 0) + 1;
    
    // Simpan perubahan
    writeJsonFile(configFile, configs);
    
    res.json({ 
      success: true, 
      message: 'Post berhasil dijadwalkan ulang',
      newSchedule: {
        date: scheduleDate,
        time: scheduleTime,
        timestamp: scheduleTimestamp
      }
    });
  } catch (error) {
    console.error('Error saat menjadwalkan ulang post:', error);
    res.status(500).json({ success: false, message: 'Gagal menjadwalkan ulang post: ' + (error.message || 'Unknown error') });
  }
});

// Check for scheduled posts setiap 5 detik
cron.schedule('*/5 * * * * *', checkScheduledPosts);

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
}); 
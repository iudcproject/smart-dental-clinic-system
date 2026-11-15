const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

// حفظ ملف قاعدة البيانات داخل مجلد backend بشكل موحد
const dbPath = path.join(__dirname, '../clinic.db');
const db = new Database(dbPath);

// تفعيل فحص العلاقات (Foreign Keys) وتحسين سرعة القراءة والكتابة
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// 1. بناء الجداول الأساسية للنظام
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'doctor', 'patient')),
    specialty TEXT,
    phone TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dental_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    duration INTEGER DEFAULT 30
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    service_id INTEGER,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES dental_services(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS dental_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    tooth_number TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    cost REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 2. إضافة الخدمات العلاجية الافتراضية عند تشغيل النظام لأول مرة
const servCount = db.prepare('SELECT COUNT(*) as count FROM dental_services').get().count;
if (servCount === 0) {
  const insertServ = db.prepare('INSERT INTO dental_services (name, description, price) VALUES (?, ?, ?)');
  insertServ.run('تنظيف وإزالة الجير', 'تنظيف الأسنان من التصبغات والجير وتلميعها', 30);
  insertServ.run('حشو تجميلي (كومبوزيت)', 'علاج التسوس وحشو الأسنان بمواد تجميلية مطابقة للون السن', 45);
  insertServ.run('سحب عصب (معالجة لبية)', 'تنظيف قناة الجذور وعلاج التهاب العصب', 100);
  insertServ.run('خلع سن / ضرس عقل', 'خلع جراحي أو عادي للسن التالف أو المطمور', 50);
  insertServ.run('تقويم الأسنان', 'تركيب وتقويم الأسنان لتعديل الاصطفاف', 500);
}

// 3. إنشاء حساب المدير (Admin) الافتراضي إن لم يكن موجوداً
const adminCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
if (adminCheck === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, specialty, phone, is_verified)
    VALUES (?, ?, ?, 'admin', 'مدير النظام', '0700000000', 1)
  `).run('مدير العيادة (Admin)', 'admin@clinic.com', hashedPassword);
}

// إنشاء جدول الإشعارات إذا لم يكن موجوداً
db.prepare(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// جدول إعدادات ومحتوى العيادة القابل للتعديل الكامل من لوحة الأدمن
db.exec(`
  CREATE TABLE IF NOT EXISTS clinic_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL
  );
`);

const defaultSettings = [
  ['clinic_name', 'عيادة الابتسامة الذكية'],
  ['hero_eyebrow', 'عمّان - شارع الجاردنز : حجز إلكتروني فوري'],
  ['hero_title', 'رعاية أسنان دقيقة بتقنيات حديثة وأسعار واضحة'],
  ['hero_description', 'نجمع بين الخبرة السريرية وأدوات التقييم الذكي لنمنحك خطة علاجية شفافة، مواعيد منظمة بدون انتظار طويل، وسجلاً طبياً رقمياً متكاملاً لكل زيارة.'],
  ['stat_1_value', '+15 سنة'],
  ['stat_1_label', 'خبرة سريرية متخصصة'],
  ['stat_2_value', '100%'],
  ['stat_2_label', 'تعقيم بمعايير دولية'],
  ['stat_3_value', '3 ساعات'],
  ['stat_3_label', 'حد أدنى لتأكيد الموعد'],
  ['min_booking_hours', '3'],
  ['clinic_address', 'عمّان، شارع وصفي التل (الجاردنز)، مجمع الياسمين الطبي، الطابق الثالث'],
  ['working_hours', 'السبت إلى الخميس: 09:00 صباحاً - 08:00 مساءً (الجمعة عطلة)'],
  ['clinic_phone', '+962 6 550 1234'],
  ['clinic_email', 'info@smartdental-amman.jo']
];

const insertSettingStmt = db.prepare(
  'INSERT OR IGNORE INTO clinic_settings (setting_key, setting_value) VALUES (?, ?)'
);
for (const [key, val] of defaultSettings) {
  insertSettingStmt.run(key, val);
}

module.exports = db;
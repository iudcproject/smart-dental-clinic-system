const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const { isDoctorOrAdmin } = require('../middleware/auth');

async function generateWithFallback(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('مفتاح GEMINI_API_KEY غير مضبوط في ملف .env');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const candidates = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash'
  ].filter(Boolean);

  let lastError = null;
  for (const modelName of candidates) {
    try {
      console.log(`[AI] Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { timeout: 12000 }
      );
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        console.log(`[AI] Success with model: ${modelName}`);
        return text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI] Model ${modelName} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('تعذر الحصول على استجابة من نماذج الذكاء الاصطناعي');
}

// 1. محلل الأعراض الذكي للمرضى والزوار (يرشح الخدمة المناسبة من خدمات العيادة)
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({ error: 'يرجى وصف الأعراض بشكل واضح' });
    }

    const services = db.prepare('SELECT id, name, description, price FROM dental_services').all();
    const servicesList = services.map(s => `- ${s.name} (${s.price} دينار): ${s.description}`).join('\n');

    const prompt = `
أنت مساعد طبي ذكي لعيادة أسنان تخصصية في عمّان. المريض يصف الأعراض التالية:
"${symptoms.trim()}"

قائمة الخدمات المتوفرة فعلياً في عيادتنا:
${servicesList}

المطلوب منك الرد باللغة العربية بأسلوب مطمئن، واضح، ومختصر في 3 نقاط:
1. التقييم المبدئي المحتمل للأعراض (مع التأكيد أنه تقييم أولي ولا يغني عن فحص الطبيب).
2. الخدمة الأنسب لحالته من قائمة خدمات عيادتنا أعلاه مع ذكر سعرها التقريبي.
3. نصيحة سريعة لتخفيف الألم أو العناية لحين موعد الزيارة.
`;

    const reply = await generateWithFallback(prompt);
    res.json({ analysis: reply });
  } catch (e) {
    console.error('AI analyze-symptoms error:', e.message);
    res.status(500).json({ error: 'حدث خطأ أثناء تحليل الأعراض: ' + e.message });
  }
});

// 2. توليد تعليمات ما بعد العلاج للطبيب لإرفاقها في سجل المريض
router.post('/care-instructions', isDoctorOrAdmin, async (req, res) => {
  try {
    const { treatment, tooth_number } = req.body;
    if (!treatment) {
      return res.status(400).json({ error: 'نوع العلاج مطلوب لتوليد التعليمات' });
    }

    const prompt = `
اكتب تعليمات طبية واضحة ومختصرة لما بعد الجلسة العلاجية لمريض أسنان باللغة العربية:
- الإجراء العلاجي: ${treatment}
- رقم/موقع السن: ${tooth_number || 'غير محدد'}
اجعلها في 4 نقاط عملية سهلة التطبيق للمريض خلال أول 24 ساعة.
`;

    const reply = await generateWithFallback(prompt);
    res.json({ instructions: reply });
  } catch (e) {
    console.error('AI care-instructions error:', e.message);
    res.status(500).json({ error: 'تعذر توليد التعليمات: ' + e.message });
  }
});

module.exports = router;
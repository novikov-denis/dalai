import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { 
  analyzeRequestSchema, 
  loginSchema, 
  registerSchema, 
  refineSelectionSchema, 
  refineSchema,
  generateAltSchema,
  generateAltFromPromptSchema,
  historyItemSchema,
  updateHistorySchema,
  type Suggestion 
} from "../shared/schema";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// NeuroAPI configuration
const NEUROAPI_KEY = process.env.NEUROAPI_API_KEY || "";
const NEUROAPI_URL = process.env.NEUROAPI_BASE_URL || "https://neuroapi.host/v1";

if (!NEUROAPI_KEY) {
  console.error("NEUROAPI_API_KEY not configured");
  throw new Error("NEUROAPI_API_KEY not configured");
}

// Helper function for validation errors
function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => e.message).join(', ');
}

const SYSTEM_PROMPT = `Ты — профессиональный редактор. Твоя задача — проверять тексты на соответствие редполитике и принципам коммуникации.

ОСНОВНЫЕ ПРИНЦИПЫ:

1. ЧЕСТНОСТЬ:
- Не обманываем аудиторию, даже если не выполняем план по продажам
- Не обещаем того, что не можем выполнить (например, "100% трудоустройство", "гарантированное трудоустройство")
- Говорим правду через факты, а не декларации
- Не используем слова "самый лучший", "уникальный на рынке", "быстрее/дешевле/эффективнее"
- Не используем слово "эффективный" в маркетинговой коммуникации

2. СПОКОЙСТВИЕ:
- Говорим без лишнего восторга и восхищения
- Не используем избыточные восклицательные знаки
- Не торопим и не давим на эмоции ("Успейте!", "Торопитесь!")
- Оптимистично смотрим на события

3. ПОДДЕРЖКА И ЭМПАТИЯ:
- Участвуем в том, чтобы студент в себя поверил
- Не решаем за студента, что он думает и чувствует
- Не допускаем дискриминации
- Нормализуем ошибки

4. ГОВОРИМ ТОЛЬКО ПО ДЕЛУ:
- Убираем пустословие и высокопарную лексику
- Говорим ёмко и по делу
- Один абзац — одна мысль

5. ГОВОРИМ НА ЯЗЫКЕ СТУДЕНТА:
- Не используем сложную терминологию без объяснений
- Адаптируем язык под целевую аудиторию

ВАЖНО:
- НЕ дублируй предложения! Каждое предложение должно быть уникальным.
- Если одна и та же проблема встречается несколько раз, объедини в одно предложение.
- Поддерживаешь Markdown разметку в оригинальном тексте и рекомендациях!
- В полях "original" и "replacement" сохраняй всю разметку как есть (**bold**, *italic*, \`code\`, ~~strikethrough~~, [ссылки](url) и т.д.)
- Не игнорируй Markdown при анализе, анализируй содержание с учетом разметки

Верни результат в формате JSON:
{
  "overall_analysis": "Краткий общий анализ текста (2-3 предложения) с оценкой стиля и тона",
  "suggestions": [
    {
      "id": "1",
      "original": "оригинальный текст с Markdown разметкой если была",
      "replacement": "предложенная правка с Markdown разметкой",
      "reason": "краткое объяснение",
      "type": "style" | "tone" | "grammar" | "policy"
    }
  ]
}`;

async function analyzeTextWithAI(text: string, customPrompt?: string, toneSettings?: any): Promise<{ suggestions: Suggestion[], overall_analysis: string }> {
  try {
    // Build dynamic prompt based on settings
    let systemPrompt = SYSTEM_PROMPT;
    
    if (customPrompt) {
      systemPrompt += `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customPrompt}`;
    }
    
    if (toneSettings) {
      systemPrompt += `\n\nНАСТРОЙКИ TONE OF VOICE:`;
      if (toneSettings.formality) {
        const formalityMap = {
          informal: 'Используй неформальный, дружелюбный стиль',
          moderate: 'Придерживайся умеренно-формального стиля',
          formal: 'Строго соблюдай формальный деловой стиль'
        };
        systemPrompt += `\n- Формальность: ${formalityMap[toneSettings.formality as keyof typeof formalityMap]}`;
      }
      if (toneSettings.empathy) {
        const empathyMap = {
          low: 'Минимум эмоциональной вовлеченности, сухой стиль',
          medium: 'Умеренная эмпатия и поддержка читателя',
          high: 'Высокая эмпатия, активная поддержка и вовлечение'
        };
        systemPrompt += `\n- Эмпатия: ${empathyMap[toneSettings.empathy as keyof typeof empathyMap]}`;
      }
      if (toneSettings.strictness) {
        const strictnessMap = {
          lenient: 'Помечай только явные нарушения',
          moderate: 'Стандартный уровень проверки',
          strict: 'Строго проверяй даже незначительные отступления'
        };
        systemPrompt += `\n- Строгость: ${strictnessMap[toneSettings.strictness as keyof typeof strictnessMap]}`;
      }
    }
    
    const response = await fetch(`${NEUROAPI_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NEUROAPI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Проверь этот текст на соответствие редполитике:\n\n${text}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from API");
    }

    const result = JSON.parse(content);
    const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];
    const overall_analysis = result.overall_analysis || "Текст проанализирован на соответствие редполитике.";

    return {
      suggestions: suggestions.map((s: any, index: number) => ({
        id: s.id || `suggestion-${index}`,
        original: s.original || "",
        replacement: s.replacement || s.suggested || "",
        reason: s.reason || "",
        type: s.type || "style",
        status: "pending",
        start_index: index,
      })),
      overall_analysis
    };
  } catch (error) {
    console.error("Error analyzing text:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Analyze text endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = analyzeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: formatZodError(validationResult.error) 
        });
      }

      const { text, customPrompt, toneSettings } = validationResult.data;
      
      if (!NEUROAPI_KEY) {
        return res.status(500).json({ 
          error: "NEUROAPI_API_KEY not configured" 
        });
      }

      const result = await analyzeTextWithAI(text, customPrompt, toneSettings);

      res.json({ 
        suggestions: result.suggestions,
        overall_analysis: result.overall_analysis
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to analyze text" 
      });
    }
  });

  // Refine selected text endpoint
  app.post("/api/refine-selection", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = refineSelectionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: formatZodError(validationResult.error) 
        });
      }

      const { selectedText, userPrompt } = validationResult.data;

      if (!NEUROAPI_KEY) {
        return res.status(500).json({ 
          error: "NEUROAPI_API_KEY not configured" 
        });
      }

      // Запрос к AI для переписи выделенного текста
      const response = await fetch(`${NEUROAPI_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NEUROAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `Ты — профессиональный редактор. Пользователь просит тебя переписать или изменить выделенный фрагмент текста. Предоставь только переписанный текст без дополнительных объяснений. Результат должен быть одной строкой, без кавычек.`
            },
            {
              role: "user",
              content: `Исходный фрагмент: "${selectedText}"\n\nЗапрос: ${userPrompt}`
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content || selectedText;

      res.json({
        result: result.trim(),
      });
    } catch (error: any) {
      console.error("Refine selection error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to refine selection" 
      });
    }
  });

  // Refine suggestion endpoint
  app.post("/api/refine", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = refineSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: formatZodError(validationResult.error) 
        });
      }

      const { original, replacement, reason, userPrompt } = validationResult.data;

      if (!NEUROAPI_KEY) {
        return res.status(500).json({ 
          error: "NEUROAPI_API_KEY not configured" 
        });
      }

      // Запрос к AI для уточнения
      const response = await fetch(`${NEUROAPI_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NEUROAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `Ты — профессиональный редактор. Пользователь хочет уточнить твою правку.
              
Исходный текст: "${original}"
Твоя правка: "${replacement}"
Твоё объяснение: "${reason}"

Запрос пользователя: "${userPrompt}"

Предложи улучшенный вариант с учётом пожелания пользователя. Верни JSON:
{
  "newReplacement": "улучшенный вариант правки",
  "explanation": "краткое объяснение (1 предложение), как ты учёл пожелание"
}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from API");
      }

      const result = JSON.parse(content);

      res.json({
        newReplacement: result.newReplacement || replacement,
        explanation: result.explanation || "Правка уточнена"
      });
    } catch (error: any) {
      console.error("Refine error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to refine suggestion" 
      });
    }
  });

  // Generate alt text for images using AI
  app.post("/api/generate-alt", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = generateAltSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { imageUrl } = validationResult.data;
      
      if (!NEUROAPI_KEY) {
        return res.status(500).json({ error: "NEUROAPI_API_KEY not configured" });
      }

      // Используем vision модель для анализа изображения
      const response = await fetch(`${NEUROAPI_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NEUROAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini", // или другая модель с поддержкой vision
          messages: [
            {
              role: "system",
              content: `Ты — эксперт по созданию alt-текстов для изображений. Твоя задача — написать краткое, но информативное описание изображения для людей с нарушениями зрения.

Правила:
- Описание должно быть на русском языке
- Длина: 1-2 предложения (до 125 символов идеально)
- Опиши главное содержимое изображения
- Не начинай с "Изображение..." или "На картинке..."
- Будь конкретным и информативным
- Если это график/диаграмма — опиши данные
- Если это фото человека — опиши действие, а не внешность`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Опиши это изображение для alt-текста:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        // Fallback если vision не поддерживается
        const fallbackResponse = await fetch(`${NEUROAPI_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NEUROAPI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "user",
                content: `Напиши краткий alt-текст для изображения по его URL. URL: ${imageUrl}
                
Если не можешь проанализировать изображение, предложи общий placeholder вроде "Изображение" или попробуй угадать по названию файла в URL.

Ответь только alt-текстом, без кавычек и пояснений.`
              }
            ],
            max_tokens: 100,
            temperature: 0.3,
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        const altText = fallbackData.choices?.[0]?.message?.content?.trim() || "Изображение";
        
        return res.json({ altText });
      }

      const data = await response.json();
      const altText = data.choices?.[0]?.message?.content?.trim() || "Изображение";

      res.json({ altText });
    } catch (error: any) {
      console.error("Generate alt error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate alt text",
        altText: "Изображение" // Fallback
      });
    }
  });

  // Generate alt text from user prompt (Спросить Даля)
  app.post("/api/generate-alt-from-prompt", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = generateAltFromPromptSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { imageUrl, userPrompt, currentCaption } = validationResult.data;
      
      if (!NEUROAPI_KEY) {
        return res.status(500).json({ error: "NEUROAPI_API_KEY not configured" });
      }

      // Генерируем alt-текст с учётом пользовательского промпта
      const response = await fetch(`${NEUROAPI_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NEUROAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `Ты — эксперт по созданию alt-текстов для изображений. Твоя задача — написать alt-текст согласно пожеланиям пользователя.

Правила:
- Описание должно быть на русском языке
- Следуй указаниям пользователя по стилю и содержанию
- Будь конкретным и информативным
- Не используй кавычки в ответе
- Ответь только текстом alt-тега, без пояснений

${currentCaption ? `Подпись к изображению: "${currentCaption}"` : ''}`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt || "Опиши это изображение для alt-текста:"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 200,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        // Fallback если vision не поддерживается
        const fallbackResponse = await fetch(`${NEUROAPI_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NEUROAPI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: `Ты — эксперт по созданию alt-текстов. Напиши alt-текст на основе информации от пользователя.`
              },
              {
                role: "user",
                content: `Запрос пользователя: ${userPrompt}\n${currentCaption ? `Подпись к изображению: ${currentCaption}` : ''}\nURL изображения: ${imageUrl}\n\nНапиши подходящий alt-текст. Ответь только текстом, без кавычек.`
              }
            ],
            max_tokens: 150,
            temperature: 0.5,
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        const altText = fallbackData.choices?.[0]?.message?.content?.trim() || "Изображение";
        
        return res.json({ altText });
      }

      const data = await response.json();
      const altText = data.choices?.[0]?.message?.content?.trim() || "Изображение";

      res.json({ altText });
    } catch (error: any) {
      console.error("Generate alt from prompt error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate alt text",
        altText: "Изображение"
      });
    }
  });

  // Save analysis to history
  app.post("/api/history", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = historyItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { originalText, suggestions, title, email } = validationResult.data;
      
      const now = new Date();
      const dateString = now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

      const historyItem = {
        id: `history-${Date.now()}`,
        title: title || originalText.substring(0, 50) + (originalText.length > 50 ? '...' : ''),
        date: dateString,
        text: originalText,
        suggestions: suggestions,
        acceptedCount: 0,
        timestamp: Date.now(),
        email: email
      };
      
      // Store in memory (for now)
      const userHistory = storage.get(`history-${email}`) || [];
      userHistory.unshift(historyItem);
      storage.set(`history-${email}`, userHistory.slice(0, 30)); // Keep last 30
      
      res.json({ 
        success: true,
        id: historyItem.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get analysis history
  app.get("/api/history", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      // Validate email format
      const emailSchema = z.string().email();
      const validationResult = emailSchema.safeParse(email);
      if (!validationResult.success) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const history = storage.get(`history-${email}`) || [];
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update history item (when accepting suggestions)
  app.patch("/api/history/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate input with Zod
      const validationResult = updateHistorySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { email, suggestions, acceptedCount } = validationResult.data;
      
      const history = storage.get(`history-${email}`) || [];
      const itemIndex = history.findIndex((item: any) => item.id === id);
      
      if (itemIndex !== -1) {
        if (suggestions) history[itemIndex].suggestions = suggestions;
        if (acceptedCount !== undefined) history[itemIndex].acceptedCount = acceptedCount;
        storage.set(`history-${email}`, history);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { email, name, password } = validationResult.data;

      // Check if user already exists
      const existingUser = storage.get(`user-${email}`);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save new user
      const user = {
        email,
        name,
        password: hashedPassword,
        registeredAt: Date.now()
      };
      storage.set(`user-${email}`, user);

      res.json({
        success: true,
        user: { email, name }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate input with Zod
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: formatZodError(validationResult.error) });
      }
      
      const { email, password } = validationResult.data;
      
      // Get user
      const user = storage.get(`user-${email}`);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      // Check password using bcrypt.compare for hashed passwords
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      res.json({ 
        success: true,
        user: { email: user.email, name: user.name }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

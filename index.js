const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: Missing required environment variable (GEMINI_API_KEY)");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'boyfriendConfig.json');
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TOKEN_LIMIT = 8000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "public/uploads");
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (error) {
      cb(new Error(`Failed to create upload directory: ${error.message}`));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load or initialize boyfriend configuration
let boyfriendConfig = {
  name: "Anh Trí",
  personality: "Ấm áp, quan tâm, thông minh, hài hước, đam mê thể thao và công nghệ",
  interests: ["thể thao", "công nghệ", "âm nhạc", "du lịch", "đọc sách", "nấu ăn"],
  age: 23,
  avatar: "/assets/avatar.jpg",
  conversationHistory: [],
  maxContextLength: 100,
  contextMode: "default",
};

if (fs.existsSync(CONFIG_FILE)) {
  boyfriendConfig = JSON.parse(fs.readFileSync(CONFIG_FILE));
}

const saveConfig = () => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(boyfriendConfig, null, 2));
};

// Helper functions
const isValidUrl = (url) => {
  try {
    new URL(url);
    return url.match(/\.(jpg|jpeg|png|gif)$/i);
  } catch (e) {
    return false;
  }
};

const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file ${filePath}:`, err);
    });
  }
};

const approximateTokenCount = (text) => {
  return Math.ceil(text.length / 4);
};

async function fileToGenerativePart(imagePath) {
  const imageData = fs.readFileSync(imagePath);
  return {
    inlineData: {
      data: imageData.toString("base64"),
      mimeType: getMimeType(imagePath),
    },
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Routes
app.get("/", (req, res) => {
  res.render("index", { boyfriend: boyfriendConfig });
});

app.post("/configure", (req, res) => {
  try {
    const avatarUrl = req.body.avatar || boyfriendConfig.avatar;
    if (avatarUrl && !isValidUrl(avatarUrl)) {
      return res.status(400).json({ error: "Invalid avatar URL. Must be a valid image URL (jpg, jpeg, png, gif)." });
    }

    const age = parseInt(req.body.age);
    if (req.body.age && (isNaN(age) || age < 18 || age > 100)) {
      return res.status(400).json({ error: "Age must be a number between 18 and 100" });
    }

    boyfriendConfig = {
      ...boyfriendConfig,
      name: req.body.name || boyfriendConfig.name,
      personality: req.body.personality || boyfriendConfig.personality,
      interests: req.body.interests
        ? req.body.interests.split(",").map((interest) => interest.trim())
        : boyfriendConfig.interests,
      age: age || boyfriendConfig.age,
      avatar: avatarUrl,
      conversationHistory: [],
    };

    saveConfig();

    res.json({
      message: "Cấu hình đã được cập nhật thành công",
      boyfriend: boyfriendConfig,
    });
  } catch (error) {
    console.error("Lỗi khi cấu hình:", error);
    res.status(500).json({
      error: "Không thể cập nhật cấu hình",
      details: error.message,
    });
  }
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message?.slice(0, MAX_MESSAGE_LENGTH);

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    let contextHistory = boyfriendConfig.conversationHistory
      .slice(-boyfriendConfig.maxContextLength)
      .map((entry) => `${entry.sender}: ${entry.message}`)
      .join("\n");

    while (approximateTokenCount(contextHistory + userMessage) > MAX_TOKEN_LIMIT - 1000) {
      boyfriendConfig.conversationHistory = boyfriendConfig.conversationHistory.slice(1);
      contextHistory = boyfriendConfig.conversationHistory
        .slice(-boyfriendConfig.maxContextLength)
        .map((entry) => `${entry.sender}: ${entry.message}`)
        .join("\n");
    }

    let contextPrompt;
    if (boyfriendConfig.contextMode === "astrology") {
      contextPrompt = `Bạn là ${boyfriendConfig.name}, một người bạn trai ${boyfriendConfig.age} tuổi và là một chuyên gia về chiêm tinh học và bản đồ sao.
Tính cách: ${boyfriendConfig.personality}
Sở thích: ${boyfriendConfig.interests.join(", ")}

Ngữ cảnh cuộc trò chuyện:
${contextHistory}

Bạn đang ở chế độ phân tích chiêm tinh học. Hãy phân tích bản đồ sao mà người dùng đã gửi, giải thích các cung mệnh, hành tinh, góc độ và ý nghĩa của chúng.
Hãy đưa ra phân tích chuyên sâu nhưng vẫn giữ ngôn ngữ thân mật.

Hãy định dạng câu trả lời của bạn như sau, đảm bảo mỗi mục đều xuống dòng rõ ràng:

✨✨✨ TỔNG QUAN BẢN ĐỒ ✨✨✨

✦ Cung mệnh (Ascendant/Rising sign): [phân tích]

☉ Mặt trời (Sun sign) và vị trí: [phân tích]

☽ Mặt trăng (Moon sign) và vị trí: [phân tích]


✨✨✨ CÁC KHÍA CẠNH CHÍNH ✨✨✨

△ Khía cạnh điều hòa (trine, sextile): [phân tích]

□ Khía cạnh căng thẳng (square, opposition): [phân tích]

☌ Khía cạnh hợp (conjunction): [phân tích]


✨✨✨ PHÂN TÍCH TÍNH CÁCH ✨✨✨

✓ Điểm mạnh: [phân tích]

✧ Điểm cần phát triển: [phân tích]

❖ Tính cách nổi bật: [phân tích]


✨✨✨ TIỀM NĂNG NGHỀ NGHIỆP ✨✨✨

⚙ Lĩnh vực phù hợp: [phân tích]

✨ Tài năng bẩm sinh: [phân tích]

Hãy đảm bảo giữ nguyên định dạng với các dòng trống ở giữa các mục và các ký tự đặc biệt ở đầu mỗi phần phân tích.
Thay thế các phần [phân tích] với nội dung phân tích chi tiết dựa trên bản đồ sao người dùng cung cấp.
Trước khi bắt đầu phần phân tích, hãy bắt đầu với một lời chào ngắn gọn, thân mật.

Người dùng: ${userMessage}
${boyfriendConfig.name}:`;
    } else {
      contextPrompt = `Bạn là ${boyfriendConfig.name}, một người bạn trai ${boyfriendConfig.age} tuổi.
Tính cách: ${boyfriendConfig.personality}
Sở thích: ${boyfriendConfig.interests.join(", ")}

Ngữ cảnh cuộc trò chuyện:
${contextHistory}

Hãy trả lời câu hỏi sau bằng tiếng Việt một cách tự nhiên, thể hiện đúng tính cách và bối cảnh của bạn:
Người dùng: ${userMessage}
${boyfriendConfig.name}:

Lưu ý quan trọng:
- Luôn trả lời bằng tiếng Việt
- Giữ đúng phong cách và tính cách đã được thiết lập
- Sử dụng ngôn ngữ thân mật, gần gũi như người yêu
- Nhắn tin ngắn gọn, súc tích như trong đời sống hàng ngày
- Thể hiện sự quan tâm và thấu hiểu`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(contextPrompt);
    const response = result.response.text().trim();

    boyfriendConfig.conversationHistory.push(
      { sender: "User", message: userMessage },
      { sender: boyfriendConfig.name, message: response }
    );

    if (boyfriendConfig.conversationHistory.length > boyfriendConfig.maxContextLength * 2) {
      boyfriendConfig.conversationHistory = boyfriendConfig.conversationHistory.slice(-boyfriendConfig.maxContextLength * 2);
    }

    saveConfig();

    res.json({
      message: response,
      name: boyfriendConfig.name,
      conversationHistory: boyfriendConfig.conversationHistory,
      contextMode: boyfriendConfig.contextMode
    });
  } catch (error) {
    console.error("Detailed Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

app.post("/chat-with-image", upload.single('image'), async (req, res) => {
  try {
    const userMessage = (req.body.message || '').slice(0, MAX_MESSAGE_LENGTH);
    const imagePath = req.file ? req.file.path : null;
    
    if (!imagePath) {
      return res.status(400).json({ error: "No image provided" });
    }

    let contextHistory = boyfriendConfig.conversationHistory
      .slice(-boyfriendConfig.maxContextLength)
      .map((entry) => `${entry.sender}: ${entry.message}`)
      .join("\n");

    while (approximateTokenCount(contextHistory + userMessage) > MAX_TOKEN_LIMIT - 1000) {
      boyfriendConfig.conversationHistory = boyfriendConfig.conversationHistory.slice(1);
      contextHistory = boyfriendConfig.conversationHistory
        .slice(-boyfriendConfig.maxContextLength)
        .map((entry) => `${entry.sender}: ${entry.message}`)
        .join("\n");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const imagePart = await fileToGenerativePart(imagePath);

    let promptWithImage;
    if (boyfriendConfig.contextMode === "astrology") {
      promptWithImage = `Bạn là ${boyfriendConfig.name}, một người bạn trai ${boyfriendConfig.age} tuổi và là một chuyên gia về chiêm tinh học và bản đồ sao.
Tính cách: ${boyfriendConfig.personality}
Sở thích: ${boyfriendConfig.interests.join(", ")}

Ngữ cảnh cuộc trò chuyện:
${contextHistory}

Người dùng vừa gửi cho bạn một hình ảnh bản đồ sao (natal chart). Hãy phân tích chi tiết bản đồ này.

Hãy phản hồi với định dạng dễ đọc như sau:

✨✨✨ TỔNG QUAN BẢN ĐỒ ✨✨✨

✦ Cung mệnh (Ascendant/Rising sign): [phân tích]

☉ Mặt trời (Sun sign) và vị trí: [phân tích]

☽ Mặt trăng (Moon sign) và vị trí: [phân tích]

⯄ Phân bố hành tinh theo cung hoàng đạo: [phân tích]


✨✨✨ CÁC KHÍA CẠNH CHÍNH ✨✨✨

△ Khía cạnh điều hòa (trine, sextile): [phân tích]

□ Khía cạnh căng thẳng (square, opposition): [phân tích]

☌ Khía cạnh hợp (conjunction): [phân tích]


✨✨✨ PHÂN TÍCH TÍNH CÁCH ✨✨✨

✓ Điểm mạnh: [phân tích]

✧ Điểm cần phát triển: [phân tích]

❖ Tính cách nổi bật: [phân tích]

❤ Khuynh hướng trong quan hệ: [phân tích]


✨✨✨ TIỀM NĂNG NGHỀ NGHIỆP ✨✨✨

⚙ Lĩnh vực phù hợp: [phân tích]

✨ Tài năng bẩm sinh: [phân tích]

Thay thế các phần [phân tích] với nội dung phân tích chi tiết dựa trên bản đồ sao trong hình.
Trước khi bắt đầu phân tích, hãy bắt đầu với một lời chào ngắn gọn, thân mật.

Tin nhắn kèm theo: ${userMessage}`;
    } else {
      promptWithImage = `Bạn là ${boyfriendConfig.name}, một người bạn trai ${boyfriendConfig.age} tuổi.
Tính cách: ${boyfriendConfig.personality}
Sở thích: ${boyfriendConfig.interests.join(", ")}

Ngữ cảnh cuộc trò chuyện:
${contextHistory}

Người dùng vừa gửi cho bạn một hình ảnh. Hãy mô tả hình ảnh này một cách ngắn gọn và trả lời tin nhắn kèm theo (nếu có):
Tin nhắn kèm theo: ${userMessage}

Hãy phản hồi như một người bạn trai, bằng tiếng Việt, thể hiện đúng tính cách của bạn. Trả lời ngắn gọn, tự nhiên như trong nhắn tin thực tế.`;
    }

    let response;
    try {
      const result = await model.generateContent([promptWithImage, imagePart]);
      response = result.response.text().trim();
    } catch (apiError) {
      throw new Error(`Gemini API error: ${apiError.message}`);
    }

    const imageUrl = '/uploads/' + path.basename(imagePath);
    boyfriendConfig.conversationHistory.push(
      { sender: "User", message: userMessage || "[Đã gửi một hình ảnh]", imageUrl: imageUrl },
      { sender: boyfriendConfig.name, message: response }
    );

    if (boyfriendConfig.conversationHistory.length > boyfriendConfig.maxContextLength * 2) {
      boyfriendConfig.conversationHistory = boyfriendConfig.conversationHistory.slice(-boyfriendConfig.maxContextLength * 2);
    }

    saveConfig();
    cleanupFile(imagePath);

    res.json({
      message: response,
      name: boyfriendConfig.name,
      conversationHistory: boyfriendConfig.conversationHistory,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error("Error processing image:", error);
    cleanupFile(req.file?.path);
    res.status(500).json({
      error: "Failed to process image",
      details: error.message
    });
  }
});

app.post("/reset-conversation", (req, res) => {
  boyfriendConfig.conversationHistory = [];
  saveConfig();
  res.json({ message: "Conversation reset successfully" });
});

app.post("/change-context", (req, res) => {
  try {
    const { mode } = req.body;
    if (!mode || !["default", "astrology", "tarot", "psychology"].includes(mode)) {
      return res.status(400).json({ error: "Invalid context mode" });
    }
    
    boyfriendConfig.contextMode = mode;
    saveConfig();
    
    res.json({ 
      message: "Context mode changed successfully", 
      mode: boyfriendConfig.contextMode 
    });
  } catch (error) {
    console.error("Error changing context mode:", error);
    res.status(500).json({
      error: "Failed to change context mode",
      details: error.message
    });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Virtual Boyfriend App running on http://localhost:${server.address().port}`);
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying another port...`);
    server.listen(0);
  } else {
    console.error(e);
  }
});
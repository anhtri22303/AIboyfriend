const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Virtual Boyfriend Configuration
let boyfriendConfig = {
  name: "Anh Trí",
  personality:
    "Ấm áp, quan tâm, thông minh, hài hước, đam mê thể thao và công nghệ",
  interests: ["thể thao", "công nghệ", "âm nhạc", "du lịch", "đọc sách", "nấu ăn"],
  age: 23,
  avatar:
    "https://scontent-hkg1-2.xx.fbcdn.net/v/t39.30808-6/469560759_1544524752936438_1342602091606171716_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeHt16a00IP4Wi3QJH9NWNuPV7Ru7fzlw-tXtG7t_OXD64swW68VUdXKGTlyD9ss2VAks82He5aFfhLytXdv-x2J&_nc_ohc=9FD2dbaxR_sQ7kNvwHjQ6z2&_nc_oc=AdnsIr4bH2UDdQc5dpBou6EQ2_RpwyOmvlqh1av5oLrTMnTIs-TvModeFxyDemYBJgDHfDJjyPUHNibnWR_Zcqf3&_nc_zt=23&_nc_ht=scontent-hkg1-2.xx&_nc_gid=OFBERM6uLIgsF5tlpV0chQ&oh=00_AfGLKHc5hDAs4xcLhbVubDUoqhm7Q_rXB1O7HC4HNnKBYQ&oe=6803DE40", // Default avatar
  conversationHistory: [],
  maxContextLength: 100, // Limit conversation history to prevent token overflow
};

// Routes
app.get("/", (req, res) => {
  res.render("index", { boyfriend: boyfriendConfig });
});

app.post("/configure", (req, res) => {
  try {
    // Update boyfriend configuration
    boyfriendConfig = {
      ...boyfriendConfig,
      name: req.body.name || boyfriendConfig.name,
      personality: req.body.personality || boyfriendConfig.personality,
      interests: req.body.interests
        ? req.body.interests.split(",").map((interest) => interest.trim())
        : boyfriendConfig.interests,
      age: req.body.age || boyfriendConfig.age,
      avatar: req.body.avatar || boyfriendConfig.avatar,
      conversationHistory: [], // Reset conversation history on reconfiguration
    };

    // Send back updated configuration
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
  const userMessage = req.body.message;

  try {
    // Prepare context-aware prompt
    const contextHistory = boyfriendConfig.conversationHistory
      .slice(-boyfriendConfig.maxContextLength) // Limit context length
      .map((entry) => `${entry.sender}: ${entry.message}`)
      .join("\n");

    // Construct comprehensive prompt
    const contextPrompt = `Bạn là ${boyfriendConfig.name}, một người bạn trai ${
      boyfriendConfig.age
    } tuổi.
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
- nhắn tin ngắn gọn, súc tích như trong đời sống hàng ngày
- Thể hiện sự quan tâm và thấu hiểu`;

    // Generate response using Gemini 2.5 Pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(contextPrompt);
    const response = result.response.text().trim();

    // Update conversation history
    boyfriendConfig.conversationHistory.push(
      { sender: "User", message: userMessage },
      { sender: boyfriendConfig.name, message: response }
    );

    // Trim conversation history if it exceeds max length
    if (
      boyfriendConfig.conversationHistory.length >
      boyfriendConfig.maxContextLength * 2
    ) {
      boyfriendConfig.conversationHistory =
        boyfriendConfig.conversationHistory.slice(
          -boyfriendConfig.maxContextLength * 2
        );
    }

    res.json({
      message: response,
      name: boyfriendConfig.name,
      conversationHistory: boyfriendConfig.conversationHistory,
    });
  } catch (error) {
    console.error("Detailed Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // More informative error response
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// New route to reset conversation
app.post("/reset-conversation", (req, res) => {
  boyfriendConfig.conversationHistory = [];
  res.json({ message: "Conversation reset successfully" });
});

// Start server with automatic port selection if default is in use
const server = app.listen(port, () => {
  console.log(`Virtual Boyfriend App running on http://localhost:${server.address().port}`);
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${port} is busy, trying another port...`);
    // Try a different port
    server.listen(0);
  } else {
    console.error(e);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const userMessageInput = document.getElementById("user-message");
  const sendMessageButton = document.getElementById("send-message");

  // Modal Elements - ENSURE THESE ARE SELECTED CORRECTLY
  const settingsBtn = document.getElementById("settings-btn");
  const configModal = document.getElementById("config-modal");
  const closeModalBtn = document.querySelector(".close-modal");
  const configForm = document.getElementById("config-form");

  // Debugging console logs
  console.log("Settings Button:", settingsBtn);
  console.log("Config Modal:", configModal);
  console.log("Close Modal Button:", closeModalBtn);

  // Modal Functionality - SIMPLIFIED AND EXPLICIT
  function openModal() {
    console.log("Opening modal...");
    if (configModal) {
      configModal.style.display = "flex";
    } else {
      console.error("Modal element not found!");
    }
  }

  function closeModal() {
    console.log("Closing modal...");
    if (configModal) {
      configModal.style.display = "none";
    }
  }

  // Event Listeners with Explicit Checks
  if (settingsBtn) {
    settingsBtn.addEventListener("click", openModal);
  } else {
    console.error("Settings button not found!");
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  } else {
    console.error("Close modal button not found!");
  }

  // Close modal when clicking outside
  if (configModal) {
    configModal.addEventListener("click", (event) => {
      if (event.target === configModal) {
        closeModal();
      }
    });
  }

  // Tag Management
  function setupTagInput(inputId, tagsContainerId) {
    const input = document.getElementById(inputId);
    const tagsContainer = document.getElementById(tagsContainerId);

    // Early return if either input or tags container is missing
    if (!input || !tagsContainer) {
      console.warn(
        `Input (${inputId}) or tags container (${tagsContainerId}) not found`
      );
      return;
    }

    // Create add tag button if it doesn't exist
    let addTagButton = input.nextElementSibling;
    if (!addTagButton || !addTagButton.classList.contains("add-tag-btn")) {
      addTagButton = document.createElement("button");
      addTagButton.classList.add("add-tag-btn");
      addTagButton.innerHTML = '<i class="fas fa-plus"></i>';
      input.parentNode.insertBefore(addTagButton, input.nextSibling);
    }

    function addTag() {
      const tagText = input.value.trim();
      if (!tagText) return;

      // Check for duplicate tags
      const existingTags = Array.from(tagsContainer.children).map((tag) =>
        tag.textContent.replace("×", "").trim()
      );

      if (!existingTags.includes(tagText)) {
        const tagElement = document.createElement("div");
        tagElement.classList.add("tag");
        tagElement.innerHTML = `
          ${tagText} 
          <span class="remove-tag">&times;</span>
        `;

        // Add remove functionality
        const removeTag = tagElement.querySelector(".remove-tag");
        removeTag.addEventListener("click", () => {
          tagsContainer.removeChild(tagElement);
        });

        tagsContainer.appendChild(tagElement);
        input.value = ""; // Clear input
      }
    }

    // Add tag on button click
    addTagButton.addEventListener("click", addTag);

    // Add tag on Enter key
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    });
  }

  // Setup tag inputs
  setupTagInput("personality-input", "personality-tags");
  setupTagInput("interests-input", "interests-tags");

  // Form Submission
  if (configForm) {
    configForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Collect form data
      const name = document.getElementById("name").value;
      const age = document.getElementById("age").value;
      const avatar = document.getElementById("avatar").value;

      // Collect personality tags
      const personalityTags = Array.from(
        document.querySelectorAll("#personality-tags .tag")
      ).map((tag) => tag.textContent.replace("×", "").trim());

      // Collect interests tags
      const interestsTags = Array.from(
        document.querySelectorAll("#interests-tags .tag")
      ).map((tag) => tag.textContent.replace("×", "").trim());

      // Send configuration to server
      fetch("/configure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          age: age,
          avatar: avatar,
          personality: personalityTags.join(", "),
          interests: interestsTags.join(", "),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Update header with new name and avatar
          document.querySelector(".chat-header-info h2").textContent = name;
          document.querySelector(".chat-avatar .avatar").src = avatar;

          // Close modal
          closeModal();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Không thể lưu cấu hình");
        });
    });
  } else {
    console.error("Config form not found!");
  }

  function createMessageElement(message, sender, isUser) {
    // Create message container
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(
      "message-container",
      isUser ? "user-message" : "ai-message"
    );

    // Create sender name element
    const senderElement = document.createElement("div");
    senderElement.classList.add("message-sender");
    senderElement.textContent = sender;

    // Create message element
    const messageElement = document.createElement("div");
    messageElement.classList.add(
      "message",
      isUser ? "user-message" : "ai-message"
    );

    // Create message text element
    const messageTextElement = document.createElement("div");
    messageTextElement.classList.add("message-text");
    messageTextElement.textContent = message;

    // Assemble the message
    messageElement.appendChild(messageTextElement);
    messageContainer.appendChild(senderElement);
    messageContainer.appendChild(messageElement);

    return messageContainer;
  }

  function addMessage(message, sender) {
    const isUser = sender.toLowerCase() === "bạn";
    const messageElement = createMessageElement(message, sender, isUser);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function clearChatMessages() {
    chatMessages.innerHTML = ""; // Clear existing messages
  }

  sendMessageButton.addEventListener("click", sendMessage);
  userMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  function sendMessage() {
    const userMessage = userMessageInput.value.trim();
    if (!userMessage) return;

    // Add user message to chat
    addMessage(userMessage, "Bạn");
    userMessageInput.value = "";

    // Send message to server
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Add AI response to chat
        addMessage(data.message, data.name);
      })
      .catch((error) => {
        console.error("Lỗi:", error);
        addMessage("Xin lỗi, đã xảy ra sự cố.", "Hệ Thống");
      });
  }
});

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

  // Add this near the top of your JavaScript file

  // Shared state for boyfriend config
  const boyfriendConfig = {
    contextMode: "default",
    // Other properties can be added as needed
  };

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

  function createMessageElement(message, sender, isUser, imageUrl = null) {
    // Create message container
    const messageContainer = document.createElement("div");
    messageContainer.classList.add(
      "message-container",
      isUser ? "user-message" : "ai-message"
    );

    // Create message element
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    // Add image if present
    if (imageUrl) {
      const imageElement = document.createElement("img");
      imageElement.src = imageUrl;
      imageElement.classList.add("message-image");
      imageElement.alt = "Shared image";
      
      // Make image clickable for fullscreen view
      imageElement.addEventListener("click", () => {
        fullscreenImage.src = imageUrl;
        imageModal.style.display = "flex";
      });
      
      messageElement.appendChild(imageElement);
    }

    // Create message text element
    const messageTextElement = document.createElement("div");
    messageTextElement.classList.add("message-text");
    messageTextElement.textContent = message;
    messageElement.appendChild(messageTextElement);

    // Create time element
    const timeElement = document.createElement("div");
    timeElement.classList.add("message-time");
    const now = new Date();
    timeElement.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Assemble the message
    messageContainer.appendChild(messageElement);
    messageContainer.appendChild(timeElement);

    return messageContainer;
  }

  function addMessage(message, sender, imageUrl = null) {
    const isUser = sender.toLowerCase() === "bạn";
    const messageElement = createMessageElement(message, sender, isUser, imageUrl);

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
    
    // If no message and no image, do nothing
    if (!userMessage && !selectedImage) return;

    if (selectedImage) {
      // Send message with image
      sendMessageWithImage(userMessage);
    } else {
      // Send regular text message (existing functionality)
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
          
          // Update config
          updateConfigFromResponse(data);
        })
        .catch((error) => {
          console.error("Lỗi:", error);
          addMessage("Xin lỗi, đã xảy ra sự cố.", "Hệ Thống");
        });
    }
  }

  function sendMessageWithImage(message) {
    // Create form data for image upload
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    if (message) {
      formData.append('message', message);
    }

    // Show sending state
    const placeholder = message || "[Đang gửi hình ảnh...]";
    addMessage(placeholder, "Bạn", URL.createObjectURL(selectedImage));
    
    // Reset input fields
    userMessageInput.value = "";
    resetImageSelection();

    // Send to server
    fetch("/chat-with-image", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Add AI response to chat
        addMessage(data.message, data.name);
        
        // Update config
        updateConfigFromResponse(data);
      })
      .catch((error) => {
        console.error("Error sending image:", error);
        addMessage("Xin lỗi, đã xảy ra lỗi khi xử lý hình ảnh.", "Hệ Thống");
      });
  }

  // New image-related elements
  const imageUploadButton = document.getElementById("image-upload-button");
  const imageUploadInput = document.getElementById("image-upload");
  const imagePreviewContainer = document.querySelector(".image-preview-container");
  const imagePreview = document.querySelector(".image-preview");
  const removeImageBtn = document.querySelector(".remove-image-btn");
  const imageModal = document.getElementById("image-modal");
  const fullscreenImage = document.querySelector(".fullscreen-image");
  const closeImageModal = document.querySelector(".close-image-modal");

  // Current selected image file
  let selectedImage = null;

  // Image upload functionality
  if (imageUploadButton) {
    imageUploadButton.addEventListener("click", () => {
      imageUploadInput.click();
    });
  }

  if (imageUploadInput) {
    imageUploadInput.addEventListener("change", function() {
      if (this.files && this.files[0]) {
        selectedImage = this.files[0];
        
        // File size validation (5MB limit)
        if (selectedImage.size > 5 * 1024 * 1024) {
          alert("Kích thước hình ảnh quá lớn. Vui lòng chọn hình ảnh dưới 5MB.");
          resetImageSelection();
          return;
        }
        
        // File type validation
        if (!selectedImage.type.match('image.*')) {
          alert("Vui lòng chọn file hình ảnh.");
          resetImageSelection();
          return;
        }
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = function(e) {
          imagePreview.src = e.target.result;
          imagePreviewContainer.style.display = "block";
        };
        reader.readAsDataURL(selectedImage);
      }
    });
  }

  // Remove image preview
  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", resetImageSelection);
  }

  function resetImageSelection() {
    selectedImage = null;
    imageUploadInput.value = "";
    imagePreviewContainer.style.display = "none";
  }

  // Close fullscreen image modal
  if (closeImageModal) {
    closeImageModal.addEventListener("click", () => {
      imageModal.style.display = "none";
    });
  }

  // Also close modal when clicking outside the image
  if (imageModal) {
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        imageModal.style.display = "none";
      }
    });
  }

  // Get context mode selector
  const contextModeSelect = document.getElementById("context-mode");
  
  // Add context mode switching functionality
  if (contextModeSelect) {
    contextModeSelect.addEventListener("change", function() {
      const selectedMode = this.value;
      
      // Show loading state
      addSystemMessage("Đang chuyển chế độ chat...");
      
      // Make API call to change context mode
      fetch("/change-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: selectedMode }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Update UI to show current mode
          updateContextModeUI(selectedMode);
          
          // Add system message about mode change
          if (selectedMode === "default") {
            addSystemMessage("Đã chuyển sang chế độ trò chuyện thông thường.");
          } else if (selectedMode === "astrology") {
            addSystemMessage("Đã chuyển sang chế độ phân tích bản đồ sao. Bạn có thể gửi hình ảnh bản đồ sao để được phân tích chi tiết.");
          } else if (selectedMode === "tarot") {
            addSystemMessage("Đã chuyển sang chế độ đọc bài Tarot. Hãy đặt câu hỏi để được giải đáp.");
          } else if (selectedMode === "psychology") {
            addSystemMessage("Đã chuyển sang chế độ tư vấn tâm lý. Hãy chia sẻ vấn đề bạn đang gặp phải.");
          }
        })
        .catch((error) => {
          console.error("Error changing context mode:", error);
          addSystemMessage("Không thể chuyển chế độ. Vui lòng thử lại.");
          // Reset selector to previous value
          contextModeSelect.value = boyfriendConfig.contextMode || "default";
        });
    });
  }
  
  function updateContextModeUI(mode) {
    // Remove any existing indicator
    const existingIndicator = document.querySelector(".context-mode-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // If not default mode, add indicator
    if (mode !== "default") {
      const chatContainer = document.querySelector(".chat-container");
      const indicator = document.createElement("div");
      indicator.classList.add("context-mode-indicator", mode);
      
      // Set indicator text
      if (mode === "astrology") {
        indicator.textContent = "Chế độ bản đồ sao";
      } else if (mode === "tarot") {
        indicator.textContent = "Chế độ đọc bài Tarot";
      } else if (mode === "psychology") {
        indicator.textContent = "Chế độ tư vấn tâm lý";
      }
      
      chatContainer.appendChild(indicator);
    }
  }
  
  function addSystemMessage(message) {
    // Create system message element
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message-container", "system-message");
    
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "system");
    messageElement.textContent = message;
    
    const timeElement = document.createElement("div");
    timeElement.classList.add("message-time");
    const now = new Date();
    timeElement.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    messageContainer.appendChild(messageElement);
    messageContainer.appendChild(timeElement);
    
    // Add to chat
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add additional CSS for system messages
  const style = document.createElement('style');
  style.textContent = `
    .message-container.system-message {
      align-self: center;
      max-width: 90%;
    }
    
    .message.system {
      background-color: var(--secondary-color);
      color: var(--text-secondary);
      font-style: italic;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
    }
  `;
  document.head.appendChild(style);

  // Update this when receiving responses from the server
  function updateConfigFromResponse(data) {
    if (data.contextMode) {
      boyfriendConfig.contextMode = data.contextMode;
      // Update UI to reflect current mode
      if (contextModeSelect) {
        contextModeSelect.value = data.contextMode;
      }
      updateContextModeUI(data.contextMode);
    }
  }
});

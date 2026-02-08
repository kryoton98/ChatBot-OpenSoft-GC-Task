import { useState, useCallback } from 'react';
import API from '../utils/api';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  
  // Store the list of past chats for the sidebar
  const [chatHistoryList, setChatHistoryList] = useState([]);

  // 1. Fetch the Sidebar List (Titles & IDs)
  const fetchChatList = useCallback(async () => {
    try {
      const response = await API.get('/chats');
      setChatHistoryList(response.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  // 2. Load a Specific Chat (Clicking the Sidebar)
  const loadChat = async (id) => {
    setIsLoading(true);
    setChatId(id); 
    try {
      const response = await API.get(`/chats/${id}`);
      // Convert DB messages to UI format
      const formattedMessages = response.data.messages.map(msg => ({
        id: msg._id,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp,
        file: msg.image === "Image uploaded" ? "Attached Image" : null,
        // If we saved the model in DB later, we could load it here too.
        // For now, history defaults to 'AI'
        model: msg.model || null 
      }));
      setMessages(formattedMessages);
    } catch (err) {
      setError("Failed to load chat conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Send Message (Updated to capture Model Name)
  const sendMessage = async (text, file, model) => {
    setIsLoading(true);
    setError(null);

    // Optimistic Update (User Message)
    const userMsg = {
      id: Date.now(),
      text: text,
      sender: "user",
      file: file ? file.name : null,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const formData = new FormData();
      formData.append('message', text);
      formData.append('model', model);
      if (chatId) formData.append('chatId', chatId);
      if (file) formData.append('image', file);

      const response = await API.post('/chats/completion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update Chat ID if this was a new conversation
      if (response.data.chatId) {
        setChatId(response.data.chatId);
        if (!chatId) fetchChatList(); 
      }

      const aiText = response.data.result || response.data.content || "No response";
      const actualModel = response.data.modelUsed; // <--- NEW: Get the REAL model used (e.g., 'groq')

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: aiText,
          sender: "ai",
          timestamp: new Date(),
          model: actualModel // <--- NEW: Store it so the UI can display it
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
      setMessages([]);
      setChatId(null);
  };

  return { 
    messages, 
    sendMessage, 
    isLoading, 
    error, 
    chatId, 
    clearChat, 
    chatHistoryList, 
    fetchChatList, 
    loadChat 
  };
};
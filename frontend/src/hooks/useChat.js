import { useState, useCallback, useRef } from 'react';
import API from '../utils/api'; // Keep your existing API wrapper

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  
  // Store the list of past chats for the sidebar
  const [chatHistoryList, setChatHistoryList] = useState([]);

  // Ref to handle stopping the request
  const abortControllerRef = useRef(null);

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
      
      const formattedMessages = response.data.messages.map(msg => ({
        id: msg._id,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp,
        file: msg.image === "Image uploaded" ? "Attached Image" : null,
        model: msg.model || null 
      }));
      setMessages(formattedMessages);
    } catch (err) {
      setError("Failed to load chat conversation.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Send Message (Updated with Stop Logic)
  const sendMessage = async (text, file, model) => {
    setIsLoading(true);
    setError(null);

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

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

      // Pass the 'signal' to API.post so we can cancel it
      const response = await API.post('/chats/completion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortControllerRef.current.signal 
      });

      // Update Chat ID if this was a new conversation
      if (response.data.chatId) {
        setChatId(response.data.chatId);
        if (!chatId) fetchChatList(); 
      }

      const aiText = response.data.result || response.data.content || "No response";
      const actualModel = response.data.modelUsed; 

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: aiText,
          sender: "ai",
          timestamp: new Date(),
          model: actualModel 
        },
      ]);
    } catch (err) {
      // Check if the error was because we cancelled it
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('Request canceled by user');
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: "🛑 Generation stopped by user.", sender: "ai", isError: true }
        ]);
      } else {
        setError(err.response?.data?.error || "Failed to send message");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 4. Stop Generation Function
  const stopGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cancels the API request
    }
  };

  // 5. Delete Chat Function
  const deleteChat = async (id) => {
    try {
        await API.delete(`/chats/${id}`);
        
        // Remove from the sidebar list instantly
        setChatHistoryList((prev) => prev.filter((chat) => chat._id !== id));

        // If we deleted the chat we are currently looking at, clear the screen
        if (id === chatId) {
            clearChat();
        }
    } catch (err) {
        console.error("Failed to delete chat:", err);
        setError("Failed to delete chat");
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
    loadChat,
    // Export the new functions
    stopGeneration,
    deleteChat
  };
};
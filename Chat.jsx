import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
    transports: ['websocket', 'polling'],
    upgrade: true,
    forceNew: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000
  });
  
  // Add error listeners
  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });

function Chat() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Handle joining the chat
  const joinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('user_join', username);
      setIsConnected(true);
    }
  };

  // Handle sending messages
  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username.trim()) {
      socket.emit('send_message', message);
      setMessage('');
    }
  };

  // Set up socket listeners
  useEffect(() => {
    socket.on('chat_history', (history) => {
      setMessages(history);
    });

    socket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('system_message', (text) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        text,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('system_message');
      socket.off('online_users');
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isConnected) {
    return (
      <div className="chat-container">
        <div className="join-chat">
          <h2>Join the Chat</h2>
          <form onSubmit={joinChat}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Real-Time Chat</h2>
        <div className="online-users">
          Online: {onlineUsers.length} user(s)
          <ul>
            {onlineUsers.map(user => (
              <li key={user.id}>{user.username}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.username === username ? 'own-message' : ''} ${msg.username === 'System' ? 'system-message' : ''}`}>
            {msg.username !== username && msg.username !== 'System' && (
              <span className="message-username">{msg.username}</span>
            )}
            <span className="message-text">{msg.text}</span>
            <span className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default Chat;
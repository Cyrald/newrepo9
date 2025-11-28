type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Set<MessageHandler> = new Set();
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          if (message.type === 'auth_success') {
            console.log('WebSocket authenticated successfully');
          }
          
          if (message.type === 'rate_limit') {
            console.warn('WebSocket rate limit exceeded:', message.message);
          }
          
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.socket = null;
        
        if (event.code === 1008) {
          console.error('WebSocket authentication failed or rate limit exceeded');
          return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.userId!);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }
  
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.userId = null;
    this.reconnectAttempts = 0;
  }
  
  send(data: WebSocketMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
  
  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }
  
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WebSocketClient();

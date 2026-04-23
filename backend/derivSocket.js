const WebSocket = require('ws');

class DerivSocket {
    constructor(symbol, apiToken) {
        this.symbol = symbol;
        this.apiToken = apiToken;
        this.socket = null;
    }

    connect() {
        this.socket = new WebSocket('wss://socket.binary.com');
        this.socket.on('open', () => {
            this.authorize();
        });
        this.socket.on('message', (data) => {
            console.log('Message from server:', data);
        });
        this.socket.on('close', () => {
            console.log('Connection closed, reconnecting...');
            setTimeout(() => this.connect(), 5000);
        });
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    authorize() {
        const message = {
            "authorize": this.apiToken,
            "symbol": this.symbol,
        };
        this.socket.send(JSON.stringify(message));
        console.log('Authorization message sent:', message);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

module.exports = DerivSocket;
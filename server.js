const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const SENHA_MESTRE = "123456"; // Altere para a sua senha
let broadcasterSocketId = null;

io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);

    // O transmissor tenta se autenticar
    socket.on('broadcaster-auth', (senha) => {
        if (senha === SENHA_MESTRE) {
            broadcasterSocketId = socket.id;
            socket.emit('auth-success');
            socket.broadcast.emit('live-started');
            console.log('Transmissor conectado com sucesso.');
        } else {
            socket.emit('auth-fail', 'Senha incorreta!');
        }
    });

    // Repassa a oferta WebRTC para os espectadores
    socket.on('watcher', () => {
        if (broadcasterSocketId) {
            io.to(broadcasterSocketId).emit('watcher', socket.id);
        }
    });

    socket.on('offer', (id, message) => {
        io.to(id).emit('offer', socket.id, message);
    });

    socket.on('answer', (id, message) => {
        io.to(id).emit('answer', socket.id, message);
    });

    socket.on('candidate', (id, message) => {
        io.to(id).emit('candidate', socket.id, message);
    });

    // Se você fechar a aba ou desconectar
    socket.on('disconnect', () => {
        if (socket.id === broadcasterSocketId) {
            broadcasterSocketId = null;
            io.broadcast.emit('live-stopped');
            console.log('Transmissor desconectado. Transmissão encerrada.');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4 : uuiddv4} = require('uuid')
const { Socket } = require("dgram")

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuiddv4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', {roomId : req.params.room})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit("user-disconnected",
            userId)
        })
    })
})
server.listen(3000)
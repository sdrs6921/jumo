const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    //Peer Object Port
    host: '/',
    port: 3001
})

Promise.all([
    faceapi.nets.ageGenderNet.loadFromUri('./models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo)

const myVideo = document.createElement('video')
myVideo.muted = true

const peers = {}

function startVideo() {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then(stream => {
        addVideoStream(myVideo, stream)

        myPeer.on('call', call => {
            call.answer(stream)
            const video = document.createElement('video')
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream)
            })
        })

        socket.on('user-connected', userId => {
            connectToNewUser(userId, stream)
        })
    })
}

socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        peers[userId].close()
    }
})
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })

    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.width = 300
        video.height = 300
        video.play()
    })

    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video)
        document.body.append(canvas)
        const displaySize = {width : video.width , height : video.height}
        faceapi.matchDimensions(canvas, displaySize)
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video,
            new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
            .withFaceExpressions().withAgeAndGender()
            
            const resizeDetection = faceapi.resizeResults(detections, displaySize)
            console.log(detections)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            faceapi.draw.drawDetections(canvas, resizeDetection)
            faceapi.draw.drawFaceLandmarks(canvas, resizeDetection)
            faceapi.draw.drawFaceExpressions(canvas, resizeDetection)
            resizedDetections.forEach( detection => {
                const box = detection.detection.box
                const drawBox = new faceapi.draw.DrawBox(box, { label: Math.round(detection.age) + " year old " + detection.gender })
                drawBox.draw(canvas)
             })
        }, 100)
    })
    videoGrid.append(video)
}
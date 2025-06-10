const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const controlCamara = document.getElementById('controlCamara');
const overlay = document.getElementById('overlay');
const videoContainer = document.getElementById('video-container');
const habilitarCuadrado = document.getElementById('habilitarCuadrado');
const habilitarPuntosDeCara = document.getElementById('habilitarPuntosDeCara');
const colorRectangulo = document.getElementById('colorRectangulo');
const colorPuntos = document.getElementById('colorPuntos');
const distanciaOjos = document.getElementById('distanciaOjos');
const regionesFaciales = document.getElementById('regionesFaciales');

let stream = null;
let model = null;
let camaraPrendida = true;
let animationFrameId = null;

async function setupCamera() {
    stream = await navigator.mediaDevices.getUserMedia({video: true,});
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
        resolve(video);
        };
    });
    }

    async function run() {
    await tf.setBackend('webgl');
    await tf.ready();

    await setupCamera();
    video.play();

    model = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
            runtime: 'tfjs',
            modelType: 'short',
            maxFaces: 10,
            minDetectionConfidence: 0.5,

        }
    );
    detectFaces();
}

async function detectFaces() {
    if (!camaraPrendida || !model) return;

    const faces = await model.estimateFaces(video);

    document.getElementById("cantidadCaras").innerHTML = `<strong>Caras detectadas:</strong> ${faces.length}`;

    if(!camaraPrendida) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Array.isArray(faces)){
        for (const face of faces) {
        const {xMin, yMin, width, height} = face.box;

        if(habilitarCuadrado.checked){
            ctx.strokeStyle = colorRectangulo.value;
            ctx.lineWidth = 2;
            ctx.strokeRect(xMin, yMin, width, height);
        }
        
        if(habilitarPuntosDeCara.checked){
            ctx.fillStyle = colorPuntos.value;
            for (const {x, y} of face.keypoints){
                ctx.beginPath();
                ctx.arc(x,y,3,0,2 * Math.PI);
                ctx.fill();
                }
            }
        
        if(distanciaOjos.checked && face.keypoints.length >= 6){
            const ojoIzq = face.keypoints[0];
            const ojoDer = face.keypoints[1];
            const dx = ojoIzq.x - ojoDer.x;
            const dy = ojoIzq.y - ojoDer.y;
            const distancia = Math.sqrt(dx * dx + dy * dy).toFixed(2);

            ctx.beginPath();
            ctx.moveTo(ojoIzq.x, ojoIzq.y);
            ctx.lineTo(ojoDer.x, ojoDer.y);
            ctx.strokeStyle = 'yellow';
            ctx.stroke();

            ctx.save();
            ctx.scale(-1, 1);

            ctx.fillStyle = 'yellow';
            ctx.font = '16px sans-serif';
            ctx.fillText(`Distancia de ojos: ${distancia}px`, -ojoIzq.x, ojoIzq.y - 10);

            ctx.restore();
        }

        if(regionesFaciales.checked && face.keypoints.length >= 6){
            const dibujarPoligonos = (puntos, color) => {
                ctx.beginPath();
                ctx.moveTo(puntos[0].x, puntos[0].y);
                for (let i = 1; i < puntos.length; i++){
                    ctx.lineTo(puntos[i].x, puntos[i].y);
                }
                ctx.closePath();
                ctx.strokeStyle = color;
                ctx.stroke();
            };

        const ojoIzqRegion = face.keypoints.slice(0, 3);
        const ojoIzqRegionDos = face.keypoints.slice(0, 4);
        const ojoDerRegion = face.keypoints.slice(1, 4);
        const bocaRegion = face.keypoints.slice(3, 6);

        dibujarPoligonos(ojoIzqRegion, '#00ffff');
        dibujarPoligonos(ojoDerRegion, '#00ffff');
        dibujarPoligonos(bocaRegion, '#ff00ff');
        dibujarPoligonos(ojoIzqRegionDos, '#00ffff');
        
        // ctx.beginPath();
        // ctx.moveTo(face.keypoints[0].x, face.keypoints[0].y);
        // ctx.lineTo(face.keypoints[3].x, face.keypoints[3].y);
        // ctx.strokeStyle = '#00ff00';
        // ctx.stroke();

        }
        }
    }

    if (camaraPrendida){
        animationFrameId = requestAnimationFrame(detectFaces);
    }
}

controlCamara.addEventListener('click', () =>{
    if(camaraPrendida){
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        camaraPrendida = false;
        cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0,0, canvas.width, canvas.height);
        overlay.style.visibility = 'visible';
        controlCamara.innerHTML = `<img src="assets/camera-video-off-fill.svg" alt="">`;
        controlCamara.style.backgroundColor = 'rgb(255, 17, 17)';
        videoContainer.style.borderColor = 'rgb(255, 17, 17)';
        document.getElementById("estadoCamara").innerHTML = "<strong>Estado de Cámara:</strong> Apagada";
        document.getElementById("cantidadCaras").innerHTML = "<strong>Caras detectados:</strong> 0";
        videoContainer.style.boxShadow = '0 0 20px rgba(188, 26, 26, 0.5)';
    } else{
        setupCamera().then(() =>{
            video.play();
            camaraPrendida = true;
            overlay.style.visibility = 'hidden';
            controlCamara.style.backgroundColor = 'white';
            videoContainer.style.borderColor = 'rgb(56, 52, 183)';
            videoContainer.style.boxShadow = '0 0 20px rgba(56, 52, 183, 0.5)';
            controlCamara.innerHTML = `<img src="assets/camera-video-fill.svg" alt="">`;
            document.getElementById("estadoCamara").innerHTML = "<strong>Estado de Cámara:</strong> Encendida";
            detectFaces();
        });
    }
});

run();


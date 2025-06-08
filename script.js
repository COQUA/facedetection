        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const controlCamara = document.getElementById('controlCamara');
        const overlay = document.getElementById('overlay');
        const videoContainer = document.getElementById('video-container')

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
            {runtime: 'tfjs'}
        );
        detectFaces();
    }

        async function detectFaces() {
            if (!camaraPrendida || !model) return;

            const faces = await model.estimateFaces(video);

            if(!camaraPrendida) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (Array.isArray(faces)){
                for (const face of faces) {
                const {xMin, yMin, width, height} = face.box;
                ctx.strokeStyle = '#17ed27';
                ctx.lineWidth = 2;
                ctx.strokeRect(xMin, yMin, width, height);

                ctx.fillStyle = '#004dff';
                for (const keypoint of face.keypoints){
                    const { x, y } = keypoint;
                    ctx.beginPath();
                    ctx.arc(x,y,3,0,2 * Math.PI);
                    ctx.fill();
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
            } else{
                setupCamera().then(() =>{
                    video.play();
                    camaraPrendida = true;
                    overlay.style.visibility = 'hidden';
                    controlCamara.style.backgroundColor = 'white';
                    videoContainer.style.borderColor = 'rgb(56, 52, 183)';
                    controlCamara.innerHTML = `<img src="assets/camera-video-fill.svg" alt="">`;
                    detectFaces();
                });
            }
        });

        run();
const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
        });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
            resolve(video);
            };
        });
        }

        async function run() {
        // ✅ Registrar el backend antes de usar modelos
        await tf.setBackend('webgl');
        await tf.ready();

        await setupCamera();
        video.play();

        const model = await faceDetection.createDetector(
            faceDetection.SupportedModels.MediaPipeFaceDetector,
            {
            runtime: 'tfjs',
            }
        );

        async function detectFaces() {
            const faces = await model.estimateFaces(video);
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

            requestAnimationFrame(detectFaces);
        }

        detectFaces();
        }

        run();
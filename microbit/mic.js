class Microphone {
    constructor() {
        this.volumeCallback = null;
        this.initializeMicrophone();
        this.volume = 0;
    }

    async initializeMicrophone() {
        let self = this;
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true
                }
            });
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaStreamSource(audioStream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.minDecibels = -127;
            analyser.maxDecibels = 0;
            analyser.smoothingTimeConstant = 0.4;
            audioSource.connect(analyser);
            const volumes = new Uint8Array(analyser.frequencyBinCount);
            
            let volumeCallback = () => {
                analyser.getByteFrequencyData(volumes);
                let volumeSum = 0;
                for (const volume of volumes)
                    volumeSum += volume;
                const averageVolume = volumeSum / volumes.length;
                // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
                self.volume = averageVolume * 2;
                //console.log('Volume: ' + averageVolume + '\n');
                //volumeVisualizer.style.setProperty('--volume', (averageVolume * 100 / 127) + '%');
            };
            setInterval(volumeCallback, 100);
        } catch (e) {
            console.error('Failed to initialize volume visualizer, simulating instead...\n', e);
            // Simulation
            //TODO remove in production!
            //let lastVolume = 50;
            //volumeCallback = () => {
            //    const volume = Math.min(Math.max(Math.random() * 100, 0.8 * lastVolume), 1.2 * lastVolume);
            //    lastVolume = volume;
            //    volumeVisualizer.style.setProperty('--volume', volume + '%');
            //};
        }
    }
}

Microphone.instance = new Microphone();

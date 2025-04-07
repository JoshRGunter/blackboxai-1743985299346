class StencilConverter {
    constructor() {
        this.COLOR_THRESHOLD = 15; // Default threshold
        this.colorLayers = [];
        this.originalImage = null;
    }

    init() {
        this.setupEventListeners();
        this.setupUI();
    }

    setupUI() {
        document.getElementById('processBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;

        // Setup threshold slider
        const thresholdSlider = document.getElementById('colorThreshold');
        const thresholdValue = document.getElementById('thresholdValue');
        thresholdSlider.addEventListener('input', () => {
            this.COLOR_THRESHOLD = parseInt(thresholdSlider.value);
            thresholdValue.textContent = this.COLOR_THRESHOLD;
        });
    }

    setupEventListeners() {
        // File input handlers
        document.getElementById('dropzone').addEventListener('click', () => 
            document.getElementById('fileInput').click());
        
        const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', () => 
            dropzone.classList.remove('drag-over'));
        dropzone.addEventListener('drop', (e) => this.handleDrop(e));

        document.getElementById('fileInput')
            .addEventListener('change', (e) => this.handleFileSelect(e));

        // Button handlers
        document.getElementById('processBtn')
            .addEventListener('click', () => this.processImage());
        document.getElementById('exportBtn')
            .addEventListener('click', () => this.exportSVG());
        document.getElementById('resetBtn')
            .addEventListener('click', () => this.reset());
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('dropzone').classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            this.handleFile(e.dataTransfer.files[0]);
        }
    }

    handleFileSelect(e) {
        if (e.target.files.length > 0) {
            this.handleFile(e.target.files[0]);
        }
    }

    handleFile(file) {
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            this.showError('Please upload a JPEG or PNG image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showError('Image must be smaller than 5MB');
            return;
        }

        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            document.getElementById('processBtn').disabled = false;
            document.getElementById('statusText').textContent = 'Ready to process';
        };
        img.onerror = () => this.showError('Error loading image');
        img.src = URL.createObjectURL(file);
    }

    processImage() {
        if (!this.originalImage) return;

        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        document.getElementById('processBtn').disabled = true;
        document.getElementById('progressBar').classList.remove('hidden');
        document.getElementById('statusText').textContent = 'Processing image...';

        setTimeout(() => {
            try {
                const colors = this.extractColors(imageData.data);
                const groupedColors = this.groupColors(colors);
                this.createSVGLayers(groupedColors, imageData);
                
                document.getElementById('exportBtn').disabled = false;
                document.getElementById('progressBar').classList.add('hidden');
                document.getElementById('statusText').textContent = 
                    `Processing complete! Found ${this.colorLayers.length} color layers.`;
            } catch (error) {
                this.showError('Error processing image: ' + error.message);
                this.reset();
            }
        }, 100);
    }

    async extractColors(pixelData) {
        // Use k-means clustering for photorealistic color quantization
        const colors = [];
        for (let i = 0; i < pixelData.length; i += 4) {
            if (pixelData[i + 3] < 220) continue;
            colors.push([pixelData[i], pixelData[i + 1], pixelData[i + 2]]);
        }

        // Calculate optimal cluster count based on image complexity
        const k = Math.min(
            Math.max(
                Math.floor(Math.sqrt(colors.length / 100)), 
                8
            ), 
            32
        ); // Dynamic cluster count (8-32)
        let centroids = this.initializeCentroids(colors, k);
        
        for (let i = 0; i < 10; i++) { // 10 iterations
            centroids = this.updateCentroids(colors, centroids);
        }

        // Merge similar centroids
        const uniqueColors = [];
        centroids.forEach(color => {
            const rgb = { r: color[0], g: color[1], b: color[2] };
            const isUnique = !uniqueColors.some(c => 
                this.colorDistance(c, rgb) < this.COLOR_THRESHOLD
            );
            if (isUnique) uniqueColors.push(rgb);
        });

        return uniqueColors.sort((a, b) => 
            (b.r + b.g + b.b) - (a.r + a.g + a.b) // Sort by brightness
        );
    }

    initializeCentroids(colors, k) {
        // Simple random initialization
        const centroids = [];
        for (let i = 0; i < k; i++) {
            const idx = Math.floor(Math.random() * colors.length);
            centroids.push([...colors[idx]]);
        }
        return centroids;
    }

    updateCentroids(colors, centroids) {
        // Assign colors to nearest centroid
        const clusters = Array(centroids.length).fill().map(() => []);
        
        colors.forEach(color => {
            let minDist = Infinity;
            let bestIdx = 0;
            
            centroids.forEach((centroid, idx) => {
                const dist = Math.sqrt(
                    Math.pow(color[0] - centroid[0], 2) +
                    Math.pow(color[1] - centroid[1], 2) +
                    Math.pow(color[2] - centroid[2], 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = idx;
                }
            });
            
            clusters[bestIdx].push(color);
        });

        // Update centroids
        return clusters.map(cluster => {
            if (cluster.length === 0) return [0, 0, 0];
            const sum = cluster.reduce((acc, c) => {
                acc[0] += c[0];
                acc[1] += c[1];
                acc[2] += c[2];
                return acc;
            }, [0, 0, 0]);
            return [sum[0]/cluster.length, sum[1]/cluster.length, sum[2]/cluster.length];
        });
    }

    groupColors(colors) {
        const groups = [];
        colors.forEach(color => {
            let added = false;
            for (const group of groups) {
                if (this.colorDistance(color, group[0]) < this.COLOR_THRESHOLD) {
                    group.push(color);
                    added = true;
                    break;
                }
            }
            if (!added) groups.push([color]);
        });

        return groups.map(group => {
            const avg = group.reduce((acc, color) => {
                acc.r += color.r;
                acc.g += color.g;
                acc.b += color.b;
                return acc;
            }, { r: 0, g: 0, b: 0 });
            return {
                r: Math.round(avg.r / group.length),
                g: Math.round(avg.g / group.length),
                b: Math.round(avg.b / group.length)
            };
        });
    }

    createSVGLayers(colors, imageData) {
        const svgPreview = document.getElementById('svgPreview');
        svgPreview.innerHTML = '';
        this.colorLayers = [];

        colors.forEach((color, index) => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", imageData.width);
            svg.setAttribute("height", imageData.height);
            svg.setAttribute("viewBox", `0 0 ${imageData.width} ${imageData.height}`);
            svg.style.display = index === 0 ? 'block' : 'none';

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", `rgb(${color.r},${color.g},${color.b})`);
            path.setAttribute("d", this.generatePathData(color, imageData));
            svg.appendChild(path);

            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-control flex items-center mb-2 p-2 bg-gray-100 rounded';
            layerDiv.innerHTML = `
                <div class="w-6 h-6 mr-2 border border-gray-300" 
                     style="background-color: rgb(${color.r},${color.g},${color.b})"></div>
                <span class="flex-grow">Layer ${index + 1}</span>
                <label class="flex items-center">
                    <input type="checkbox" class="layer-toggle mr-1" 
                           data-index="${index}" checked>
                    Visible
                </label>
            `;
            svgPreview.appendChild(layerDiv);
            svgPreview.appendChild(svg);

            this.colorLayers.push({ color, svg });
        });
    }

    exportSVG() {
        if (this.colorLayers.length === 0) return;

        const svgNS = "http://www.w3.org/2000/svg";
        const combinedSVG = document.createElementNS(svgNS, "svg");
        combinedSVG.setAttribute("width", this.originalImage.width);
        combinedSVG.setAttribute("height", this.originalImage.height);
        combinedSVG.setAttribute("viewBox", `0 0 ${this.originalImage.width} ${this.originalImage.height}`);
        combinedSVG.setAttribute("xmlns", svgNS);

        this.colorLayers.forEach((layer, index) => {
            const group = document.createElementNS(svgNS, "g");
            group.setAttribute("id", `layer-${index + 1}`);
            group.innerHTML = layer.svg.innerHTML;
            combinedSVG.appendChild(group);
        });

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(combinedSVG);
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "stencil-layers.svg";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    reset() {
        const canvas = document.getElementById('imageCanvas');
        canvas.width = 0;
        canvas.height = 0;
        document.getElementById('svgPreview').innerHTML = '';
        document.getElementById('processBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('statusText').textContent = '';
        document.getElementById('progressBar').classList.add('hidden');
        this.originalImage = null;
        this.colorLayers = [];
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        document.getElementById('errorMessage').textContent = message;
        errorAlert.classList.remove('hidden');
        setTimeout(() => errorAlert.classList.add('hidden'), 5000);
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StencilConverter().init();
});
// Photorealistic Stencil Converter with enhanced features
class StencilConverter {
    constructor() {
        this.COLOR_THRESHOLD = 15;
        this.colorLayers = [];
        this.originalImage = null;
    }

    init() {
        this.setupEventListeners();
        this.setupUI();
    }

    setupUI() {
        // [Previous UI setup code]
        
        // Add blend mode change handlers
        document.querySelectorAll('.blend-mode').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.colorLayers[index].blendMode = e.target.value;
                this.updateLayerBlending();
            });
        });
    }

    async extractColors(pixelData) {
        // Dynamic cluster count based on image complexity
        const colors = [];
        for (let i = 0; i < pixelData.length; i += 4) {
            if (pixelData[i + 3] < 220) continue;
            colors.push([pixelData[i], pixelData[i + 1], pixelData[i + 2]]);
        }

        const k = Math.min(Math.max(Math.floor(Math.sqrt(colors.length / 100)), 8), 32);
        let centroids = this.initializeCentroids(colors, k);
        
        for (let i = 0; i < 10; i++) {
            centroids = this.updateCentroids(colors, centroids);
        }

        return this.filterUniqueColors(centroids);
    }

    detectEdges(imageData) {
        // Enhanced edge detection with adaptive threshold
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        const edgeMap = new Array(width * height).fill(0);
        let maxEdge = 0;

        // Edge detection passes
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x) * 4;
                const gx = this.calculateGradientX(pixels, i, width);
                const gy = this.calculateGradientY(pixels, i, width);
                const edgeStrength = Math.sqrt(gx * gx + gy * gy);
                edgeMap[y * width + x] = edgeStrength;
                maxEdge = Math.max(maxEdge, edgeStrength);
            }
        }

        // Normalize edges
        const threshold = maxEdge * 0.2;
        return edgeMap.map(strength => strength > threshold ? Math.min(1, strength / maxEdge) : 0);
    }

    // [Additional helper methods for edge detection]
    calculateGradientX(pixels, i, width) {
        return -pixels[i - 4 - width*4] + pixels[i + 4 - width*4] +
               -2 * pixels[i - 4] + 2 * pixels[i + 4] +
               -pixels[i - 4 + width*4] + pixels[i + 4 + width*4];
    }

    calculateGradientY(pixels, i, width) {
        return -pixels[i - 4 - width*4] - 2 * pixels[i - width*4] - pixels[i + 4 - width*4] +
               pixels[i - 4 + width*4] + 2 * pixels[i + width*4] + pixels[i + 4 + width*4];
    }

    // [Rest of implementation...]
}

document.addEventListener('DOMContentLoaded', () => {
    new StencilConverter().init();
});
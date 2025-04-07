// Core functionality for Photo to SVG Stencil Converter
class StencilConverter {
    constructor() {
        this.MAX_COLORS = 12;
        this.COLOR_THRESHOLD = 30;
        this.colorLayers = [];
        this.originalImage = null;
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('dropzone').addEventListener('click', () => 
            document.getElementById('fileInput').click());
        
        // Drag and drop handlers
        const dropzone = document.getElementById('dropzone');
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', () => 
            dropzone.classList.remove('drag-over'));
        dropzone.addEventListener('drop', (e) => this.handleDrop(e));

        // File input handler
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
        // Validate file type and size
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
        };
        img.src = URL.createObjectURL(file);
    }

    processImage() {
        if (!this.originalImage) return;

        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Extract dominant colors
        const colors = this.extractColors(imageData.data);
        const groupedColors = this.groupColors(colors);
        
        // Create SVG layers
        this.createSVGLayers(groupedColors, imageData);
        
        document.getElementById('exportBtn').disabled = false;
    }

    extractColors(pixelData) {
        const colorMap = new Map();
        for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            const a = pixelData[i + 3];
            if (a < 255) continue;

            const hex = this.rgbToHex(r, g, b);
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        return Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.MAX_COLORS)
            .map(item => this.hexToRgb(item[0]));
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

        colors.forEach((color, index) => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", imageData.width);
            svg.setAttribute("height", imageData.height);
            svg.setAttribute("viewBox", `0 0 ${imageData.width} ${imageData.height}`);
            svg.style.display = index === 0 ? 'block' : 'none';

            // Create path for this color layer
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", `rgb(${color.r},${color.g},${color.b})`);
            svg.appendChild(path);

            // Add layer controls
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-control';
            layerDiv.innerHTML = `
                <div style="background-color: rgb(${color.r},${color.g},${color.b})"></div>
                <span>Layer ${index + 1}</span>
                <label>
                    <input type="checkbox" class="layer-toggle" data-index="${index}" checked>
                    Visible
                </label>
            `;
            svgPreview.appendChild(layerDiv);
            svgPreview.appendChild(svg);

            this.colorLayers.push({ color, svg });
        });
    }

    exportSVG() {
        // Implementation for exporting combined SVG
    }

    reset() {
        // Implementation for resetting the application
    }

    showError(message) {
        // Implementation for showing error messages
    }

    // Helper methods
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }

    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const converter = new StencilConverter();
    converter.init();
});
// Complete Photo to SVG Stencil Converter
class StencilConverter {
    constructor() {
        this.MAX_COLORS = 50;  // Increased from 12 to allow more color variations
        this.COLOR_THRESHOLD = 50;  // Increased from 30 for better color separation
        this.ANTI_ALIASING = 0.3;  // New property for smoother edges
        this.colorLayers = [];
        this.originalImage = null;
        this.layerNames = [];  // For individual layer naming
    }

    init() {
        this.setupEventListeners();
        this.setupUI();
        
        // Setup drag and drop for layers
        document.getElementById('svgPreview').addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.getElementById('svgPreview').addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = this.getDropIndex(e.clientY);
            if (fromIndex !== toIndex) {
                this.reorderLayers(fromIndex, toIndex);
            }
        });
    }

    getDropIndex(yPos) {
        const layers = Array.from(document.querySelectorAll('.layer-control'));
        for (let i = 0; i < layers.length; i++) {
            const rect = layers[i].getBoundingClientRect();
            if (yPos < rect.top + rect.height / 2) {
                return i;
            }
        }
        return layers.length - 1;
    }

    reorderLayers(fromIndex, toIndex) {
        // Reorder arrays
        const [movedLayer] = this.colorLayers.splice(fromIndex, 1);
        this.colorLayers.splice(toIndex, 0, movedLayer);
        
        const [movedName] = this.layerNames.splice(fromIndex, 1);
        this.layerNames.splice(toIndex, 0, movedName);
        
        // Update DOM
        const svgPreview = document.getElementById('svgPreview');
        svgPreview.innerHTML = '';
        this.colorLayers.forEach((layer, index) => {
            layer.element = layer.element.cloneNode(true);
            layer.element.dataset.index = index;
            svgPreview.appendChild(layer.element);
            svgPreview.appendChild(layer.svg);
        });
    }

    setupUI() {
        document.getElementById('processBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;
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

    extractColors(pixelData) {
        const colorMap = new Map();
        for (let i = 0; i < pixelData.length; i += 4) {
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            const a = pixelData[i + 3];
            if (a < 128) continue;  // More strict alpha threshold

            const hex = this.rgbToHex(r, g, b);
            colorMap.set(hex, {
                count: (colorMap.get(hex)?.count || 0) + 1,
                r, g, b  // Store original values for averaging
            });
        }

        return Array.from(colorMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, this.MAX_COLORS)
            .map(item => ({
                r: item[1].r,
                g: item[1].g,
                b: item[1].b,
                count: item[1].count
            }));
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
        this.layerNames = colors.map((_, i) => `Layer ${i + 1}`);

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
            layerDiv.className = 'layer-control flex items-center mb-2 p-2 bg-gray-100 rounded cursor-move';
            layerDiv.draggable = true;
            layerDiv.dataset.index = index;
            layerDiv.innerHTML = `
                <div class="w-6 h-6 mr-2 border border-gray-300" 
                     style="background-color: rgb(${color.r},${color.g},${color.b})"></div>
                <span class="flex-grow">Layer ${index + 1}</span>
                <input type="text" class="layer-name border rounded px-2 py-1 text-sm w-32 mr-2" 
                       value="Layer ${index + 1}" data-index="${index}">
                <label class="flex items-center">
                    <input type="checkbox" class="layer-toggle mr-1" 
                           data-index="${index}" checked>
                    Visible
                </label>
                <button class="layer-color ml-2 px-2 py-1 bg-gray-200 rounded text-xs" 
                        data-index="${index}">
                    <i class="fas fa-palette mr-1"></i>Edit
                </button>
            `;
            svgPreview.appendChild(layerDiv);
            svgPreview.appendChild(svg);

            this.colorLayers.push({ color, svg, element: layerDiv });
            
            // Add event listeners
            layerDiv.querySelector('.layer-name').addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.layerNames[index] = e.target.value;
            });

            // Color picker functionality
            layerDiv.querySelector('.layer-color').addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const layer = this.colorLayers[index];
                const colorInput = document.createElement('input');
                colorInput.type = 'color';
                colorInput.value = this.rgbToHex(layer.color.r, layer.color.g, layer.color.b);
                
                colorInput.addEventListener('change', (evt) => {
                    const hex = evt.target.value;
                    const rgb = this.hexToRgb(hex);
                    layer.color = rgb;
                    layer.svg.querySelector('path').setAttribute('fill', `rgb(${rgb.r},${rgb.g},${rgb.b})`);
                    layerDiv.querySelector('div.w-6.h-6').style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
                });
                
                colorInput.click();
            });
        });
    }

    generatePathData(color, imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const pixels = imageData.data;
        let pathData = '';
        let currentPath = '';

        for (let y = 0; y < height; y++) {  // Process every pixel (removed +=2)
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                if (a > 128 && this.colorDistance({r, g, b}, color) < this.COLOR_THRESHOLD) {
                    if (!currentPath) {
                        currentPath = `M${x},${y}`;
                    } else {
                        currentPath += ` L${x},${y}`;
                    }
                } else if (currentPath) {
                    pathData += currentPath + ' ';
                    currentPath = '';
                }
            }
        }
        return pathData;
    }

    exportSVG(exportType = 'combined') {
        if (this.colorLayers.length === 0) return;

        const svgNS = "http://www.w3.org/2000/svg";
        
        if (exportType === 'combined') {
            // Original combined export logic
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

            this.downloadSVG(combinedSVG, 'stencil-layers-combined.svg');
        } else {
            // Individual layer exports
            this.colorLayers.forEach((layer, index) => {
                const layerSVG = document.createElementNS(svgNS, "svg");
                layerSVG.setAttribute("width", this.originalImage.width);
                layerSVG.setAttribute("height", this.originalImage.height);
                layerSVG.setAttribute("viewBox", `0 0 ${this.originalImage.width} ${this.originalImage.height}`);
                layerSVG.setAttribute("xmlns", svgNS);
                layerSVG.innerHTML = layer.svg.innerHTML;
                
                const layerName = this.layerNames[index] || `layer-${index + 1}`;
                this.downloadSVG(layerSVG, `${layerName}.svg`);
            });
        }
    }

    downloadSVG(svgElement, filename) {
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgElement);
        const blob = new Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
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
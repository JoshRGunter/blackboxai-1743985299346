// Enhanced Photo to SVG Stencil Converter with improved color detection
class StencilConverter {
    constructor() {
        this.COLOR_THRESHOLD = 15; // More sensitive threshold
        this.colorLayers = [];
        this.originalImage = null;
    }

    // [Previous methods remain the same until extractColors]

    extractColors(pixelData) {
        const colorMap = new Map();
        // Use color quantization with smaller bins
        for (let i = 0; i < pixelData.length; i += 4) {
            // Quantize to nearest 5 to preserve more color variations
            const r = Math.round(pixelData[i] / 5) * 5;
            const g = Math.round(pixelData[i + 1] / 5) * 5;
            const b = Math.round(pixelData[i + 2] / 5) * 5;
            const a = pixelData[i + 3];
            if (a < 220) continue; // Skip semi-transparent pixels

            const hex = this.rgbToHex(r, g, b);
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        // Get more candidate colors initially
        const candidateColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.MAX_COLORS * 3)
            .map(item => this.hexToRgb(item[0]));

        // Two-pass filtering for unique colors
        const uniqueColors = [];
        candidateColors.forEach(color => {
            const isUnique = !uniqueColors.some(c => 
                this.colorDistance(c, color) < this.COLOR_THRESHOLD
            );
            if (isUnique) {
                uniqueColors.push(color);
                if (uniqueColors.length >= this.MAX_COLORS) return;
            }
        });

        return uniqueColors;
    }

    // [Rest of the class implementation remains the same]
}

document.addEventListener('DOMContentLoaded', () => {
    new StencilConverter().init();
});
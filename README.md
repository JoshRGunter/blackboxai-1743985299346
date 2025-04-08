# Photo to SVG Stencil Converter

A web application that converts images to layered SVG files for plotter cutting and stencil creation.

![Application Screenshot](./screenshot.png)

## Features

### Core Functionality
- Drag and drop image processing (JPEG/PNG)
- Adjustable color sensitivity (10-100)
- Configurable maximum colors (1-20)
- Anti-aliasing toggle for smoother edges
- Real-time preview of original and processed images

### Layer Management
- Interactive layer reordering via drag and drop
- Editable layer names
- Color customization with color picker
- Visibility toggles for each layer
- Visual color swatches

### Export Options
- Combined SVG (all layers in one file)
- Individual SVG layers (separate files)
- ZIP archive containing:
  - All layers as individual SVG files
  - Manifest.json with layer metadata
  - Color information for each layer

### Technical Specifications
- Pure client-side processing (no server required)
- Uses HTML5 Canvas for image analysis
- SVG output optimized for cutting machines
- Responsive design works on desktop and tablet

## Usage

1. **Upload an image**:
   - Drag and drop an image file (JPEG/PNG) onto the upload zone
   - Or click to browse your files

2. **Adjust settings**:
   - Set color sensitivity (higher = more color separation)
   - Choose maximum number of colors (1-20)
   - Enable/disable anti-aliasing

3. **Process the image**:
   - Click "Process Image" to generate layers
   - View the color layers in the preview panel

4. **Customize layers**:
   - Drag layers to reorder them
   - Double-click layer names to edit
   - Click the palette icon to change colors
   - Toggle visibility with the checkbox

5. **Export results**:
   - Choose between:
     - Combined SVG (all layers)
     - Individual SVG files
     - ZIP archive with all assets

## Technical Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Minimum screen resolution: 1024×768

## Installation
No installation required - runs directly in browser.
For local development:
```bash
git clone [repository-url]
cd stencil-converter
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

## Dependencies
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Font Awesome](https://fontawesome.com) - Icons
- [JSZip](https://stuk.github.io/jszip/) - ZIP archive creation
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) - File downloads

## License
MIT License - Free for personal and commercial use

Built by https://www.blackbox.ai

---

```markdown
# Photo to SVG Stencil Converter

## Project Overview
The **Photo to SVG Stencil Converter** is a web-based tool designed to convert images (JPEG and PNG) into layered SVG files suitable for plotter cutting. This project utilizes JavaScript for processing images and generating SVG files based on dominant colors detected in the images. The application is styled using Tailwind CSS for a modern and responsive user interface.

## Installation
To run this project locally, follow the steps below:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/photo-to-svg-stencil-converter.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd photo-to-svg-stencil-converter
   ```

3. **Open the `index.html` file in your web browser:**
   Simply double-click on `index.html` or right-click and select 'Open with' your preferred browser.

## Usage
1. **Upload an Image:**
   Drag and drop a JPEG or PNG image into the designated dropzone or click to browse files.

2. **Processing the Image:**
   - After uploading, click on the **Process Image** button to analyze the image.
   - Adjust the color sensitivity using the slider if desired.

3. **View SVG Layers:**
   - Once processed, the tool will display the SVG layers generated from the image.

4. **Export SVG:**
   - Click on the **Export SVG** button to download the generated SVG layers.

5. **Reset:**
   - Use the **Reset** button to clear the current image and start afresh.

## Features
- Drag and drop file upload or file selection.
- Real-time processing and visualization of SVG layers.
- Adjustable color sensitivity for better results.
- Layer visibility toggles for SVG layers.
- Export functionality to download SVG files.
- Styled using Tailwind CSS for a clean user interface.

## Dependencies
The project uses the following dependencies:
- [Tailwind CSS](https://tailwindcss.com/) for styling.
- [Font Awesome](https://fontawesome.com/) for icons.

### Included JS files
- `stencil-converter.js` - Core image processing logic.
- `script.js`, `style.css` - Helper functions and styles.

## Project Structure
```
/photo-to-svg-stencil-converter
│
├── index.html                # Main HTML file
├── style.css                 # Styling file
├── stencil-converter.js      # Main logic for image processing
├── script.js                 # Helper scripts
│
├── index-v2.html            # Enhanced version of the HTML file
├── stencil-converter-v2.js   # Improved logic
│
├── index-v3.html            # Version with color sensitivity adjustment
├── stencil-converter-v3.js   # Further enhancements
│
├── index-v4.html            # Version with blend modes
├── stencil-converter-v4.js   # Advanced color detection
│
├── index-v5.html            # Current stable version
├── stencil-converter-v5.js   # Final enhancements with layer controls
│
├── test.html                # Simple connection test file
```

## Conclusion
The Photo to SVG Stencil Converter is a powerful tool for artists and creators looking to transform their digital images into usable SVG files for cutting machines. The project is still in development, and contributions are welcome!
```
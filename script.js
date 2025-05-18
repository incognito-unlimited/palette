// Helper function: Convert HSL to RGB object (components 0-255)
function hslToRgb(h, s, l) { // h(0-360), s(0-100), l(0-100)
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    const k = n => (n + h / 30) % 12;
    const a = sDecimal * Math.min(lDecimal, 1 - lDecimal);
    const f = n =>
        lDecimal - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4)),
    };
}

// Helper function: Get color from gradient position (H from X, L from Y, S=100%)
function getColorAtPosition(x, y, width, height) {
    const hue = (x / width) * 360;
    const yRatio = y / height; // 0 (top) to 1 (bottom)

    let lightness;
    // CSS gradient: white (L=100) at top, color (L=50) at mid, black (L=0) at bottom
    if (yRatio < 0.5) { // Interpolate L from 100 (yRatio=0) down to 50 (yRatio=0.5)
        lightness = 100 - (yRatio * 2 * 50);
    } else { // Interpolate L from 50 (yRatio=0.5) down to 0 (yRatio=1)
        lightness = 50 - ((yRatio - 0.5) * 2 * 50);
    }
    lightness = Math.max(0, Math.min(100, lightness)); // Clamp lightness
    const saturation = 100; // Full saturation for this picker type

    return hslToRgb(hue, saturation, lightness); // Returns {r, g, b}
}

// Helper function: Convert RGB components to Hex string
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(val => val.toString(16).padStart(2, '0')).join('');
}

// Helper function: Calculate luminance to determine text color (black/white)
function getLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Helper function: Convert Hex string to RGB object
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substr(0, 2), 16),
    g: parseInt(hex.substr(2, 2), 16),
    b: parseInt(hex.substr(4, 2), 16)
  };
}

// Helper function: Convert Hex string to HSL array
function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
  let h = 0, s = 0, l = (max + min) / 2; // Initialize h, s
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rN: h = (gN - bN) / d + (gN < bN ? 6 : 0); break;
      case gN: h = (bN - rN) / d + 2; break;
      case bN: h = (rN - gN) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100]; // h(0-360), s(0-100), l(0-100)
}

// Helper function: Convert HSL array to Hex string
function hslToHex(h, s, l) { // h(0-360), s(0-100), l(0-100)
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

// Function to generate a 5-color palette
function generatePalette(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hex, // Primary
    hslToHex((h + 180) % 360, s, l), // Complementary
    hslToHex((h + 30) % 360, s, l), // Analogous 1
    hslToHex((h - 30 + 360) % 360, s, l), // Analogous 2 (ensure positive hue)
    hslToHex(h, s, Math.max(10, l - 20)) // Shade (ensure lightness doesn't go below 10)
  ];
}

// Function to copy text to clipboard (with fallback)
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) { // Modern async clipboard API
            await navigator.clipboard.writeText(text);
            return true;
        } else { // Fallback for older browsers / insecure contexts
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Prevent scrolling to bottom
            textarea.style.opacity = '0'; // Make it invisible
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 99999); // For mobile devices
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (err) {
        console.error('Copy failed:', err);
        return false;
    }
}

// DOM Elements
const gradientEl = document.getElementById('gradient');
const previewEl = document.getElementById('preview');
const previewTextEl = document.getElementById('preview-text');
const paletteEl = document.getElementById('palette');
const toastEl = document.getElementById('toast');
const saveButton = document.getElementById('save-button');

// State Variables
const DEFAULT_COLOR = '#E5E7EB'; 
let currentHex = DEFAULT_COLOR; 
let isColorLocked = false;

// Function to reset the color picker to its initial default state
function resetColorSelectionToDefault() {
    currentHex = DEFAULT_COLOR;
    isColorLocked = false;

    previewEl.style.background = currentHex;
    const {r,g,b} = hexToRgb(currentHex);
    previewTextEl.style.color = getLuminance(r, g, b) > 128 ? '#1f2937' : 'white';
    previewTextEl.textContent = "Hover to preview, click to select";
    previewEl.classList.remove('locked');
}

// Initialize the picker on page load
resetColorSelectionToDefault();

// Event Listener: Gradient Mouse Move (for hover preview)
gradientEl.addEventListener('mousemove', e => {
    if (isColorLocked) {
        return; 
    }
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));

    const { r, g, b } = getColorAtPosition(x, y, rect.width, rect.height);
    const hoverHex = rgbToHex(r, g, b);
    
    currentHex = hoverHex; 

    previewEl.style.background = hoverHex;
    const { r: rH, g: gH, b: bH } = hexToRgb(hoverHex);
    previewTextEl.style.color = getLuminance(rH, gH, bH) > 128 ? '#1f2937' : 'white';
    previewTextEl.textContent = hoverHex.toUpperCase(); 
    // No need to remove 'locked' class here, reset/click handles it.
});

// Event Listener: Gradient Click (to select/lock color)
gradientEl.addEventListener('click', e => {
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));

    const { r, g, b } = getColorAtPosition(x, y, rect.width, rect.height);
    const clickedHex = rgbToHex(r, g, b);
    
    currentHex = clickedHex; 
    isColorLocked = true;    

    previewEl.style.background = currentHex;
    const { r: rC, g: gC, b: bC } = hexToRgb(currentHex);
    previewTextEl.style.color = getLuminance(rC, gC, bC) > 128 ? '#1f2937' : 'white';
    previewTextEl.textContent = `${currentHex.toUpperCase()} (Selected)`;
    previewEl.classList.add('locked');
});

// Event Listener: "Show Palette" Button Click
saveButton.addEventListener('click', () => {
  const colors = generatePalette(currentHex);
  paletteEl.innerHTML = ''; // Clear previous content (bars and old instruction div)

  // Create and append the instruction text div first
  const instructionDiv = document.createElement('div');
  instructionDiv.className = 'palette-escape-instruction';
  instructionDiv.textContent = 'Press ESC to choose another color';
  paletteEl.appendChild(instructionDiv);

  // Then, create and append the color bars
  colors.forEach((color, i) => {
    const { r, g, b } = hexToRgb(color);
    const luminance = getLuminance(r, g, b);
    const bar = document.createElement('div');
    bar.className = `palette-bar bar-${i}`;
    bar.style.background = color;
    bar.style.color = luminance > 128 ? 'black' : 'white';
    bar.textContent = color.toUpperCase();
    bar.addEventListener('click', async () => {
      const success = await copyToClipboard(color);
      toastEl.textContent = success ? `Copied ${color.toUpperCase()}!` : 'Copy failed!';
      toastEl.classList.add('show');
      setTimeout(() => toastEl.classList.remove('show'), 1500);
    });
    paletteEl.appendChild(bar); // Append color bar
    // Staggered animation for showing bars
    requestAnimationFrame(() => { 
        setTimeout(() => bar.classList.add('show'), i * 100); 
    });
  });
  paletteEl.style.display = 'flex'; // Show the palette container
});

// Event Listener: Keyboard Press (for ESC key)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && paletteEl.style.display === 'flex') {
    paletteEl.style.display = 'none';
    resetColorSelectionToDefault(); // Reset color selection state when ESC is pressed
  }
});
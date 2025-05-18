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

// Helper function: Convert RGB components to Hex string
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(val => val.toString(16).padStart(2, '0')).join('');
}

// Helper function: Convert RGB components to RGB string
function rgbToString(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
}

// Helper function: Convert HSL array to HSL string
function hslToString(h, s, l) {
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

// Helper function: Calculate luminance to determine text color (black/white)
function getLuminance(r, g, b) {
    const [rLinear, gLinear, bLinear] = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Helper function: Determine text color (black or white) based on background luminance
function getTextColor(bgColor) {
    const { r, g, b } = hexToRgb(bgColor);
    const luminance = getLuminance(r, g, b);
    // Use a contrast ratio threshold (e.g., 4.5 for AA)
    // Luminance of white is 1, black is 0.
    // Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
    // We want (L_text + 0.05) / (L_bg + 0.05) >= 4.5 or (L_bg + 0.05) / (L_text + 0.05) >= 4.5
    // For white text (L_text = 1): (1 + 0.05) / (luminance + 0.05) >= 4.5
    // For black text (L_text = 0): (luminance + 0.05) / (0 + 0.05) >= 4.5
    // A simpler heuristic often used is based on 128, but using luminance is better.
    // A threshold of ~0.18-0.2 can work for switching text color.
    return luminance > 0.18 ? '#1f2937' : 'white'; // Use a specific dark color instead of pure black
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
    const saturation = 100; // Full saturation for this picker type - this gradient doesn't vary saturation

    return { h: hue, s: saturation, l: lightness }; // Return HSL components
}

// Function to generate a color palette based on harmony rule and size
function generatePalette(baseHex, rule, size) {
    const [h, s, l] = hexToHsl(baseHex);
    const colors = [];

    colors.push(baseHex); // Always include the base color

    const ensureHue = hue => (hue % 360 + 360) % 360; // Ensure hue is 0-360

    switch (rule) {
        case 'complementary':
            // Add complementary color
            if (size > 1) colors.push(hslToHex(ensureHue(h + 180), s, l));
            // Fill remaining with shades/tints of base or complementary
            while (colors.length < size) {
                const lastColor = colors[colors.length - 1];
                const [lastH, lastS, lastL] = hexToHsl(lastColor);
                // Add a tint or shade
                if (lastL > 50) { // If light, add a shade
                  colors.push(hslToHex(lastH, lastS, Math.max(l - (colors.length - 1) * 10, 10)));
                } else { // If dark, add a tint
                  colors.push(hslToHex(lastH, lastS, Math.min(l + (colors.length - 1) * 10, 90)));
                }
            }
            break;

        case 'analogous':
            // Add colors near the base hue
            const angle = 30; // Typical analogous angle
            for (let i = 1; i < size; i++) {
                // Alternate adding on left and right
                const sign = (i % 2 === 1) ? 1 : -1;
                const newHue = ensureHue(h + sign * angle * Math.ceil(i / 2));
                // Slightly vary lightness/saturation for visual interest
                const newL = Math.max(10, Math.min(90, l + sign * (i % 2 === 0 ? 10 : -10)));
                const newS = Math.max(20, Math.min(100, s + sign * (i % 2 === 1 ? 10 : -10)));
                colors.push(hslToHex(newHue, newS, newL));
            }
            break;

        case 'triadic':
            const h2 = ensureHue(h + 120);
            const h3 = ensureHue(h + 240);
            if (size > 1) colors.push(hslToHex(h2, s, l));
            if (size > 2) colors.push(hslToHex(h3, s, l));
            // Fill remaining with shades/tints of the three base hues
            while (colors.length < size) {
                const remaining = size - colors.length;
                const originalHues = [h, h2, h3].slice(0, Math.min(size, 3));
                const hueIndex = (colors.length - 1) % originalHues.length;
                const baseL = hexToHsl(colors[0])[2]; // Use original base lightness
                const deltaL = 20; // Lightness step
                const sign = (Math.floor((colors.length - 1) / originalHues.length) % 2 === 0) ? 1 : -1; // Alternate tint/shade
                const newL = baseL + sign * deltaL * (Math.floor((colors.length - 1) / originalHues.length) + 1);
                colors.push(hslToHex(originalHues[hueIndex], s, Math.max(10, Math.min(90, newL))));
            }
            break;

        case 'monochromatic':
            // Generate shades and tints of the base color
            const stepL = 100 / (size + 1); // Divide lightness range
            // Add tints (lighter colors)
            for (let i = 1; i <= size / 2; i++) {
                const newL = l + i * stepL;
                colors.push(hslToHex(h, s, Math.min(100, newL)));
            }
            // Add shades (darker colors)
            for (let i = 1; i <= size / 2 + (size % 2 === 1 ? 1 : 0); i++) {
                if (colors.length >= size) break;
                const newL = l - i * stepL;
                colors.push(hslToHex(h, s, Math.max(0, newL)));
            }
            // Sort by lightness for better visual flow (optional)
            colors.sort((c1, c2) => hexToHsl(c2)[2] - hexToHsl(c1)[2]);
            break;

        default: // Fallback to a simple complementary + shades/tints
            if (size > 1) colors.push(hslToHex(ensureHue(h + 180), s, l));
            while (colors.length < size) {
                const delta = (colors.length % 2 === 0 ? -1 : 1) * Math.ceil(colors.length / 2) * 15;
                colors.push(hslToHex(ensureHue(h + (colors.length % 2 === 0 ? 0 : 180)), s, Math.max(10, Math.min(90, l + delta))));
            }
            break;
    }

    // Ensure we have exactly 'size' colors (trim if needed, shouldn't happen with current logic)
    return colors.slice(0, size);
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
const previewTextHexEl = document.getElementById('preview-text-hex');
const previewTextRgbEl = document.getElementById('preview-text-rgb');
const previewTextHslEl = document.getElementById('preview-text-hsl');
const hueSlider = document.getElementById('hue-slider');
const saturationSlider = document.getElementById('saturation-slider');
const lightnessSlider = document.getElementById('lightness-slider');
const hueValueSpan = document.getElementById('hue-value');
const saturationValueSpan = document.getElementById('saturation-value');
const lightnessValueSpan = document.getElementById('lightness-value');
const harmonyRuleSelect = document.getElementById('harmony-rule');
const paletteSizeInput = document.getElementById('palette-size');
const generateButton = document.getElementById('generate-button');
const exportButton = document.getElementById('export-button');
const paletteEl = document.getElementById('palette');
const toastEl = document.getElementById('toast');
const historySwatchesEl = document.getElementById('history-swatches');

// State Variables
const DEFAULT_COLOR = '#3b82f6'; // A nice starting blue
let currentHex = DEFAULT_COLOR;
let currentHSL = hexToHsl(DEFAULT_COLOR); // Store current HSL
let isColorLocked = false; // Renamed from isColorLocked, still represents a user-selected 'base' color
const HISTORY_MAX_SIZE = 10;
let colorHistory = [];
let currentPalette = []; // Store the currently displayed palette

// Local Storage Keys
const LS_KEY_BASE_COLOR = 'paletteMakerBaseColor';
const LS_KEY_HISTORY = 'paletteMakerHistory';
const LS_KEY_PALETTE = 'paletteMakerPalette';

// Function to update the preview area with current color info
function updatePreview(hexColor) {
    const { r, g, b } = hexToRgb(hexColor);
    const [h, s, l] = hexToHsl(hexColor);

    previewEl.style.background = hexColor;
    const textColor = getTextColor(hexColor);

    previewTextHexEl.style.color = textColor;
    previewTextRgbEl.style.color = textColor;
    previewTextHslEl.style.color = textColor;

    previewTextHexEl.textContent = hexColor.toUpperCase();
    previewTextRgbEl.textContent = `RGB(${r}, ${g}, ${b})`;
    previewTextHslEl.textContent = `HSL(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

// Function to update the HSL sliders and their value spans
function updateSliders(h, s, l) {
    hueSlider.value = h;
    saturationSlider.value = s;
    lightnessSlider.value = l;

    hueValueSpan.textContent = Math.round(h);
    saturationValueSpan.textContent = Math.round(s);
    lightnessValueSpan.textContent = Math.round(l);
}

// Function to update the color history display
function renderHistory() {
    historySwatchesEl.innerHTML = ''; // Clear existing swatches
    colorHistory.forEach(hex => {
        const swatch = document.createElement('div');
        swatch.className = 'history-swatch';
        swatch.style.background = hex;
        swatch.title = hex.toUpperCase(); // Add tooltip
        swatch.setAttribute('tabindex', '0'); // Make it focusable
        swatch.addEventListener('click', () => {
            selectColor(hex); // Select this color
            addToHistory(hex); // Add back to history (moves it to front)
        });
        swatch.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault(); // Prevent default space/enter behavior
                selectColor(hex);
                addToHistory(hex);
            }
        });
        historySwatchesEl.appendChild(swatch);
    });
}

// Function to add a color to history
function addToHistory(hexColor) {
    // Remove if already exists to move it to the front
    colorHistory = colorHistory.filter(color => color.toLowerCase() !== hexColor.toLowerCase());
    colorHistory.unshift(hexColor); // Add to the beginning
    // Trim history if it exceeds max size
    if (colorHistory.length > HISTORY_MAX_SIZE) {
        colorHistory = colorHistory.slice(0, HISTORY_MAX_SIZE);
    }
    renderHistory(); // Re-render the history display
    saveState(); // Save history to local storage
}

// Function to select a color and update all relevant UI parts
function selectColor(hexColor) {
    currentHex = hexColor;
    currentHSL = hexToHsl(currentHex);
    updatePreview(currentHex);
    updateSliders(currentHSL[0], currentHSL[1], currentHSL[2]);
    previewEl.classList.add('locked'); // Mark as selected/locked
    saveState(); // Save selected color to local storage
}

// Function to reset the color selection state
function resetColorSelection() {
    isColorLocked = false;
    previewEl.classList.remove('locked');
    // Don't reset currentHex/HSL/Sliders here, keep the last selected color
    // We only remove the "locked" state indicator.
}

// Function to save state to Local Storage
function saveState() {
    try {
        localStorage.setItem(LS_KEY_BASE_COLOR, currentHex);
        localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(colorHistory));
        // Only save palette if it's currently displayed
        if (paletteEl.style.display === 'flex' && currentPalette.length > 0) {
            localStorage.setItem(LS_KEY_PALETTE, JSON.stringify(currentPalette));
        } else {
            localStorage.removeItem(LS_KEY_PALETTE); // Clear saved palette if palette isn't shown
        }
    } catch (e) {
        console.error("Error saving to Local Storage:", e);
        // Optionally, show a message to the user that saving isn't working
    }
}

// Function to load state from Local Storage
function loadState() {
    try {
        const savedBaseColor = localStorage.getItem(LS_KEY_BASE_COLOR);
        const savedHistory = localStorage.getItem(LS_KEY_HISTORY);
        const savedPalette = localStorage.getItem(LS_KEY_PALETTE);

        if (savedBaseColor && savedBaseColor.startsWith('#')) {
            selectColor(savedBaseColor);
        } else {
            selectColor(DEFAULT_COLOR); // Fallback to default
        }

        if (savedHistory) {
            colorHistory = JSON.parse(savedHistory);
            renderHistory();
        }

        if (savedPalette) {
            currentPalette = JSON.parse(savedPalette);
            displayPalette(currentPalette, false); // Display saved palette without animation
        }

    } catch (e) {
        console.error("Error loading from Local Storage:", e);
        // Clear potentially corrupted storage
        localStorage.removeItem(LS_KEY_BASE_COLOR);
        localStorage.removeItem(LS_KEY_HISTORY);
        localStorage.removeItem(LS_KEY_PALETTE);
        // Reset to default if loading fails
        selectColor(DEFAULT_COLOR);
        colorHistory = [];
        renderHistory();
    }
}

// Function to display the generated palette
function displayPalette(colors, animate = true) {
    currentPalette = colors; // Store the displayed palette
    paletteEl.innerHTML = ''; // Clear previous content

    // Create and append the instruction text div
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'palette-escape-instruction';
    instructionDiv.textContent = 'Press ESC to choose another color';
    paletteEl.appendChild(instructionDiv);

    // Then, create and append the color bars
    colors.forEach((color, i) => {
        const { r, g, b } = hexToRgb(color);
        const [h, s, l] = hexToHsl(color);
        const textColor = getTextColor(color);

        const bar = document.createElement('div');
        bar.className = 'palette-bar'; // Use generic class
        bar.style.background = color;
        bar.style.color = textColor;
        bar.setAttribute('data-color', color); // Store hex on the element

        // Add color formats
        const hexSpan = document.createElement('span');
        hexSpan.textContent = color.toUpperCase();
        hexSpan.style.color = textColor;
        bar.appendChild(hexSpan);

        const rgbSpan = document.createElement('span');
        rgbSpan.textContent = `RGB(${r}, ${g}, ${b})`;
        rgbSpan.style.color = textColor;
        bar.appendChild(rgbSpan);

        const hslSpan = document.createElement('span');
        hslSpan.textContent = `HSL(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
        hslSpan.style.color = textColor;
        bar.appendChild(hslSpan);

        // Add Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-color';
        removeButton.textContent = 'X';
        removeButton.title = `Remove ${color.toUpperCase()}`;
        removeButton.setAttribute('aria-label', `Remove color ${color.toUpperCase()}`);
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click event from bubbling to the bar
            removeColorFromPalette(color);
        });
        bar.appendChild(removeButton);

        // Add click listener to copy color
        bar.addEventListener('click', async () => {
            const success = await copyToClipboard(color);
            toastEl.textContent = success ? `Copied ${color.toUpperCase()}!` : 'Copy failed!';
            toastEl.classList.add('show');
            bar.classList.add('copied'); // Add copied animation class
            setTimeout(() => {
                toastEl.classList.remove('show');
                bar.classList.remove('copied'); // Remove animation class
            }, 1500);
        });

        paletteEl.appendChild(bar); // Append color bar

        // Staggered animation for showing bars
        if (animate) {
            requestAnimationFrame(() => {
                setTimeout(() => bar.classList.add('show'), i * 70); // Slightly faster animation
            });
        } else {
            bar.classList.add('show'); // Show instantly if not animating
        }
    });

    paletteEl.style.display = 'flex'; // Show the palette container
    saveState(); // Save the displayed palette
}

// Function to remove a color from the current palette
function removeColorFromPalette(hexColor) {
    currentPalette = currentPalette.filter(color => color.toLowerCase() !== hexColor.toLowerCase());
    // Re-display the palette from the updated array
    displayPalette(currentPalette, false); // No animation on removal update
    // If the palette is empty, hide it
    if (currentPalette.length === 0) {
        paletteEl.style.display = 'none';
        resetColorSelection(); // Also reset selection state if palette is closed
    }
    saveState(); // Save updated palette
}

// --- Event Listeners ---

// Event Listener: Load state when DOM is ready
document.addEventListener('DOMContentLoaded', loadState);

// Event Listener: Gradient Mouse Move (for hover preview)
gradientEl.addEventListener('mousemove', e => {
    if (previewEl.classList.contains('locked')) { // Check locked class instead of state var
        return;
    }
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));

    const { h, s, l } = getColorAtPosition(x, y, rect.width, rect.height);
    const hoverHex = hslToHex(h, s, l);

    updatePreview(hoverHex);
    // Optionally update sliders on hover? Might be too jumpy. Let's skip for now.
    // updateSliders(h, s, l);
});

// Event Listener: Gradient Mouse Leave (reset preview if not locked)
gradientEl.addEventListener('mouseleave', () => {
    if (!previewEl.classList.contains('locked')) {
        // Revert preview to the last selected color (which is stored in currentHex)
        updatePreview(currentHex);
    }
});

// Event Listener: Gradient Click (to select/lock color)
gradientEl.addEventListener('click', e => {
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));

    const { h, s, l } = getColorAtPosition(x, y, rect.width, rect.height);
    const clickedHex = hslToHex(h, s, l);

    selectColor(clickedHex); // Select the color
    addToHistory(clickedHex); // Add to history
});

// Event Listeners for HSL sliders
hueSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex; // Update currentHex
    currentHSL = [h, s, l]; // Update currentHSL
    updatePreview(newHex);
    hueValueSpan.textContent = Math.round(h);
    resetColorSelection(); // Changing slider 'unlocks' the gradient preview
    saveState(); // Save selection
});

saturationSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex;
    currentHSL = [h, s, l];
    updatePreview(newHex);
    saturationValueSpan.textContent = Math.round(s);
    resetColorSelection();
    saveState();
});

lightnessSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex;
    currentHSL = [h, s, l];
    updatePreview(newHex);
    lightnessValueSpan.textContent = Math.round(l);
    resetColorSelection();
    saveState();
});

// Event Listener: "Generate Palette" Button Click
generateButton.addEventListener('click', () => {
    const selectedRule = harmonyRuleSelect.value;
    const paletteSize = parseInt(paletteSizeInput.value, 10);
    if (isNaN(paletteSize) || paletteSize < 2 || paletteSize > 10) {
        alert('Please enter a palette size between 2 and 10.');
        return;
    }
    const colors = generatePalette(currentHex, selectedRule, paletteSize);
    displayPalette(colors);
    addToHistory(currentHex); // Add the base color to history when palette is generated
});

// Event Listener: "Export Palette" Button Click
exportButton.addEventListener('click', () => {
    if (currentPalette.length === 0) {
        alert('Generate a palette first!');
        return;
    }
    const paletteText = currentPalette.join('\n'); // Join colors with newlines
    const blob = new Blob([paletteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color_palette.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
});

// Event Listener: Keyboard Press (for ESC key)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && paletteEl.style.display === 'flex') {
    paletteEl.style.display = 'none';
    resetColorSelection(); // Reset color selection state when ESC is pressed
    saveState(); // Save state (this will clear the saved palette if it's hidden)
  }
});
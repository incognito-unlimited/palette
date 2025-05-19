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
    return `RGB(${r}, ${g}, ${b})`;
}

// Helper function: Convert HSL array to HSL string
function hslToString(h, s, l) {
    return `HSL(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

// Helper function: Calculate luminance (0-1) for WCAG - KEPT FOR GLOW EFFECT
function getRelativeLuminance(r, g, b) {
    const [rLinear, gLinear, bLinear] = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Helper function: Determine text color (dark or light) based on background luminance
// KEPT for palette bar text color
function getTextColor(bgColor) {
    const { r, g, b } = hexToRgb(bgColor);
    const luminance = getRelativeLuminance(r, g, b);
    // Use a luminance threshold to switch between dark and light text
    return luminance > 0.2 ? '#1f2937' : '#f0f0f0'; // Use specific dark/light colors
}

// Helper function: Get glow color based on background luminance
function getGlowColor(bgColor) {
    const { r, g, b } = hexToRgb(bgColor);
    const luminance = getRelativeLuminance(r, g, b);
    // Use a luminance threshold to switch between light and dark glow
    return luminance > 0.5 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
}

// Helper function: Convert Hex string to RGB object
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  // Handle shorthand hex like #abc
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
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

// Helper function: Get HSL from gradient position (H from X, L from Y, S=100%)
function getHSLAtPosition(x, y, width, height) {
    const hue = (x / width) * 360;
    const yRatio = y / height; // 0 (top) to 1 (bottom)
    let lightness;
    // CSS gradient mapping (approximation): white (L=100) at top, color (L=50) at mid, black (L=0) at bottom
    if (yRatio < 0.5) { // Interpolate L from 100 (yRatio=0) down to 50 (yRatio=0.5)
        lightness = 100 - (yRatio * 2 * 50);
    } else { // Interpolate L from 50 (yRatio=0.5) down to 0 (yRatio=1)
        lightness = 50 - ((yRatio - 0.5) * 2 * 50);
    }
    lightness = Math.max(0, Math.min(100, lightness)); // Clamp lightness
    const saturation = 100; // Full saturation for this gradient type
    return { h: hue, s: saturation, l: lightness };
}

// Function to generate a color palette based on harmony rule and size
function generatePalette(baseHex, rule, size) {
    console.log('Generating palette with base:', baseHex, 'rule:', rule, 'size:', size);
    const [h, s, l] = hexToHsl(baseHex);
    const colors = [];
    const ensureHue = hue => (hue % 360 + 360) % 360; // Ensure hue is 0-360
    switch (rule) {
        case 'complementary':
            colors.push(baseHex);
            if (size > 1) colors.push(hslToHex(ensureHue(h + 180), s, l));
            // Add variations (tints/shades) of the base and complementary
            for(let i = colors.length; i < size; i++) {
                const baseColor = colors[i % 2]; // Alternate between base and complementary
                const [baseH, baseS, baseL] = hexToHsl(baseColor);
                const deltaL = (i < 4 ? 15 : 30); // Adjust step
                const newL = (i % 4 < 2) ? baseL + deltaL : baseL - deltaL; // Alternate tint/shade
                colors.push(hslToHex(baseH, baseS, Math.max(5, Math.min(95, newL))));
            }
            break;
        case 'analogous':
            colors.push(baseHex);
            const angle = 30; // Base angle
            for (let i = 1; i < size; i++) {
                const sign = (i % 2 === 1) ? 1 : -1;
                const newHue = ensureHue(h + sign * angle * Math.ceil(i / 2));
                // Slightly vary lightness/saturation for visual interest, less aggressive steps
                const newL = Math.max(10, Math.min(90, l + sign * (i % 2 === 0 ? 8 : -8)));
                const newS = Math.max(20, Math.min(100, s + sign * (i % 2 === 1 ? 8 : -8)));
                colors.push(hslToHex(newHue, newS, newL));
            }
            break;
        case 'triadic':
            const h2 = ensureHue(h + 120);
            const h3 = ensureHue(h + 240);
            const baseHues = [h, h2, h3];
            for (let i = 0; i < size; i++) {
                const hueIndex = i % 3;
                const currentBaseH = baseHues[hueIndex];
                // Add tints/shades alternatingly for each base hue
                let newL = l;
                if (i >= 3) {
                    const step = Math.ceil((i - 2) / 2) * 15; // 15, 15, 30, 30, etc.
                    newL = (i % 2 === 1) ? l + step : l - step; // Alternate tint/shade
                }
                colors.push(hslToHex(currentBaseH, s, Math.max(5, Math.min(95, newL))));
            }
            // Ensure colors are somewhat distinct and size is met
            while (colors.length > size) colors.pop();
            break;
        case 'monochromatic':
            colors.push(baseHex);
            const stepL = 100 / (size); // Divide lightness range based on size
            for (let i = 1; i < size; i++) {
                // Alternate adding a tint and a shade, moving away from the base L
                const sign = (i % 2 === 1) ? 1 : -1;
                const newL = l + sign * Math.ceil(i / 2) * stepL * 0.8; // Use a factor (0.8) to avoid pure white/black quickly
                colors.push(hslToHex(h, s, Math.max(5, Math.min(95, newL)))); // Clamp lightness
            }
            // Sort by lightness for visual flow
            colors.sort((c1, c2) => hexToHsl(c2)[2] - hexToHsl(c1)[2]);
            break;
        default: // Should not happen with select, but as a fallback
            return [baseHex];
    }
    console.log('Generated colors:', colors);
    return colors;
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
const previewInstructionTextEl = document.getElementById('preview-instruction-text'); // Get the instruction text span
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
const historySwatchesEl = document.getElementById('history-swatches');
const closePaletteButton = document.getElementById('close-palette-button'); // Get mobile close button
const sizeArrowUp = document.querySelector('.number-input-arrows .arrow.up');
const sizeArrowDown = document.querySelector('.number-input-arrows .arrow.down');


// State Variables
const DEFAULT_COLOR = '#3b82f6'; // A nice starting blue
let currentHex = DEFAULT_COLOR; // The currently SELECTED color (via click, slider, history, load)
let currentHSL = hexToHsl(DEFAULT_COLOR);
const HISTORY_MAX_SIZE = 7;
let colorHistory = [];
let currentPalette = []; // Store the currently displayed palette

// Local Storage Keys
const LS_KEY_BASE_COLOR = 'paletteMakerBaseColor';
const LS_KEY_HISTORY = 'paletteMakerHistory';
const LS_KEY_PALETTE = 'paletteMakerPalette';

// Function to update the preview area with current color info and instruction visibility
// Called whenever currentHex or currentHSL changes (by selection or hover)
function updatePreview(hexColor, showInstruction = false) {
    const { r, g, b } = hexToRgb(hexColor);
    const [h, s, l] = hexToHsl(hexColor);
    previewEl.style.background = hexColor;

    // Keep color format text (Hex, RGB, HSL) black
    previewTextHexEl.style.color = '#1f2937';
    previewTextRgbEl.style.color = '#1f2937';
    previewTextHslEl.style.color = '#1f2937';

    previewTextHexEl.textContent = hexColor.toUpperCase();
    previewTextRgbEl.textContent = rgbToString(r, g, b);
    previewTextHslEl.textContent = hslToString(h, s, l);

    // Control instruction visibility and color
    // Check if not on a mobile screen based on media query breakpoint (handled by CSS display: none)
    // JS will just toggle 'display: block' or 'none', CSS media query overrides 'block' on mobile
    if (showInstruction) {
        // Only show instruction if the screen is not considered mobile by the CSS media query
         if (window.matchMedia("(min-width: 769px)").matches) {
            previewInstructionTextEl.style.display = 'block';
            previewInstructionTextEl.style.color = getTextColor(hexColor); // Set instruction color dynamically
         } else {
             previewInstructionTextEl.style.display = 'none';
         }
    } else {
        previewInstructionTextEl.style.display = 'none';
    }
}

// Function to update the HSL sliders and their value spans
// Called whenever currentHSL changes (by selection)
function updateSliders(h, s, l) {
    // Ensure values are within bounds before setting slider
    hueSlider.value = Math.max(0, Math.min(360, h));
    saturationSlider.value = Math.max(0, Math.min(100, s));
    lightnessSlider.value = Math.max(0, Math.min(100, l));
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
        swatch.setAttribute('role', 'button'); // Indicate it's interactive
        swatch.setAttribute('aria-label', `Select color ${hex.toUpperCase()}`); // Accessibility label
        swatch.addEventListener('click', () => {
            selectColor(hex); // Select this color
            addToHistory(hex); // Add back to history (moves it to front)
            lockPreview(); // Lock preview when selecting from history
            updatePreview(currentHex, true); // Show instruction after selecting from history
        });
        swatch.addEventListener('keydown', (event) => {
            // Allow Enter or Space to trigger click
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                swatch.click();
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

// Function to select a color and update all relevant UI parts and state
// This is the single point of truth for changing the primary selected color
function selectColor(hexColor) {
    currentHex = hexColor;
    currentHSL = hexToHsl(currentHex); // Update HSL state from Hex
    updatePreview(currentHex); // Update preview display (instruction hidden by default in updatePreview)
    updateSliders(currentHSL[0], currentHSL[1], currentHSL[2]);
    // Removed previewEl.classList.add('locked') from here
    saveState(); // Save selected color to local storage
}

// Function to lock the preview state
function lockPreview() {
    previewEl.classList.add('locked');
}

// Function to reset the color selection state (unlock preview and hide instruction)
function resetColorSelection() {
    previewEl.classList.remove('locked');
    updatePreview(currentHex, false); // Hide instruction
    // Keep the last selected color and its state (currentHex, currentHSL, sliders)
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
        // Load base color first
        if (savedBaseColor && savedBaseColor.startsWith('#')) {
            selectColor(savedBaseColor); // This updates preview and sliders, hides instruction
        } else {
            selectColor(DEFAULT_COLOR); // Fallback to default, hides instruction
        }
        // Load history
        if (savedHistory) {
            colorHistory = JSON.parse(savedHistory);
            renderHistory();
        }
        // Load palette
        if (savedPalette) {
            currentPalette = JSON.parse(savedPalette);
            displayPalette(currentPalette, false); // Display saved palette without animation
        }
        // On load, the preview should not be locked initially, and instructions hidden
        resetColorSelection();
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
        resetColorSelection(); // Ensure not locked on failed load, hides instruction
    }
}

// Function to display the generated palette
function displayPalette(colors, animate = true) {
    console.log('Attempting to display palette:', colors);
    if (!colors || colors.length === 0) {
        console.log('No colors to display.');
        paletteEl.style.display = 'none';
        currentPalette = [];
        // Hide instruction when palette is hidden
        updatePreview(currentHex, false); // Hide instruction in preview
        saveState();
        return;
    }

    currentPalette = [...colors]; // Store a copy of the displayed palette array
    paletteEl.innerHTML = ''; // Clear previous content
    // Re-append the mobile close button
    paletteEl.appendChild(closePaletteButton);

    // Show palette and hide instruction in preview
    paletteEl.style.display = 'flex';
    updatePreview(currentHex, false); // Hide instruction in preview


    // Create and append the color bars
    currentPalette.forEach((color, i) => { // Use currentPalette state array
        const { r, g, b } = hexToRgb(color);
        const [h, s, l] = hexToHsl(color);
        const textColor = getTextColor(color); // Keep this for palette bar text color
        const glowColor = getGlowColor(color);
        const bar = document.createElement('div');
        bar.className = 'palette-bar';
        bar.style.background = color;
        bar.style.color = textColor; // Set text color based on luminance for contrast
        bar.setAttribute('data-color', color); // Store hex on the element
        bar.setAttribute('tabindex', '0'); // Make bar focusable
        bar.setAttribute('role', 'button'); // Indicate it's interactive
        bar.style.setProperty('--glow-color', glowColor); // Set CSS variable for glow color
        // Container for color formats text (for fading)
        const colorInfoDiv = document.createElement('div');
        colorInfoDiv.className = 'color-info';
        bar.appendChild(colorInfoDiv);
        // Add color formats spans inside the info container
        const hexSpan = document.createElement('span');
        hexSpan.textContent = color.toUpperCase();
        // hexSpan.style.color = textColor; // Color is inherited from parent
        colorInfoDiv.appendChild(hexSpan);
        const rgbSpan = document.createElement('span');
        rgbSpan.textContent = rgbToString(r, g, b);
        // rgbSpan.style.color = textColor; // Color is inherited from parent
        colorInfoDiv.appendChild(rgbSpan);
        const hslSpan = document.createElement('span');
        hslSpan.textContent = hslToString(h, s, l);
        // hslSpan.style.color = textColor; // Color is inherited from parent
        colorInfoDiv.appendChild(hslSpan);
        // Store original text HTML for fading back
        bar.originalInfoHTML = colorInfoDiv.innerHTML; // Store original HTML
        // Add Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-color';
        removeButton.textContent = 'X';
        removeButton.title = `Remove ${color.toUpperCase()}`;
        removeButton.setAttribute('aria-label', `Remove color ${color.toUpperCase()} from palette`);
        // Set remove button color based on background luminance
        removeButton.style.color = getTextColor(color); // Set color dynamically
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click event from bubbling to the bar
            removeColorFromPalette(color); // Pass the hex color to be removed
        });
        bar.appendChild(removeButton);
        // Add click listener to copy color
        bar.addEventListener('click', async () => {
            const colorToCopy = bar.getAttribute('data-color');
            const success = await copyToClipboard(colorToCopy);
            if (success) {
                // Handle copy animation and text fade
                const info = bar.querySelector('.color-info');
                const originalHTML = info.innerHTML; // Retrieve stored HTML
                 info.classList.add('fade-out'); // Start fade out original text
                setTimeout(() => {
                    // Change text content to "Copied!"
                    // Ensure the copied text color is based on the bar's background for readability
                     const currentBarTextColor = bar.style.color;
                    info.innerHTML = `<span style="color: ${currentBarTextColor}; background: none; padding: 0;">Copied!</span>`; // Add "Copied!" text
                    info.classList.remove('fade-out');
                    info.classList.add('fade-in'); // Fade in "Copied!" text
                    bar.classList.add('copied'); // Start glow animation
                    // Wait for glow animation and "Copied!" to show, then fade back
                    setTimeout(() => {
                        info.classList.remove('fade-in');
                        info.classList.add('fade-out');
                        setTimeout(() => {
                            // Revert text back to original color info
                            info.innerHTML = originalHTML;
                             // Reapply text color to spans after resetting innerHTML (inherits from bar)
                             info.querySelectorAll('span').forEach(span => span.style.color = bar.style.color);
                            info.classList.remove('fade-out');
                            bar.classList.remove('copied'); // Remove glow class
                        }, 300); // Match fade-out duration
                    }, 700); // Wait for a moment after "Copied!" fades in and glow starts
                }, 300); // Match fade-out duration
            }
        });
        paletteEl.appendChild(bar); // Append color bar
        // Staggered animation for showing bars
        if (animate) {
            requestAnimationFrame(() => {
                setTimeout(() => bar.classList.add('show'), i * 60); // Slightly faster animation
            });
        } else {
            bar.classList.add('show'); // Show instantly if not animating
        }
    });

    console.log('Palette displayed.');
    saveState(); // Save the displayed palette
}

// Function to remove a color from the current palette
function removeColorFromPalette(hexColor) {
    console.log("Attempting to remove color:", hexColor);
    // Find the index of the FIRST occurrence of the color in the array state
    const indexToRemove = currentPalette.findIndex(color => color.toLowerCase() === hexColor.toLowerCase());

    if (indexToRemove !== -1) {
        // Use splice to remove only that element at the found index
        currentPalette.splice(indexToRemove, 1);
        console.log("Color removed. New palette:", currentPalette);
        // Re-display the palette from the updated array state
        displayPalette(currentPalette, false); // No animation on removal update

        // If the palette is empty after removal, hide it
        if (currentPalette.length === 0) {
            console.log("Palette is empty, hiding.");
            paletteEl.style.display = 'none';
            // Hide instruction when palette is hidden
            updatePreview(currentHex, false); // Hide instruction in preview
            resetColorSelection(); // Reset selection state indicators if palette is closed
        }
        saveState(); // Save updated palette
    } else {
        console.log("Color not found in palette:", hexColor);
        // This case should theoretically not happen if the remove button is within a palette bar
    }
}

// --- Event Listeners ---
// Event Listener: Load state when DOM is ready
document.addEventListener('DOMContentLoaded', loadState);

// Event Listener: Gradient Mouse Move (for hover preview)
gradientEl.addEventListener('mousemove', e => {
    // Only show temporary hover preview if a color is NOT locked (selected)
    if (previewEl.classList.contains('locked')) {
        return;
    }
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));
    const { h, s, l } = getHSLAtPosition(x, y, rect.width, rect.height);
    const hoverHex = hslToHex(h, s, l);
    const { r, g, b } = hexToRgb(hoverHex);

    // Update preview element styles and text content directly (temporary)
    // Do NOT show instruction on hover
    updatePreview(hoverHex, false);
    // Do NOT update currentHex, currentHSL, or sliders here
});

// Event Listener: Gradient Mouse Leave (reset preview if not locked)
gradientEl.addEventListener('mouseleave', () => {
    // If a color is not locked, revert the preview to the current selected color state
    if (!previewEl.classList.contains('locked')) {
        // Revert preview using the actual state, hide instruction
        updatePreview(currentHex, false);
        // Also ensure sliders reflect the actual state color
        updateSliders(currentHSL[0], currentHSL[1], currentHSL[2]);
    }
    // If it *is* locked, do nothing on mouseleave, preview stays on the locked color
});

// Event Listener: Gradient Click (to select/lock color)
gradientEl.addEventListener('click', e => {
    const rect = gradientEl.getBoundingClientRect();
    let x = e.clientX - rect.left; let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width)); y = Math.max(0, Math.min(y, rect.height));
    const { h, s, l } = getHSLAtPosition(x, y, rect.width, rect.height);
    const clickedHex = hslToHex(h, s, l);
    selectColor(clickedHex); // Select the color (updates state, preview, sliders)
    addToHistory(clickedHex); // Add to history
    lockPreview(); // Lock preview when a color is clicked
    updatePreview(currentHex, true); // Show instruction after selecting
});

// Event Listeners for HSL sliders
hueSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex; // Update currentHex state
    currentHSL = [h, s, l]; // Update currentHSL state
    updatePreview(newHex, false); // Update preview display, hide instruction
    hueValueSpan.textContent = Math.round(h); // Update slider value display
    resetColorSelection(); // Unlock preview state and hide instruction
    saveState(); // Save selection
});

saturationSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex;
    currentHSL = [h, s, l];
    updatePreview(newHex, false); // Hide instruction
    saturationValueSpan.textContent = Math.round(s);
    resetColorSelection(); // Unlock preview state and hide instruction
    saveState();
});

lightnessSlider.addEventListener('input', () => {
    const h = parseFloat(hueSlider.value);
    const s = parseFloat(saturationSlider.value);
    const l = parseFloat(lightnessSlider.value);
    const newHex = hslToHex(h, s, l);
    currentHex = newHex;
    currentHSL = [h, s, l];
    updatePreview(newHex, false); // Hide instruction
    lightnessValueSpan.textContent = Math.round(l);
    resetColorSelection(); // Unlock preview state and hide instruction
    saveState();
});


// Event Listener: Clamp palette size value on input (handles paste or edge cases) - KEPT FOR MANUAL INPUT/PASTE
paletteSizeInput.addEventListener('input', () => {
    let value = parseInt(paletteSizeInput.value, 10);
    const min = parseInt(paletteSizeInput.min, 10);
    const max = parseInt(paletteSizeInput.max, 10);
    if (isNaN(value)) {
        paletteSizeInput.value = min; // Default to min if input is not a number
    } else if (value < min) {
        paletteSizeInput.value = min;
    } else if (value > max) {
        paletteSizeInput.value = max;
    }
    // Ensure value is an integer if manually typed
    paletteSizeInput.value = Math.round(parseFloat(paletteSizeInput.value));
});

// Event Listeners for physical arrows on palette size input
sizeArrowUp.addEventListener('click', () => {
    let currentValue = parseInt(paletteSizeInput.value, 10);
    const max = parseInt(paletteSizeInput.max, 10);
    if (isNaN(currentValue)) currentValue = parseInt(paletteSizeInput.min, 10) -1; // Handle empty or invalid
    if (currentValue < max) {
        paletteSizeInput.value = currentValue + 1;
         paletteSizeInput.dispatchEvent(new Event('input')); // Trigger input event for clamping/validation
    }
});

sizeArrowDown.addEventListener('click', () => {
    let currentValue = parseInt(paletteSizeInput.value, 10);
    const min = parseInt(paletteSizeInput.min, 10);
     if (isNaN(currentValue)) currentValue = parseInt(paletteSizeInput.max, 10) + 1; // Handle empty or invalid
    if (currentValue > min) {
        paletteSizeInput.value = currentValue - 1;
         paletteSizeInput.dispatchEvent(new Event('input')); // Trigger input event for clamping/validation
    }
});


// Event Listener: "Generate Palette" Button Click
generateButton.addEventListener('click', () => {
    console.log('Generate button clicked.');
    const selectedRule = harmonyRuleSelect.value;
    const paletteSize = parseInt(paletteSizeInput.value, 10);
    console.log('Rule:', selectedRule, 'Size:', paletteSize);

    // Re-validate size just in case
    if (isNaN(paletteSize) || paletteSize < 2 || paletteSize > 10) {
        console.error("Invalid palette size:", paletteSize);
         alert(`Please select a palette size between ${paletteSizeInput.min} and ${paletteSizeInput.max}.`);
        return;
    }

    const colors = generatePalette(currentHex, selectedRule, paletteSize);
    console.log('Palette generated:', colors);
    displayPalette(colors); // This function now handles showing the palette and hiding instruction in preview
    addToHistory(currentHex); // Add the base color to history when palette is generated
    lockPreview(); // Keep preview locked when generating a palette
});

// Event Listener: "Export Palette" Button Click
exportButton.addEventListener('click', () => {
    if (currentPalette.length === 0) {
        alert('Generate a palette first!'); // Simple alert for now
        return;
    }
    const paletteText = currentPalette.join('\n'); // Join colors with newlines
    const blob = new Blob([paletteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color_palette.txt';
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Clean up the URL object
});

// Event Listener: Keyboard Press (for ESC key to close palette or resume hover)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
      if (paletteEl.style.display === 'flex') {
            // If palette is open, close it and reset selection
            paletteEl.style.display = 'none';
            resetColorSelection(); // Unlock preview and hide instruction in preview
             saveState(); // Save state (this will clear the saved palette in LS if it's hidden)
      } else if (previewEl.classList.contains('locked')) {
            // If preview is locked (color selected in main view), reset selection
            resetColorSelection(); // Unlock preview and hide instruction in preview
            // No need to saveState here as no new color is selected or palette generated/closed
      }
  }
});

// Event Listener for Mobile Close Button
closePaletteButton.addEventListener('click', () => {
    if (paletteEl.style.display === 'flex') {
        paletteEl.style.display = 'none';
        resetColorSelection(); // Unlock preview and hide instruction in preview
        saveState(); // Save state
    }
});


// Ensure instruction is hidden on initial load
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updatePreview(currentHex, false); // Ensure instruction is hidden on load
});
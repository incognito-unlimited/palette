# palette

A simple and interactive web tool for generating color palettes based on a selected base color and various harmony rules. Pick a color from the gradient or adjust it using HSL sliders, view your color history, generate palettes, copy colors, and export palettes as CSS variables.

Deployed on GitHub Pages: **[https://incognito-unlimited.github.io/palette/]**

## Features

* **Color Picking:** Select a base color directly from a visual HSL gradient (simulated).
* **HSL Adjustment:** Fine-tune the selected color using Hue, Saturation, and Lightness sliders.
* **Color History:** Keep track of recently selected base colors. Supports up to 8 colors on mobile devices and 7 on larger screens.
* **Harmony Rules:** Generate palettes using standard color harmony principles:
    * Complementary
    * Analogous
    * Triadic
    * Monochromatic
* **Palette Size:** Choose the number of colors in your generated palette (from 2 to 10).
* **Interactive Palette Display:** View the generated palette in a fullscreen overlay with smooth transitions. Includes an instruction message at the bottom ("Press Esc to choose another color or export palette as CSS").
* **Copy Color:** Click on any color swatch in the palette to copy its HEX value to the clipboard with visual feedback.
* **Remove Color:** Easily remove individual colors from the generated palette while in the overlay view.
* **Export Palette (CSS):** Download the generated palette as CSS variables (`.css` file). The exported palette is based on the currently selected harmony rule and size.
* **Responsive Design:** Optimized layout and history size for both desktop and mobile devices.
* **Animated Background:** Dynamic background gradient and animated geometric shapes add visual interest. (Geometric shapes are hidden on smaller screens for performance).
* **Local Storage:** Saves your last selected color, history, and generated palette (if displayed) in your browser's local storage.

## How to Use

1.  **Pick a Base Color:**
    * Click anywhere on the large color gradient box to select a base color. The preview box will show the selected color's HEX, RGB, and HSL values.
    * Alternatively, adjust the HSL sliders to fine-tune your desired base color.
    * Use the history swatches below the controls to quickly select a previously used base color.
2.  **Select Harmony Rule and Size:**
    * Choose a harmony rule (Complementary, Analogous, Triadic, Monochromatic) from the "Harmony" dropdown.
    * Enter or use the arrows to select the desired "Size" (number of colors) for your palette.
3.  **Generate Palette:**
    * Click the "Generate Palette" button. A fullscreen overlay will display the generated colors.
4.  **Interact with the Palette:**
    * Click on any color bar to copy its HEX code to your clipboard. A "Copied!" message and subtle glow will appear.
    * Hovering over a color bar (or tapping on mobile) will reveal a small "X" button. Click this to remove the color from the current palette view.
    * **Press `Esc`** on your keyboard or click the "X" button in the top right corner (on mobile) to close the palette view and return to the controls.
5.  **Export Palette (CSS):**
    * Click the "Export Palette (CSS)" button. This will generate a palette based on your current options and download a `.css` file containing the colors as CSS variables. The palette overlay will *not* open when you use this export button.

## Technologies Used

* HTML5
* CSS3
* JavaScript (Vanilla JS)

## Contributing

If you have suggestions for improvements or find issues, feel free to open an issue or submit a pull request on the GitHub repository.

## License

This project is open source and available under the MIT License.

/**
 * Simple icon creator - creates data URLs as PNG placeholders
 * This creates basic icon files without external dependencies
 */

import fs from 'fs/promises';

// Simple function to create a colored square PNG (base64 encoded minimal PNG)
function createSimplePNG(size, color = '#2E5266', text = 'R') {
  // For now, we'll just copy the SVG for all sizes
  // In production, you'd want proper PNG files
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}"/>
  <text x="${size/2}" y="${size/2 + size/4}" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${text}</text>
</svg>`;
  
  return svg;
}

async function generateIcons() {
  console.log('Generating PWA icon placeholders...');
  
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  await fs.mkdir('public/icons', { recursive: true });
  
  for (const size of sizes) {
    const svg = createSimplePNG(size);
    const path = `public/icons/icon-${size}x${size}.svg`;
    await fs.writeFile(path, svg);
    console.log(`✓ Created ${path}`);
  }
  
  console.log('\n✅ Icon placeholders generated!');
  console.log('Note: These are SVG placeholders. For production, use PNG files.');
  console.log('Convert them using ImageMagick or an online tool like:');
  console.log('https://www.pwabuilder.com/imageGenerator');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateIcons().catch(console.error);
}

export { generateIcons };

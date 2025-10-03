import fs from 'fs/promises';
import { createCanvas } from 'canvas';

/**
 * Generate placeholder images for icons and book covers
 * This is a fallback for users without ImageMagick
 * Requires: npm install canvas
 */

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#2E5266';
    ctx.fillRect(0, 0, size, size);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(size * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R', size / 2, size / 2);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    const path = `public/icons/icon-${size}x${size}.png`;
    await fs.writeFile(path, buffer);
    console.log(`✓ Created ${path}`);
  }
}

async function generateBookCover() {
  console.log('Generating Frankenstein book cover...');
  
  const canvas = createCanvas(600, 900);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, 600, 900);
  
  // Title
  ctx.fillStyle = '#E8E8E8';
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Frankenstein', 300, 250);
  
  // Subtitle
  ctx.fillStyle = '#B0B0B0';
  ctx.font = 'italic 32px serif';
  ctx.fillText('or, The Modern Prometheus', 300, 320);
  
  // Author
  ctx.font = '42px serif';
  ctx.fillText('Mary Shelley', 300, 500);
  
  // Year
  ctx.fillStyle = '#8B7355';
  ctx.font = '28px serif';
  ctx.fillText('1818', 300, 750);
  
  // Save
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
  await fs.writeFile('public/images/covers/frankenstein.jpg', buffer);
  console.log('✓ Created public/images/covers/frankenstein.jpg');
}

async function main() {
  try {
    // Create directories
    await fs.mkdir('public/icons', { recursive: true });
    await fs.mkdir('public/images/covers', { recursive: true });
    
    await generateIcons();
    await generateBookCover();
    
    console.log('\n✅ All placeholder images generated!');
    console.log('\nNote: These are basic placeholders.');
    console.log('For production, replace with professional images.');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: canvas module not found');
      console.error('Install it with: npm install canvas');
      console.error('\nOr use ImageMagick with setup.sh instead');
    } else {
      console.error('Error:', error);
    }
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { generateIcons, generateBookCover };

#!/bin/bash

# Setup script for Classics Retold PWA
# This script helps you set up the necessary assets

echo "🚀 Setting up Classics Retold PWA..."
echo ""

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "✓ ImageMagick found"
    HAS_IMAGEMAGICK=true
else
    echo "⚠ ImageMagick not found (optional for auto-generating images)"
    HAS_IMAGEMAGICK=false
fi

# Create directories
echo ""
echo "📁 Creating directories..."
mkdir -p public/icons
mkdir -p public/images/covers
echo "✓ Directories created"

# Generate PWA icons if ImageMagick is available
if [ "$HAS_IMAGEMAGICK" = true ]; then
    echo ""
    echo "🎨 Generating PWA icons..."
    
    cd public/icons
    
    # Create base icon
    convert -size 512x512 xc:"#2E5266" \
        -pointsize 200 -fill white -gravity center \
        -font "Liberation-Sans-Bold" -annotate +0+0 "R" \
        icon-512x512.png
    
    # Generate all required sizes
    for size in 72 96 128 144 152 192 384; do
        convert icon-512x512.png -resize ${size}x${size} icon-${size}x${size}.png
        echo "  ✓ Created icon-${size}x${size}.png"
    done
    
    cd ../..
    echo "✓ All PWA icons generated"
fi

# Generate placeholder book cover if ImageMagick is available
if [ "$HAS_IMAGEMAGICK" = true ]; then
    echo ""
    echo "📚 Generating placeholder book cover..."
    
    convert -size 600x900 xc:"#1A1A1A" \
        -pointsize 80 -fill "#E8E8E8" -gravity north \
        -font "Liberation-Serif-Bold" -annotate +0+200 "Frankenstein" \
        -pointsize 40 -fill "#B0B0B0" -gravity center \
        -annotate +0-50 "or, The Modern Prometheus" \
        -pointsize 50 -fill "#B0B0B0" \
        -annotate +0+50 "Mary Shelley" \
        -pointsize 30 -fill "#8B7355" -gravity south \
        -annotate +0+100 "1818" \
        public/images/covers/frankenstein.jpg
    
    echo "✓ Placeholder cover created at public/images/covers/frankenstein.jpg"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start development server"
echo "  2. (Optional) Replace placeholder book cover with actual cover"
echo "  3. (Optional) Add more books following the README"
echo ""
echo "To add actual book covers and custom icons:"
echo "  - Place book covers in public/images/covers/"
echo "  - Place custom icons in public/icons/"
echo ""

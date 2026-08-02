import sys
from PIL import Image, ImageDraw, ImageFont

def main():
    try:
        img = Image.open('public/icon-512-backup.png')
        img = img.convert('RGBA')
        
        draw = ImageDraw.Draw(img)
        
        # Try to load Arial font
        try:
            font = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', 32)
        except IOError:
            font = ImageFont.load_default()
            
        text = "...םינותנ ןעוט" # Reversed "טוען נתונים..."
        
        # Get text size
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        
        W, H = img.size
        
        # Calculate position (bottom center)
        x = (W - w) / 2
        y = H - h - 40 # 40px from bottom
        
        # Draw text (white with grey outline for visibility)
        draw.text((x-1, y-1), text, font=font, fill=(100, 100, 100, 255))
        draw.text((x+1, y-1), text, font=font, fill=(100, 100, 100, 255))
        draw.text((x-1, y+1), text, font=font, fill=(100, 100, 100, 255))
        draw.text((x+1, y+1), text, font=font, fill=(100, 100, 100, 255))
        draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
        
        img.save('public/icon-512.png')
        print("Successfully updated icon-512.png")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

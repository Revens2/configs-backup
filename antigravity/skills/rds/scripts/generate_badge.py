import os
import sys
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

def generate_badge(date_str=None, output_dir=None):
    if not date_str:
        date_str = datetime.now().strftime("%d/%m") # e.g. "04/08"
    
    today_folder_name = datetime.now().strftime("%d-%m-%y") # e.g. "04-08-26"
    
    if not output_dir:
        output_dir = os.path.join(r"C:\Users\Juliann\Documents\Fait", today_folder_name)
    
    os.makedirs(output_dir, exist_ok=True)
    
    badge_path = os.path.join(output_dir, f"badge_{date_str.replace('/', '')}.png")
    
    if os.path.exists(badge_path):
        print(f"EXISTING_BADGE:{badge_path}")
        return badge_path
        
    # Dimensions matching original Google Slides shape
    width = 240
    height = 150
    
    # Create image with green background (#9ebf74 / #93c47d)
    bg_color = (158, 191, 116) # #9ebf74
    border_color = (80, 80, 80) # #505050
    text_color = (15, 15, 15)   # #0f0f0f
    
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([0, 0, width - 1, height - 1], outline=border_color, width=2)
    
    # Load font
    font_size = 26
    font = None
    possible_fonts = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf"
    ]
    for font_path in possible_fonts:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except Exception:
                pass
    if not font:
        font = ImageFont.load_default()
        
    lines = ["JP", "Fait", date_str]
    
    # Calculate vertical spacing
    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        line_widths.append(w)
        line_heights.append(h)
        
    line_spacing = 8
    total_height = sum(line_heights) + line_spacing * (len(lines) - 1)
    
    start_y = (height - total_height) / 2 - 4
    
    current_y = start_y
    for i, line in enumerate(lines):
        w = line_widths[i]
        x = (width - w) / 2
        draw.text((x, current_y), line, fill=text_color, font=font)
        current_y += line_heights[i] + line_spacing
        
    img.save(badge_path, "PNG")
    print(f"GENERATED_BADGE:{badge_path}")
    return badge_path

if __name__ == "__main__":
    date_arg = sys.argv[1] if len(sys.argv) > 1 else None
    generate_badge(date_arg)

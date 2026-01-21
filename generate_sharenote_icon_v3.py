"""
ShareNote 앱 아이콘 v3
- 다크 배경
- 문서 + 말풍선이 결합된 디자인
"""
from PIL import Image, ImageDraw
import os

ICON_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

def create_sharenote_icon_v3(size):
    """
    ShareNote 아이콘 v3
    - 다크 그라데이션 배경 (#1a1a2e → #16213e)
    - 문서에 말풍선이 붙은 디자인
    """
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 다크 그라데이션 배경 (원형)
    center = canvas_size / 2
    max_radius = canvas_size / 2

    for i in range(200):
        progress = i / 200
        # 검은색 그라데이션 (#0a0a0a → #1a1a1a)
        r = int(10 + (26 - 10) * progress)
        g = int(10 + (26 - 10) * progress)
        b = int(10 + (26 - 10) * progress)

        radius = max_radius * (1 - progress * 0.15)
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(r, g, b, 255)
        )

    # 콘텐츠 영역
    padding = canvas_size * 0.18
    content_size = canvas_size - (padding * 2)

    # 문서 아이콘 (중앙에 크게)
    doc_width = content_size * 0.55
    doc_height = content_size * 0.7
    doc_x = padding + content_size * 0.15
    doc_y = padding + content_size * 0.15
    corner_radius = int(canvas_size * 0.05)

    # 문서 배경 (밝은 색)
    draw.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_width, doc_y + doc_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 문서 상단 헤더 라인 (강조)
    header_height = doc_height * 0.15
    draw.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_width, doc_y + header_height],
        radius=corner_radius,
        fill=(99, 102, 241, 255)  # 인디고 블루
    )

    # 문서 내용 라인들
    line_color = (200, 200, 200, 255)
    line_width = int(canvas_size * 0.01)
    line_spacing = doc_height * 0.12
    line_start_x = doc_x + doc_width * 0.12
    line_end_x = doc_x + doc_width * 0.88

    for i in range(4):
        line_y = doc_y + header_height + doc_height * 0.15 + (i * line_spacing)
        # 마지막 줄은 짧게
        end_x = line_end_x if i < 3 else line_start_x + doc_width * 0.5
        draw.line(
            [line_start_x, line_y, end_x, line_y],
            fill=line_color,
            width=line_width
        )

    # 말풍선 (문서 오른쪽 하단에 붙임)
    bubble_size = content_size * 0.35
    bubble_x = doc_x + doc_width - bubble_size * 0.3
    bubble_y = doc_y + doc_height - bubble_size * 0.5

    # 말풍선 원형
    draw.ellipse(
        [bubble_x, bubble_y, bubble_x + bubble_size, bubble_y + bubble_size],
        fill=(34, 197, 94, 255)  # 그린
    )

    # 말풍선 꼬리 (작게)
    tail_size = bubble_size * 0.25
    tail_points = [
        (bubble_x + bubble_size * 0.2, bubble_y + bubble_size * 0.85),
        (bubble_x + bubble_size * 0.05, bubble_y + bubble_size * 1.1),
        (bubble_x + bubble_size * 0.35, bubble_y + bubble_size * 0.75)
    ]
    draw.polygon(tail_points, fill=(34, 197, 94, 255))

    # 말풍선 내부 점 3개
    dot_size = bubble_size * 0.08
    dot_color = (255, 255, 255, 255)
    bubble_center_y = bubble_y + bubble_size * 0.45

    for i in range(3):
        dot_x = bubble_x + bubble_size * (0.25 + i * 0.25) - dot_size / 2
        draw.ellipse(
            [dot_x, bubble_center_y - dot_size/2,
             dot_x + dot_size, bubble_center_y + dot_size/2],
            fill=dot_color
        )

    # 축소
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

def create_round_icon(square_icon):
    """원형 마스크"""
    size = square_icon.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)

    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(square_icon, (0, 0))
    result.putalpha(mask)
    return result

def create_foreground_icon(size):
    """Adaptive Icon용 foreground"""
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Safe zone
    padding = canvas_size * 0.25
    content_size = canvas_size - (padding * 2)

    # 문서
    doc_width = content_size * 0.55
    doc_height = content_size * 0.7
    doc_x = padding + content_size * 0.15
    doc_y = padding + content_size * 0.15
    corner_radius = int(canvas_size * 0.05)

    draw.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_width, doc_y + doc_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 헤더
    header_height = doc_height * 0.15
    draw.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_width, doc_y + header_height],
        radius=corner_radius,
        fill=(99, 102, 241, 255)
    )

    # 라인
    line_color = (200, 200, 200, 255)
    line_width = int(canvas_size * 0.01)
    line_spacing = doc_height * 0.12
    line_start_x = doc_x + doc_width * 0.12
    line_end_x = doc_x + doc_width * 0.88

    for i in range(4):
        line_y = doc_y + header_height + doc_height * 0.15 + (i * line_spacing)
        end_x = line_end_x if i < 3 else line_start_x + doc_width * 0.5
        draw.line([line_start_x, line_y, end_x, line_y], fill=line_color, width=line_width)

    # 말풍선
    bubble_size = content_size * 0.35
    bubble_x = doc_x + doc_width - bubble_size * 0.3
    bubble_y = doc_y + doc_height - bubble_size * 0.5

    draw.ellipse(
        [bubble_x, bubble_y, bubble_x + bubble_size, bubble_y + bubble_size],
        fill=(34, 197, 94, 255)
    )

    tail_points = [
        (bubble_x + bubble_size * 0.2, bubble_y + bubble_size * 0.85),
        (bubble_x + bubble_size * 0.05, bubble_y + bubble_size * 1.1),
        (bubble_x + bubble_size * 0.35, bubble_y + bubble_size * 0.75)
    ]
    draw.polygon(tail_points, fill=(34, 197, 94, 255))

    dot_size = bubble_size * 0.08
    dot_color = (255, 255, 255, 255)
    bubble_center_y = bubble_y + bubble_size * 0.45

    for i in range(3):
        dot_x = bubble_x + bubble_size * (0.25 + i * 0.25) - dot_size / 2
        draw.ellipse(
            [dot_x, bubble_center_y - dot_size/2,
             dot_x + dot_size, bubble_center_y + dot_size/2],
            fill=dot_color
        )

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

# 아이콘 생성
base_path = r'f:\React test\share-note\android\app\src\main\res'

print('ShareNote app icon v3 generation started...')

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(base_path, folder)

    square_icon = create_sharenote_icon_v3(size)
    square_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')

    round_icon = create_round_icon(square_icon)
    round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

    foreground_icon = create_foreground_icon(size)
    foreground_icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')

print('Icon generation v3 completed!')
print('')
print('Design v3:')
print('- Dark gradient background (dark blue)')
print('- Document with speech bubble attached')
print('- Green bubble represents chat/sharing')
print('- Clean and professional')

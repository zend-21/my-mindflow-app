"""
ShareNote 앱 아이콘 생성 스크립트
참고 이미지의 세련된 디자인을 기반으로 생성
"""
from PIL import Image, ImageDraw, ImageFont
import os

# 아이콘 크기 정의 (Android)
ICON_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

def create_sharenote_icon(size):
    """
    ShareNote 아이콘 생성
    - 검은 배경 (#1a1a1a)
    - 흰색 'S' + 말풍선 디자인
    - 모던하고 미니멀한 스타일
    """
    # 고해상도로 그린 후 축소 (안티앨리어싱)
    scale = 4
    canvas_size = size * scale

    # 이미지 생성 (검은 배경)
    img = Image.new('RGBA', (canvas_size, canvas_size), (26, 26, 26, 255))
    draw = ImageDraw.Draw(img)

    # 패딩 (라운드 아이콘 대비)
    padding = canvas_size * 0.12
    content_size = canvas_size - (padding * 2)

    # 배경 원형 (약간 밝은 검정)
    bg_padding = canvas_size * 0.08
    draw.ellipse(
        [bg_padding, bg_padding, canvas_size - bg_padding, canvas_size - bg_padding],
        fill=(35, 35, 35, 255)
    )

    # 'S' 문자 그리기 (커스텀 디자인)
    # S의 위치와 크기
    s_width = content_size * 0.5
    s_height = content_size * 0.6
    s_x = padding + content_size * 0.15
    s_y = padding + content_size * 0.2

    stroke_width = int(canvas_size * 0.08)

    # S 상단 곡선
    draw.arc(
        [s_x, s_y, s_x + s_width, s_y + s_height * 0.45],
        start=0, end=180,
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    # S 하단 곡선
    draw.arc(
        [s_x, s_y + s_height * 0.55, s_x + s_width, s_y + s_height],
        start=180, end=360,
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    # S 중간 연결선
    mid_y = s_y + s_height * 0.5
    draw.line(
        [s_x + s_width * 0.1, mid_y, s_x + s_width * 0.9, mid_y],
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    # 말풍선 (오른쪽 상단)
    bubble_size = content_size * 0.35
    bubble_x = padding + content_size * 0.55
    bubble_y = padding + content_size * 0.15

    # 말풍선 원형
    draw.ellipse(
        [bubble_x, bubble_y, bubble_x + bubble_size, bubble_y + bubble_size],
        outline=(255, 255, 255, 255),
        width=int(stroke_width * 0.8)
    )

    # 말풍선 꼬리
    tail_points = [
        (bubble_x + bubble_size * 0.7, bubble_y + bubble_size * 0.85),
        (bubble_x + bubble_size * 0.85, bubble_y + bubble_size * 1.1),
        (bubble_x + bubble_size * 0.6, bubble_y + bubble_size * 0.75)
    ]
    draw.polygon(tail_points, fill=(255, 255, 255, 255))

    # 말풍선 내부 점 (메시지 표시)
    dot_size = bubble_size * 0.08
    dot_y = bubble_y + bubble_size * 0.5 - dot_size * 1.5
    for i in range(3):
        dot_x = bubble_x + bubble_size * (0.25 + i * 0.25) - dot_size / 2
        draw.ellipse(
            [dot_x, dot_y, dot_x + dot_size, dot_y + dot_size],
            fill=(255, 255, 255, 255)
        )

    # 고해상도에서 목표 크기로 축소 (안티앨리어싱)
    img = img.resize((size, size), Image.Resampling.LANCZOS)

    return img

def create_round_icon(square_icon):
    """정사각형 아이콘을 원형으로 만들기"""
    size = square_icon.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)

    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(square_icon, (0, 0))
    result.putalpha(mask)

    return result

def create_foreground_icon(size):
    """
    Adaptive Icon용 foreground
    배경 투명, 로고만
    """
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Safe zone for adaptive icons (중앙 66%)
    padding = canvas_size * 0.25
    content_size = canvas_size - (padding * 2)

    # S 그리기
    s_width = content_size * 0.5
    s_height = content_size * 0.6
    s_x = padding + content_size * 0.15
    s_y = padding + content_size * 0.2

    stroke_width = int(canvas_size * 0.08)

    draw.arc(
        [s_x, s_y, s_x + s_width, s_y + s_height * 0.45],
        start=0, end=180,
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    draw.arc(
        [s_x, s_y + s_height * 0.55, s_x + s_width, s_y + s_height],
        start=180, end=360,
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    mid_y = s_y + s_height * 0.5
    draw.line(
        [s_x + s_width * 0.1, mid_y, s_x + s_width * 0.9, mid_y],
        fill=(255, 255, 255, 255),
        width=stroke_width
    )

    # 말풍선
    bubble_size = content_size * 0.35
    bubble_x = padding + content_size * 0.55
    bubble_y = padding + content_size * 0.15

    draw.ellipse(
        [bubble_x, bubble_y, bubble_x + bubble_size, bubble_y + bubble_size],
        outline=(255, 255, 255, 255),
        width=int(stroke_width * 0.8)
    )

    tail_points = [
        (bubble_x + bubble_size * 0.7, bubble_y + bubble_size * 0.85),
        (bubble_x + bubble_size * 0.85, bubble_y + bubble_size * 1.1),
        (bubble_x + bubble_size * 0.6, bubble_y + bubble_y + bubble_size * 0.75)
    ]
    draw.polygon(tail_points, fill=(255, 255, 255, 255))

    dot_size = bubble_size * 0.08
    dot_y = bubble_y + bubble_size * 0.5 - dot_size * 1.5
    for i in range(3):
        dot_x = bubble_x + bubble_size * (0.25 + i * 0.25) - dot_size / 2
        draw.ellipse(
            [dot_x, dot_y, dot_x + dot_size, dot_y + dot_size],
            fill=(255, 255, 255, 255)
        )

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

# 아이콘 생성
base_path = r'f:\React test\share-note\android\app\src\main\res'

print('ShareNote app icon generation started...')

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(base_path, folder)

    # ic_launcher.png (정사각형)
    square_icon = create_sharenote_icon(size)
    square_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')

    # ic_launcher_round.png (원형)
    round_icon = create_round_icon(square_icon)
    round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

    # ic_launcher_foreground.png (Adaptive Icon용)
    foreground_icon = create_foreground_icon(size)
    foreground_icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')

print('Icon generation completed!')

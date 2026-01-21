"""
ShareNote 완전히 새로운 아이콘
- 추상적이고 모던한 디자인
- 공유와 연결을 상징하는 기하학적 패턴
- 트렌디한 컬러 조합
"""
from PIL import Image, ImageDraw
import math
import os

ICON_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

def create_fresh_icon(size):
    """
    완전히 새로운 ShareNote 아이콘
    - 세련된 그라데이션 배경 (민트-틸 블루)
    - 추상적인 연결 패턴 (겹치는 원형들)
    - 미니멀하고 모던한 느낌
    """
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 세련된 그라데이션 배경 (민트 블루 → 딥 틸)
    center = canvas_size / 2
    max_radius = canvas_size / 2

    for i in range(200):
        progress = i / 200
        # 민트 블루(#06B6D4) → 딥 틸(#0891B2) 그라데이션
        r = int(6 + (8 - 6) * progress)
        g = int(182 + (145 - 182) * progress)
        b = int(212 + (178 - 212) * progress)

        radius = max_radius * (1 - progress * 0.15)
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(r, g, b, 255)
        )

    # 콘텐츠 영역
    padding = canvas_size * 0.25
    content_size = canvas_size - (padding * 2)

    # 추상적인 공유 패턴 - 3개의 겹치는 원
    # 원들이 서로 연결되어 공유와 협업을 상징

    circle_radius = content_size * 0.25

    # 원 1 - 왼쪽 (화이트)
    c1_x = padding + content_size * 0.3
    c1_y = center
    draw.ellipse(
        [c1_x - circle_radius, c1_y - circle_radius,
         c1_x + circle_radius, c1_y + circle_radius],
        fill=(255, 255, 255, 220)
    )

    # 원 2 - 오른쪽 위 (옐로우/골드)
    c2_x = padding + content_size * 0.7
    c2_y = padding + content_size * 0.35
    draw.ellipse(
        [c2_x - circle_radius, c2_y - circle_radius,
         c2_x + circle_radius, c2_y + circle_radius],
        fill=(251, 191, 36, 220)  # amber-400
    )

    # 원 3 - 오른쪽 아래 (핑크/로즈)
    c3_x = padding + content_size * 0.7
    c3_y = padding + content_size * 0.65
    draw.ellipse(
        [c3_x - circle_radius, c3_y - circle_radius,
         c3_x + circle_radius, c3_y + circle_radius],
        fill=(251, 113, 133, 220)  # rose-400
    )

    # 중앙 연결 포인트 - 작은 화이트 원
    center_dot_radius = circle_radius * 0.35
    center_dot_x = padding + content_size * 0.52
    center_dot_y = center

    draw.ellipse(
        [center_dot_x - center_dot_radius, center_dot_y - center_dot_radius,
         center_dot_x + center_dot_radius, center_dot_y + center_dot_radius],
        fill=(255, 255, 255, 255)
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
    padding = canvas_size * 0.30
    content_size = canvas_size - (padding * 2)
    center = canvas_size / 2

    # 동일한 패턴
    circle_radius = content_size * 0.25

    # 원 1
    c1_x = padding + content_size * 0.3
    c1_y = center
    draw.ellipse(
        [c1_x - circle_radius, c1_y - circle_radius,
         c1_x + circle_radius, c1_y + circle_radius],
        fill=(255, 255, 255, 220)
    )

    # 원 2
    c2_x = padding + content_size * 0.7
    c2_y = padding + content_size * 0.35
    draw.ellipse(
        [c2_x - circle_radius, c2_y - circle_radius,
         c2_x + circle_radius, c2_y + circle_radius],
        fill=(251, 191, 36, 220)
    )

    # 원 3
    c3_x = padding + content_size * 0.7
    c3_y = padding + content_size * 0.65
    draw.ellipse(
        [c3_x - circle_radius, c3_y - circle_radius,
         c3_x + circle_radius, c3_y + circle_radius],
        fill=(251, 113, 133, 220)
    )

    # 중앙 포인트
    center_dot_radius = circle_radius * 0.35
    center_dot_x = padding + content_size * 0.52
    center_dot_y = center

    draw.ellipse(
        [center_dot_x - center_dot_radius, center_dot_y - center_dot_radius,
         center_dot_x + center_dot_radius, center_dot_y + center_dot_radius],
        fill=(255, 255, 255, 255)
    )

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

# 아이콘 생성
base_path = r'f:\React test\share-note\android\app\src\main\res'

print('Fresh ShareNote icon generation started...')

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(base_path, folder)

    square_icon = create_fresh_icon(size)
    square_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')

    round_icon = create_round_icon(square_icon)
    round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

    foreground_icon = create_foreground_icon(size)
    foreground_icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')

print('\nFresh icon generation completed!')
print('')
print('Design Features:')
print('- Modern mint-teal gradient background')
print('- Abstract overlapping circles pattern')
print('- White, amber, and rose colors for visual interest')
print('- Central connection point symbolizing sharing')
print('- Minimalist and contemporary aesthetic')

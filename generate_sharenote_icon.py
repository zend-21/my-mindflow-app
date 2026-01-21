"""
ShareNote 앱 아이콘 생성 v2
앱의 특성 (노트 공유, 협업)을 반영한 디자인
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

def create_sharenote_icon_v2(size):
    """
    ShareNote 아이콘 v2
    - 그라데이션 배경 (보라-파랑)
    - 노트/문서 아이콘
    - 공유 화살표
    """
    scale = 4
    canvas_size = size * scale

    # 이미지 생성
    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 그라데이션 배경 (원형)
    center = canvas_size / 2
    max_radius = canvas_size / 2

    # 다중 원으로 그라데이션 효과
    for i in range(200):
        progress = i / 200
        # 보라(#8B5CF6) → 파랑(#3B82F6) 그라데이션
        r = int(139 + (59 - 139) * progress)
        g = int(92 + (130 - 92) * progress)
        b = int(246 + (246 - 246) * progress)

        radius = max_radius * (1 - progress * 0.15)
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(r, g, b, 255)
        )

    # 콘텐츠 영역
    padding = canvas_size * 0.22
    content_size = canvas_size - (padding * 2)

    # 노트/문서 아이콘 (흰색)
    note_width = content_size * 0.45
    note_height = content_size * 0.6
    note_x = padding + content_size * 0.1
    note_y = padding + content_size * 0.2

    # 문서 본체 (라운드 사각형)
    corner_radius = int(canvas_size * 0.04)

    # 문서 배경
    draw.rounded_rectangle(
        [note_x, note_y, note_x + note_width, note_y + note_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 문서 내부 라인들 (텍스트 표현)
    line_color = (139, 92, 246, 180)  # 연한 보라
    line_width = int(canvas_size * 0.012)
    line_spacing = note_height * 0.16
    line_start_x = note_x + note_width * 0.15
    line_end_x = note_x + note_width * 0.85

    for i in range(4):
        line_y = note_y + note_height * 0.2 + (i * line_spacing)
        # 마지막 줄은 짧게
        end_x = line_end_x if i < 3 else line_start_x + note_width * 0.5
        draw.line(
            [line_start_x, line_y, end_x, line_y],
            fill=line_color,
            width=line_width
        )

    # 공유 아이콘 (오른쪽 위)
    share_size = content_size * 0.35
    share_x = padding + content_size * 0.55
    share_y = padding + content_size * 0.15

    # 공유 원형 배경
    share_bg_radius = share_size / 2
    draw.ellipse(
        [share_x, share_y, share_x + share_size, share_y + share_size],
        fill=(255, 255, 255, 255)
    )

    # 공유 화살표들 (3개 - 공유 표현)
    arrow_color = (59, 130, 246, 255)  # 파랑
    arrow_width = int(canvas_size * 0.015)

    # 중심점
    share_center_x = share_x + share_size / 2
    share_center_y = share_y + share_size / 2

    # 중심 점
    dot_size = share_size * 0.12
    draw.ellipse(
        [share_center_x - dot_size/2, share_center_y - dot_size/2,
         share_center_x + dot_size/2, share_center_y + dot_size/2],
        fill=arrow_color
    )

    # 3개 방향 화살표
    import math
    for angle in [0, 120, 240]:
        rad = math.radians(angle - 90)
        line_length = share_size * 0.3
        end_x = share_center_x + math.cos(rad) * line_length
        end_y = share_center_y + math.sin(rad) * line_length

        # 라인
        draw.line(
            [share_center_x, share_center_y, end_x, end_y],
            fill=arrow_color,
            width=arrow_width
        )

        # 끝점 원
        node_size = share_size * 0.1
        draw.ellipse(
            [end_x - node_size/2, end_y - node_size/2,
             end_x + node_size/2, end_y + node_size/2],
            fill=arrow_color
        )

    # 축소
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

def create_round_icon(square_icon):
    """원형 마스크 적용"""
    size = square_icon.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([0, 0, size, size], fill=255)

    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(square_icon, (0, 0))
    result.putalpha(mask)
    return result

def create_foreground_icon(size):
    """Adaptive Icon용 foreground (배경 투명)"""
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Safe zone (중앙 66%)
    padding = canvas_size * 0.25
    content_size = canvas_size - (padding * 2)

    # 노트 아이콘
    note_width = content_size * 0.45
    note_height = content_size * 0.6
    note_x = padding + content_size * 0.1
    note_y = padding + content_size * 0.2
    corner_radius = int(canvas_size * 0.04)

    draw.rounded_rectangle(
        [note_x, note_y, note_x + note_width, note_y + note_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 문서 라인
    line_color = (139, 92, 246, 180)
    line_width = int(canvas_size * 0.012)
    line_spacing = note_height * 0.16
    line_start_x = note_x + note_width * 0.15
    line_end_x = note_x + note_width * 0.85

    for i in range(4):
        line_y = note_y + note_height * 0.2 + (i * line_spacing)
        end_x = line_end_x if i < 3 else line_start_x + note_width * 0.5
        draw.line([line_start_x, line_y, end_x, line_y], fill=line_color, width=line_width)

    # 공유 아이콘
    share_size = content_size * 0.35
    share_x = padding + content_size * 0.55
    share_y = padding + content_size * 0.15
    share_bg_radius = share_size / 2

    draw.ellipse(
        [share_x, share_y, share_x + share_size, share_y + share_size],
        fill=(255, 255, 255, 255)
    )

    arrow_color = (59, 130, 246, 255)
    arrow_width = int(canvas_size * 0.015)
    share_center_x = share_x + share_size / 2
    share_center_y = share_y + share_size / 2

    dot_size = share_size * 0.12
    draw.ellipse(
        [share_center_x - dot_size/2, share_center_y - dot_size/2,
         share_center_x + dot_size/2, share_center_y + dot_size/2],
        fill=arrow_color
    )

    import math
    for angle in [0, 120, 240]:
        rad = math.radians(angle - 90)
        line_length = share_size * 0.3
        end_x = share_center_x + math.cos(rad) * line_length
        end_y = share_center_y + math.sin(rad) * line_length

        draw.line([share_center_x, share_center_y, end_x, end_y], fill=arrow_color, width=arrow_width)

        node_size = share_size * 0.1
        draw.ellipse(
            [end_x - node_size/2, end_y - node_size/2, end_x + node_size/2, end_y + node_size/2],
            fill=arrow_color
        )

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

# 아이콘 생성
base_path = r'f:\React test\share-note\android\app\src\main\res'

print('ShareNote app icon v2 generation started...')

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(base_path, folder)

    square_icon = create_sharenote_icon_v2(size)
    square_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')

    round_icon = create_round_icon(square_icon)
    round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

    foreground_icon = create_foreground_icon(size)
    foreground_icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')

print('Icon generation v2 completed!')
print('')
print('Design concept:')
print('- Gradient background (Purple to Blue) - modern and professional')
print('- Note/Document icon - represents note-taking feature')
print('- Share icon with 3 nodes - represents collaboration and sharing')
print('- Clean and minimal design')

"""
ShareNote 모던 아이콘
- 세련된 그라데이션 배경
- 미니멀한 노트 + 공유 아이콘
- 현대적이고 깔끔한 디자인
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

def create_modern_icon(size):
    """
    모던 ShareNote 아이콘
    - 부드러운 그라데이션 배경 (블루-퍼플)
    - 심플한 노트 아이콘
    - 공유를 나타내는 연결된 점들
    """
    scale = 4
    canvas_size = size * scale

    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 모던한 그라데이션 배경 (블루-퍼플 그라데이션)
    center = canvas_size / 2
    max_radius = canvas_size / 2

    for i in range(200):
        progress = i / 200
        # 블루(#4F46E5) → 퍼플(#7C3AED) 그라데이션
        r = int(79 + (124 - 79) * progress)
        g = int(70 + (58 - 70) * progress)
        b = int(229 + (237 - 229) * progress)

        radius = max_radius * (1 - progress * 0.15)
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(r, g, b, 255)
        )

    # 콘텐츠 영역
    padding = canvas_size * 0.22
    content_size = canvas_size - (padding * 2)

    # 메인 노트 아이콘 (심플한 직사각형 + 라인)
    note_width = content_size * 0.5
    note_height = content_size * 0.6
    note_x = padding + content_size * 0.1
    note_y = padding + content_size * 0.2
    corner_radius = int(canvas_size * 0.04)

    # 노트 배경 (화이트)
    draw.rounded_rectangle(
        [note_x, note_y, note_x + note_width, note_y + note_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 노트 라인들 (더 세련되게)
    line_color = (220, 220, 230, 255)
    line_width = int(canvas_size * 0.008)

    for i in range(3):
        line_y = note_y + note_height * (0.3 + i * 0.2)
        line_start_x = note_x + note_width * 0.15
        line_end_x = note_x + note_width * 0.85

        draw.line(
            [line_start_x, line_y, line_end_x, line_y],
            fill=line_color,
            width=line_width
        )

    # 공유 아이콘 (연결된 점들) - 오른쪽 상단
    share_base_x = note_x + note_width * 0.75
    share_base_y = note_y + note_height * 0.15
    node_radius = canvas_size * 0.025

    # 3개의 연결된 노드로 공유를 표현
    nodes = [
        (share_base_x, share_base_y),  # 중앙
        (share_base_x + content_size * 0.15, share_base_y - content_size * 0.1),  # 오른쪽 위
        (share_base_x + content_size * 0.15, share_base_y + content_size * 0.1),  # 오른쪽 아래
    ]

    # 연결선
    line_color = (255, 255, 255, 200)
    line_width = int(canvas_size * 0.01)

    for i in range(1, len(nodes)):
        draw.line(
            [nodes[0][0], nodes[0][1], nodes[i][0], nodes[i][1]],
            fill=line_color,
            width=line_width
        )

    # 노드 원
    for node in nodes:
        draw.ellipse(
            [node[0] - node_radius, node[1] - node_radius,
             node[0] + node_radius, node[1] + node_radius],
            fill=(255, 255, 255, 255)
        )

    # 액센트 요소 - 노트 왼쪽 상단에 작은 색상 포인트
    accent_size = note_width * 0.12
    accent_x = note_x + note_width * 0.15
    accent_y = note_y + note_height * 0.15

    draw.ellipse(
        [accent_x - accent_size/2, accent_y - accent_size/2,
         accent_x + accent_size/2, accent_y + accent_size/2],
        fill=(34, 197, 94, 255)  # 그린 액센트
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
    padding = canvas_size * 0.28
    content_size = canvas_size - (padding * 2)

    # 노트
    note_width = content_size * 0.5
    note_height = content_size * 0.6
    note_x = padding + content_size * 0.1
    note_y = padding + content_size * 0.2
    corner_radius = int(canvas_size * 0.04)

    draw.rounded_rectangle(
        [note_x, note_y, note_x + note_width, note_y + note_height],
        radius=corner_radius,
        fill=(255, 255, 255, 255)
    )

    # 라인
    line_color = (220, 220, 230, 255)
    line_width = int(canvas_size * 0.008)

    for i in range(3):
        line_y = note_y + note_height * (0.3 + i * 0.2)
        line_start_x = note_x + note_width * 0.15
        line_end_x = note_x + note_width * 0.85

        draw.line(
            [line_start_x, line_y, line_end_x, line_y],
            fill=line_color,
            width=line_width
        )

    # 공유 아이콘
    share_base_x = note_x + note_width * 0.75
    share_base_y = note_y + note_height * 0.15
    node_radius = canvas_size * 0.025

    nodes = [
        (share_base_x, share_base_y),
        (share_base_x + content_size * 0.15, share_base_y - content_size * 0.1),
        (share_base_x + content_size * 0.15, share_base_y + content_size * 0.1),
    ]

    # 연결선
    line_color = (79, 70, 229, 200)  # 배경색과 조화
    line_width = int(canvas_size * 0.01)

    for i in range(1, len(nodes)):
        draw.line(
            [nodes[0][0], nodes[0][1], nodes[i][0], nodes[i][1]],
            fill=line_color,
            width=line_width
        )

    # 노드
    for node in nodes:
        draw.ellipse(
            [node[0] - node_radius, node[1] - node_radius,
             node[0] + node_radius, node[1] + node_radius],
            fill=(79, 70, 229, 255)
        )

    # 액센트
    accent_size = note_width * 0.12
    accent_x = note_x + note_width * 0.15
    accent_y = note_y + note_height * 0.15

    draw.ellipse(
        [accent_x - accent_size/2, accent_y - accent_size/2,
         accent_x + accent_size/2, accent_y + accent_size/2],
        fill=(34, 197, 94, 255)
    )

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

# 아이콘 생성
base_path = r'f:\React test\share-note\android\app\src\main\res'

print('Modern ShareNote icon generation started...')

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(base_path, folder)

    square_icon = create_modern_icon(size)
    square_icon.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')

    round_icon = create_round_icon(square_icon)
    round_icon.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

    foreground_icon = create_foreground_icon(size)
    foreground_icon.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')

print('\nModern icon generation completed!')
print('')
print('Design Features:')
print('- Modern blue-purple gradient background')
print('- Minimalist note icon with clean lines')
print('- Share concept represented by connected nodes')
print('- Green accent dot for visual interest')
print('- Professional and contemporary look')

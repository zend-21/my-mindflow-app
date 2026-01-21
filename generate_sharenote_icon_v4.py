"""
ShareNote 앱 아이콘 생성 스크립트 v4
- 검은 배경에 흰색 S 로고
- 둥근 모서리
- 여러 크기 생성
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# 콘솔 출력 인코딩 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def create_sharenote_icon():
    """ShareNote 앱 아이콘 생성"""

    # 아이콘 크기 정의 (안드로이드 및 웹용)
    sizes = {
        'xxxhdpi': 192,  # 안드로이드 xxxhdpi
        'xxhdpi': 144,   # 안드로이드 xxhdpi
        'xhdpi': 96,     # 안드로이드 xhdpi
        'hdpi': 72,      # 안드로이드 hdpi
        'mdpi': 48,      # 안드로이드 mdpi
        'web': 512,      # 웹/스토어용
        'favicon': 32,   # 파비콘
    }

    output_dir = 'public/icons'
    os.makedirs(output_dir, exist_ok=True)

    for name, size in sizes.items():
        # 이미지 생성 (투명 배경)
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # 둥근 사각형 배경 그리기
        corner_radius = int(size * 0.2)  # 20% 둥근 모서리

        # 검은 배경 (둥근 사각형)
        draw.rounded_rectangle(
            [(0, 0), (size, size)],
            radius=corner_radius,
            fill='#000000',
            outline=None
        )

        # 흰색 테두리 (선택사항 - 약간의 깊이감)
        border_width = max(1, int(size * 0.02))
        draw.rounded_rectangle(
            [(border_width, border_width), (size - border_width, size - border_width)],
            radius=corner_radius - border_width,
            fill=None,
            outline='#333333',
            width=border_width
        )

        # 'S' 텍스트 그리기
        try:
            # 시스템 폰트 사용 (굵은 폰트)
            font_size = int(size * 0.6)  # 아이콘의 60% 크기

            # Windows 폰트 경로들 시도
            font_paths = [
                'C:/Windows/Fonts/arial.ttf',
                'C:/Windows/Fonts/segoeui.ttf',
                'C:/Windows/Fonts/calibri.ttf',
                '/System/Library/Fonts/Helvetica.ttc',  # macOS
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux
            ]

            font = None
            for font_path in font_paths:
                if os.path.exists(font_path):
                    font = ImageFont.truetype(font_path, font_size)
                    break

            if font is None:
                font = ImageFont.load_default()

        except Exception as e:
            print(f"폰트 로드 실패: {e}, 기본 폰트 사용")
            font = ImageFont.load_default()

        # 텍스트 위치 계산 (중앙 정렬)
        text = "S"

        # 텍스트 크기 계산
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # 중앙 정렬 위치 계산
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - int(size * 0.05)  # 약간 위로 조정

        # 흰색 'S' 그리기
        draw.text((x, y), text, fill='#FFFFFF', font=font)

        # 파일 저장
        if name == 'web':
            filename = os.path.join(output_dir, 'icon-512.png')
        elif name == 'favicon':
            filename = os.path.join(output_dir, 'favicon.png')
            # favicon.ico도 생성
            ico_path = os.path.join(output_dir, 'favicon.ico')
            img.save(ico_path, format='ICO', sizes=[(32, 32)])
        else:
            filename = os.path.join(output_dir, f'icon-{size}.png')

        img.save(filename, 'PNG')
        print(f"✅ 생성 완료: {filename}")

    # 안드로이드 리소스 폴더에도 복사
    android_res_dirs = {
        'mdpi': 'android/app/src/main/res/mipmap-mdpi',
        'hdpi': 'android/app/src/main/res/mipmap-hdpi',
        'xhdpi': 'android/app/src/main/res/mipmap-xhdpi',
        'xxhdpi': 'android/app/src/main/res/mipmap-xxhdpi',
        'xxxhdpi': 'android/app/src/main/res/mipmap-xxxhdpi',
    }

    for density, res_dir in android_res_dirs.items():
        if os.path.exists(res_dir):
            size = sizes[density]
            src = os.path.join(output_dir, f'icon-{size}.png')
            dst = os.path.join(res_dir, 'ic_launcher.png')

            if os.path.exists(src):
                img = Image.open(src)
                img.save(dst, 'PNG')
                print(f"✅ 안드로이드 복사: {dst}")

    print("\n🎉 모든 아이콘 생성 완료!")
    print(f"📁 아이콘 위치: {output_dir}")
    print("\n📝 다음 단계:")
    print("1. index.html의 <head>에 아이콘 링크 추가")
    print("2. manifest.json에 아이콘 경로 설정")
    print("3. 안드로이드 프로젝트 빌드")

if __name__ == '__main__':
    create_sharenote_icon()

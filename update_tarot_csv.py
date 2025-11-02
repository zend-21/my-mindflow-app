#!/usr/bin/env python3
"""
Update Tarot.csv to map correct image files
Maps the T001-T156 IDs to actual image filenames
"""

# 타로 카드 매핑 (한글 이름 → 영문 파일명)
# 정방향 = 홀수 ID, 역방향 = 짝수 ID
TAROT_MAPPING = {
    # Major Arcana (0-21)
    '바보': 'major_00.jpg',
    '마법사': 'major_01.jpg',
    '여사제': 'major_02.jpg',
    '여황제': 'major_03.jpg',
    '황제': 'major_04.jpg',
    '교황': 'major_05.jpg',
    '연인': 'major_06.jpg',
    '전차': 'major_07.jpg',
    '힘': 'major_08.jpg',
    '은둔자': 'major_09.jpg',
    '운명의 수레바퀴': 'major_10.jpg',
    '정의': 'major_11.jpg',
    '매달린 사람': 'major_12.jpg',
    '죽음': 'major_13.jpg',
    '절제': 'major_14.jpg',
    '악마': 'major_15.jpg',
    '탑': 'major_16.jpg',
    '별': 'major_17.jpg',
    '달': 'major_18.jpg',
    '태양': 'major_19.jpg',
    '심판': 'major_20.jpg',
    '세계': 'major_21.jpg',

    # Wands (완드)
    '완드 에이스': 'wands_01.jpg',
    '완드 2': 'wands_02.jpg',
    '완드 3': 'wands_03.jpg',
    '완드 4': 'wands_04.jpg',
    '완드 5': 'wands_05.jpg',
    '완드 6': 'wands_06.jpg',
    '완드 7': 'wands_07.jpg',
    '완드 8': 'wands_08.jpg',
    '완드 9': 'wands_09.jpg',
    '완드 10': 'wands_10.jpg',
    '완드 시종': 'wands_11.jpg',
    '완드 기사': 'wands_12.jpg',
    '완드 여왕': 'wands_13.jpg',
    '완드 왕': 'wands_14.jpg',

    # Cups (컵)
    '컵 에이스': 'cups_01.jpg',
    '컵 2': 'cups_02.jpg',
    '컵 3': 'cups_03.jpg',
    '컵 4': 'cups_04.jpg',
    '컵 5': 'cups_05.jpg',
    '컵 6': 'cups_06.jpg',
    '컵 7': 'cups_07.jpg',
    '컵 8': 'cups_08.jpg',
    '컵 9': 'cups_09.jpg',
    '컵 10': 'cups_10.jpg',
    '컵 시종': 'cups_11.jpg',
    '컵 기사': 'cups_12.jpg',
    '컵 여왕': 'cups_13.jpg',
    '컵 왕': 'cups_14.jpg',

    # Swords (검)
    '검 에이스': 'swords_01.jpg',
    '검 2': 'swords_02.jpg',
    '검 3': 'swords_03.jpg',
    '검 4': 'swords_04.jpg',
    '검 5': 'swords_05.jpg',
    '검 6': 'swords_06.jpg',
    '검 7': 'swords_07.jpg',
    '검 8': 'swords_08.jpg',
    '검 9': 'swords_09.jpg',
    '검 10': 'swords_10.jpg',
    '검 시종': 'swords_11.jpg',
    '검 기사': 'swords_12.jpg',
    '검 여왕': 'swords_13.jpg',
    '검 왕': 'swords_14.jpg',

    # Pentacles (펜타클)
    '펜타클 에이스': 'pentacles_01.jpg',
    '펜타클 2': 'pentacles_02.jpg',
    '펜타클 3': 'pentacles_03.jpg',
    '펜타클 4': 'pentacles_04.jpg',
    '펜타클 5': 'pentacles_05.jpg',
    '펜타클 6': 'pentacles_06.jpg',
    '펜타클 7': 'pentacles_07.jpg',
    '펜타클 8': 'pentacles_08.jpg',
    '펜타클 9': 'pentacles_09.jpg',
    '펜타클 10': 'pentacles_10.jpg',
    '펜타클 시종': 'pentacles_11.jpg',
    '펜타클 기사': 'pentacles_12.jpg',
    '펜타클 여왕': 'pentacles_13.jpg',
    '펜타클 왕': 'pentacles_14.jpg',
}

def update_csv():
    """Update Tarot.csv with correct image filenames"""
    import os

    csv_path = os.path.join(os.path.dirname(__file__), 'public', 'fortune_data', 'Tarot.csv')

    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    updated_lines = []
    updated_count = 0

    for i, line in enumerate(lines):
        if i == 0:  # Header
            updated_lines.append(line)
            continue

        parts = line.strip().split(';')
        if len(parts) != 5:
            updated_lines.append(line)
            continue

        category, id, keyword, content, image_file = parts

        # keyword에서 "역방향" 제거하고 매칭
        base_keyword = keyword.replace(' 역방향', '')

        if base_keyword in TAROT_MAPPING:
            # 정방향/역방향 모두 같은 이미지 사용
            new_image = TAROT_MAPPING[base_keyword]
            new_line = f"{category};{id};{keyword};{content};{new_image}\n"
            updated_lines.append(new_line)
            updated_count += 1
        else:
            updated_lines.append(line)
            print(f"Warning: No mapping found for '{base_keyword}'")

    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        f.writelines(updated_lines)

    print(f"Updated {updated_count} image file references in Tarot.csv")

if __name__ == '__main__':
    update_csv()

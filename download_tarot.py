#!/usr/bin/env python3
"""
Rider-Waite Tarot Card Image Downloader
Downloads all 78 tarot card images from Wikimedia Commons (public domain)
"""

import os
import urllib.request
import time

# Wikimedia Commons base URL for Rider-Waite tarot cards
# These are public domain images from the original 1909 deck
TAROT_IMAGES = {
    # Major Arcana (22 cards)
    'major_00': 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    'major_01': 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    'major_02': 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
    'major_03': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
    'major_04': 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
    'major_05': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
    'major_06': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg',
    'major_07': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
    'major_08': 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
    'major_09': 'https://upload.wikimedia.org/wikipedia/commons/4/46/RWS_Tarot_09_Hermit.jpg',
    'major_10': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
    'major_11': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg',
    'major_12': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg',
    'major_13': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg',
    'major_14': 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg',
    'major_15': 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
    'major_16': 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
    'major_17': 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
    'major_18': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg',
    'major_19': 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
    'major_20': 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg',
    'major_21': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',

    # Wands (14 cards)
    'wands_01': 'https://upload.wikimedia.org/wikipedia/commons/1/11/Wands01.jpg',
    'wands_02': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Wands02.jpg',
    'wands_03': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Wands03.jpg',
    'wands_04': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Wands04.jpg',
    'wands_05': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Wands05.jpg',
    'wands_06': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Wands06.jpg',
    'wands_07': 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Wands07.jpg',
    'wands_08': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Wands08.jpg',
    'wands_09': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Tarot_Nine_of_Wands.jpg',
    'wands_10': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Wands10.jpg',
    'wands_11': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Wands11.jpg',
    'wands_12': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Wands12.jpg',
    'wands_13': 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Wands13.jpg',
    'wands_14': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Wands14.jpg',

    # Cups (14 cards)
    'cups_01': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Cups01.jpg',
    'cups_02': 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Cups02.jpg',
    'cups_03': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Cups03.jpg',
    'cups_04': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Cups04.jpg',
    'cups_05': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Cups05.jpg',
    'cups_06': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Cups06.jpg',
    'cups_07': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Cups07.jpg',
    'cups_08': 'https://upload.wikimedia.org/wikipedia/commons/6/60/Cups08.jpg',
    'cups_09': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Cups09.jpg',
    'cups_10': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Cups10.jpg',
    'cups_11': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Cups11.jpg',
    'cups_12': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Cups12.jpg',
    'cups_13': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Cups13.jpg',
    'cups_14': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Cups14.jpg',

    # Swords (14 cards)
    'swords_01': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Swords01.jpg',
    'swords_02': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Swords02.jpg',
    'swords_03': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Swords03.jpg',
    'swords_04': 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Swords04.jpg',
    'swords_05': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Swords05.jpg',
    'swords_06': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Swords06.jpg',
    'swords_07': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Swords07.jpg',
    'swords_08': 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Swords08.jpg',
    'swords_09': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Swords09.jpg',
    'swords_10': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords10.jpg',
    'swords_11': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swords11.jpg',
    'swords_12': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Swords12.jpg',
    'swords_13': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Swords13.jpg',
    'swords_14': 'https://upload.wikimedia.org/wikipedia/commons/3/33/Swords14.jpg',

    # Pentacles (14 cards)
    'pentacles_01': 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Pents01.jpg',
    'pentacles_02': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Pents02.jpg',
    'pentacles_03': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents03.jpg',
    'pentacles_04': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Pents04.jpg',
    'pentacles_05': 'https://upload.wikimedia.org/wikipedia/commons/9/96/Pents05.jpg',
    'pentacles_06': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Pents06.jpg',
    'pentacles_07': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Pents07.jpg',
    'pentacles_08': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Pents08.jpg',
    'pentacles_09': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Pents09.jpg',
    'pentacles_10': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Pents10.jpg',
    'pentacles_11': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Pents11.jpg',
    'pentacles_12': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Pents12.jpg',
    'pentacles_13': 'https://upload.wikimedia.org/wikipedia/commons/8/88/Pents13.jpg',
    'pentacles_14': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Pents14.jpg',
}

def download_tarot_images():
    """Download all tarot card images to public/images/tarot/ directory"""

    # Create target directory
    target_dir = os.path.join(os.path.dirname(__file__), 'public', 'images', 'tarot')
    os.makedirs(target_dir, exist_ok=True)

    print(f"Downloading {len(TAROT_IMAGES)} Rider-Waite tarot card images...")
    print(f"Target directory: {target_dir}\n")

    success_count = 0
    failed = []

    for filename, url in TAROT_IMAGES.items():
        try:
            filepath = os.path.join(target_dir, f"{filename}.jpg")

            # Skip if already exists
            if os.path.exists(filepath):
                print(f"OK {filename}.jpg (already exists)")
                success_count += 1
                continue

            # Download image
            urllib.request.urlretrieve(url, filepath)
            print(f"OK {filename}.jpg downloaded")
            success_count += 1

            # Be nice to Wikimedia servers
            time.sleep(0.2)

        except Exception as e:
            print(f"FAIL {filename}.jpg failed: {e}")
            failed.append(filename)

    print(f"\n{'='*50}")
    print(f"Successfully downloaded: {success_count}/{len(TAROT_IMAGES)}")

    if failed:
        print(f"Failed: {len(failed)}")
        for f in failed:
            print(f"   - {f}")
    else:
        print("All tarot card images downloaded successfully!")

    print(f"{'='*50}\n")

if __name__ == '__main__':
    download_tarot_images()

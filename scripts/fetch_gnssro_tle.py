#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch TLE data for satellites from Celestrak and save into a .tle file.
"""

import requests
from datetime import datetime
import time

# Dictionary mapping NORAD ID to satellite short name and type
SATELLITE_DICT = {
    # —— 风云3系列 (LEO)
    '43010': {'name': 'FY3D', 'type': 'LEO'},
    '49008': {'name': 'FY3E', 'type': 'LEO'},
    '57490': {'name': 'FY3F', 'type': 'LEO'},
    '56232': {'name': 'FY3G', 'type': 'LEO'},

    # —— COSMIC-2 系列 (LEO)
    '44349': {'name': 'C2E1', 'type': 'LEO'},
    '44351': {'name': 'C2E2', 'type': 'LEO'},
    '44343': {'name': 'C2E3', 'type': 'LEO'},
    '44350': {'name': 'C2E4', 'type': 'LEO'},
    '44358': {'name': 'C2E5', 'type': 'LEO'},
    '44353': {'name': 'C2E6', 'type': 'LEO'},

    # —— GPS 星座 (MEO)
    # 格式 GXX，XX 对应 PRN 号
    '62339': {'name': 'G01', 'type': 'GNSS'},  # PRN‑01
    '28474': {'name': 'G02', 'type': 'GNSS'},  # PRN‑02
    '40294': {'name': 'G03', 'type': 'GNSS'},  # PRN‑03
    '43873': {'name': 'G04', 'type': 'GNSS'},  # PRN‑04
    '35752': {'name': 'G05', 'type': 'GNSS'},  # PRN‑05
    '39741': {'name': 'G06', 'type': 'GNSS'},  # PRN‑06
    '32711': {'name': 'G07', 'type': 'GNSS'},  # PRN‑07
    '40730': {'name': 'G08', 'type': 'GNSS'},  # PRN‑08
    '40105': {'name': 'G09', 'type': 'GNSS'},  # PRN‑09
    '41019': {'name': 'G10', 'type': 'GNSS'},  # PRN‑10
    '48859': {'name': 'G11', 'type': 'GNSS'},  # PRN‑11
    '29601': {'name': 'G12', 'type': 'GNSS'},  # PRN‑12
    '24876': {'name': 'G13', 'type': 'GNSS'},  # PRN‑13
    '46826': {'name': 'G14', 'type': 'GNSS'},  # PRN‑14
    '32260': {'name': 'G15', 'type': 'GNSS'},  # PRN‑15
    '27663': {'name': 'G16', 'type': 'GNSS'},  # PRN‑16
    '28874': {'name': 'G17', 'type': 'GNSS'},  # PRN‑17
    '44506': {'name': 'G18', 'type': 'GNSS'},  # PRN‑18
    '28190': {'name': 'G19', 'type': 'GNSS'},  # PRN‑19
    '26360': {'name': 'G20', 'type': 'GNSS'},  # PRN‑20
    '64202': {'name': 'G21', 'type': 'GNSS'},  # PRN‑21
    '26407': {'name': 'G22', 'type': 'GNSS'},  # PRN‑22
    '45854': {'name': 'G23', 'type': 'GNSS'},  # PRN‑23
    '38833': {'name': 'G24', 'type': 'GNSS'},  # PRN‑24
    '36585': {'name': 'G25', 'type': 'GNSS'},  # PRN‑25
    '40534': {'name': 'G26', 'type': 'GNSS'},  # PRN‑26
    '39166': {'name': 'G27', 'type': 'GNSS'},  # PRN‑27
    '55268': {'name': 'G28', 'type': 'GNSS'},  # PRN‑28
    '32384': {'name': 'G29', 'type': 'GNSS'},  # PRN‑29
    '39533': {'name': 'G30', 'type': 'GNSS'},  # PRN‑30
    '29486': {'name': 'G31', 'type': 'GNSS'},  # PRN‑31
    '41328': {'name': 'G32', 'type': 'GNSS'},  # PRN‑32

    # —— 北斗 BDS（MEO/IGSO/GEO）
    # —— 北斗‑2 (BDS‑2) 卫星 PRN → NORAD 映射 —— #
    '36828': {'name': 'C06', 'type': 'GNSS'},   # BEIDOU-2 IGSO-1 (C06)
    '37210': {'name': 'C04', 'type': 'GNSS'},   # BEIDOU-2 G4    (C04)
    '37256': {'name': 'C07', 'type': 'GNSS'},   # BEIDOU-2 IGSO-2 (C07)
    '38775': {'name': 'C14', 'type': 'GNSS'},   # BEIDOU-2 M6    (C14)
    '44231': {'name': 'C01', 'type': 'GNSS'},   # BEIDOU-2 G8    (C01)

    # —— 北斗‑3 (BDS‑3) 卫星 PRN → NORAD 映射 —— #
    '43582': {'name': 'C24', 'type': 'GNSS'},   # BEIDOU-3 M6  (C24)
    '43602': {'name': 'C26', 'type': 'GNSS'},   # BEIDOU-3 M12 (C26)
    '43603': {'name': 'C25', 'type': 'GNSS'},   # BEIDOU-3 M11 (C25)
    '43622': {'name': 'C32', 'type': 'GNSS'},   # BEIDOU-3 M13 (C32)
    '43623': {'name': 'C33', 'type': 'GNSS'},   # BEIDOU-3 M14 (C33)
    '43647': {'name': 'C35', 'type': 'GNSS'},   # BEIDOU-3 M16 (C35)
    '43648': {'name': 'C34', 'type': 'GNSS'},   # BEIDOU-3 M15 (C34)
    '43683': {'name': 'C59', 'type': 'GNSS'},   # BEIDOU-3 G1  (C59)
    '43706': {'name': 'C36', 'type': 'GNSS'},   # BEIDOU-3 M17 (C36)
    '43707': {'name': 'C37', 'type': 'GNSS'},   # BEIDOU-3 M18 (C37)
    '44204': {'name': 'C38', 'type': 'GNSS'},   # BEIDOU-3 IGSO-1 (C38)
    '44337': {'name': 'C39', 'type': 'GNSS'},   # BEIDOU-3 IGSO-2 (C39)
    '44542': {'name': 'C46', 'type': 'GNSS'},   # BEIDOU-3 M24 (C46)
    '44543': {'name': 'C45', 'type': 'GNSS'},   # BEIDOU-3 M23 (C45)
    '44709': {'name': 'C40', 'type': 'GNSS'},   # BEIDOU-3 IGSO-3 (C40)
    '44793': {'name': 'C44', 'type': 'GNSS'},   # BEIDOU-3 M22 (C44)
    '44794': {'name': 'C43', 'type': 'GNSS'},   # BEIDOU-3 M21 (C43)
    '44864': {'name': 'C41', 'type': 'GNSS'},   # BEIDOU-3 M19 (C41)
    '44865': {'name': 'C42', 'type': 'GNSS'},   # BEIDOU-3 M20 (C42)
    '45344': {'name': 'C60', 'type': 'GNSS'},   # BEIDOU-3 G2  (C60)
    '45807': {'name': 'C61', 'type': 'GNSS'},   # BEIDOU-3 G3  (C61)
    '56564': {'name': 'C62', 'type': 'GNSS'},   # BEIDOU-3 G4  (C62)
    '58654': {'name': 'C50', 'type': 'GNSS'},   # BEIDOU-3 M28 (C50)

    # —— Eileo（MEO）
    '40889': {'name': 'E24', 'type': 'GNSS'},  # PRN E24 :contentReference[oaicite:0]{index=0}
    '40890': {'name': 'E30', 'type': 'GNSS'},  # PRN E30 :contentReference[oaicite:1]{index=1}
    '41859': {'name': 'E07', 'type': 'GNSS'},  # PRN E07 :contentReference[oaicite:2]{index=2}
    '41175': {'name': 'E08', 'type': 'GNSS'},  # PRN E08 :contentReference[oaicite:3]{index=3}

    '41174': {'name': 'E09', 'type': 'GNSS'},  # PRN E09 :contentReference[oaicite:4]{index=4}
    '41550': {'name': 'E01', 'type': 'GNSS'},  # PRN E01 :contentReference[oaicite:5]{index=5}
    '41549': {'name': 'E02', 'type': 'GNSS'},  # PRN E02 :contentReference[oaicite:6]{index=6}
    '41860': {'name': 'E03', 'type': 'GNSS'},  # PRN E03 :contentReference[oaicite:7]{index=7}

    '41861': {'name': 'E04', 'type': 'GNSS'},  # PRN E04 :contentReference[oaicite:8]{index=8}
    '41862': {'name': 'E05', 'type': 'GNSS'},  # PRN E05 :contentReference[oaicite:9]{index=9}
    '43055': {'name': 'E21', 'type': 'GNSS'},  # PRN E21 :contentReference[oaicite:10]{index=10}
    '43056': {'name': 'E25', 'type': 'GNSS'},  # PRN E25 :contentReference[oaicite:11]{index=11}

    '43057': {'name': 'E27', 'type': 'GNSS'},  # PRN E27 :contentReference[oaicite:12]{index=12}
    '43058': {'name': 'E31', 'type': 'GNSS'},  # PRN E31 :contentReference[oaicite:13]{index=13}
    '43566': {'name': 'E36', 'type': 'GNSS'},  # PRN E36 :contentReference[oaicite:14]{index=14}
    '43567': {'name': 'E13', 'type': 'GNSS'},  # PRN E13 :contentReference[oaicite:15]{index=15}

    '43564': {'name': 'E15', 'type': 'GNSS'},  # PRN E15 :contentReference[oaicite:16]{index=16}
    '43565': {'name': 'E33', 'type': 'GNSS'},  # PRN E33 :contentReference[oaicite:17]{index=17}
    '49809': {'name': 'E34', 'type': 'GNSS'},  # PRN E34 :contentReference[oaicite:18]{index=18}
    '49810': {'name': 'E10', 'type': 'GNSS'},  # PRN E10 :contentReference[oaicite:19]{index=19}

    # —— GLONASS PRN (RXX) → NORAD ID 映射 —— #
    '36111': {'name': 'R01', 'type': 'GNSS'},  # slot 730 → COSMOS 2456 (730) → NORAD 36111
    '39155': {'name': 'R02', 'type': 'GNSS'},  # slot 747 → COSMOS 2485 (747) → NORAD 39155
    '37867': {'name': 'R03', 'type': 'GNSS'},  # slot 744 → COSMOS 2476 (744) → NORAD 37867
    '44850': {'name': 'R04', 'type': 'GNSS'},  # slot 759 → COSMOS 2544 (759) → NORAD 44850
    '43508': {'name': 'R05', 'type': 'GNSS'},  # slot 756 → COSMOS 2527 (756) → NORAD 43508
    '36112': {'name': 'R06', 'type': 'GNSS'},  # slot 733 → COSMOS 2457 (733) → NORAD 36112
    '37868': {'name': 'R07', 'type': 'GNSS'},  # slot 745 → COSMOS 2477 (745) → NORAD 37868
    '37869': {'name': 'R08', 'type': 'GNSS'},  # slot 743 → COSMOS 2475 (743) → NORAD 37869
    '40315': {'name': 'R09', 'type': 'GNSS'},  # slot 702 → COSMOS 2501 (702) → NORAD 40315
    '32395': {'name': 'R10', 'type': 'GNSS'},  # slot 723 → COSMOS 2436 (723) → NORAD 32395
    '46805': {'name': 'R11', 'type': 'GNSS'},  # slot 705 → COSMOS 2547 (705) → NORAD 46805
    '44299': {'name': 'R12', 'type': 'GNSS'},  # slot 758 → COSMOS 2534 (758) → NORAD 44299
    '32393': {'name': 'R13', 'type': 'GNSS'},  # slot 721 → COSMOS 2434 (721) → NORAD 32393
    '42939': {'name': 'R14', 'type': 'GNSS'},  # slot 752 → COSMOS 2522 (752) → NORAD 42939
    '43687': {'name': 'R15', 'type': 'GNSS'},  # slot 757 → COSMOS 2529 (757) → NORAD 43687
    '54377': {'name': 'R16', 'type': 'GNSS'},  # slot 761 → COSMOS 2564 (761) → NORAD 54377
    '41330': {'name': 'R17', 'type': 'GNSS'},  # slot 751 → COSMOS 2514 (751) → NORAD 41330
    '39620': {'name': 'R18', 'type': 'GNSS'},  # slot 754 → COSMOS 2492 (754) → NORAD 39620
    '54031': {'name': 'R19', 'type': 'GNSS'},  # slot 707 → COSMOS 2559 (707) → NORAD 54031
    '32276': {'name': 'R20', 'type': 'GNSS'},  # slot 719 → COSMOS 2432 (719) → NORAD 32276
    '40001': {'name': 'R21', 'type': 'GNSS'},  # slot 755 → COSMOS 2500 (755) → NORAD 40001
    '52984': {'name': 'R22', 'type': 'GNSS'},  # slot 706 → COSMOS 2557 (706) → NORAD 52984
    '36402': {'name': 'R23', 'type': 'GNSS'},  # slot 732 → COSMOS 2460 (732) → NORAD 36402
    '45358': {'name': 'R24', 'type': 'GNSS'},  # slot 760 → COSMOS 2545 (760) → NORAD 45358
    '32275': {'name': 'R25', 'type': 'GNSS'}   # slot 720 → COSMOS 2433 (720) → NORAD 32275
}

def fetch_tle(satellite_id):
    """Fetch TLE data for a given NORAD ID from Celestrak."""
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={satellite_id}"
    try:
        r = requests.get(url)
        r.raise_for_status()
        lines = r.text.strip().split('\n')
        if len(lines) >= 3:
            return lines[0], lines[1], lines[2]
    except Exception as e:
        print(f"[ERROR] {satellite_id}: {e}")
    return None

def main():
    # 输出文件名：Rx-YY_YYYYMMDD.tle
    today = datetime.now().strftime("%Y%m%d")
    fname = f"Rx-YY_{today}.tle"

    with open(fname, 'w') as fp:
        for norad, info in SATELLITE_DICT.items():
            name, typ = info['name'], info['type']
            print(f"Fetching {typ} {name} (NORAD {norad})...")
            tle = fetch_tle(norad)
            if tle:
                # 用简洁注释写入
                fp.write(f"# {name} ({typ})\n")
                fp.write(f"{tle[1]}\n{tle[2]}\n\n")
                print(f"  ✔ {name}")
            else:
                print(f"  ✖ {name}")
            time.sleep(1)

    print(f"\nDone. Saved TLE → {fname}")

if __name__ == "__main__":
    main()

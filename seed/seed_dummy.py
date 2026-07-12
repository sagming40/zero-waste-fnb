"""
seed_dummy.py — ZeroWaste F&B 더미 데이터 시딩 스크립트 (EPIC 1-3 / 2-3)

[규칙 요약]
- 매장 컨셉: 베이커리 & 카페 (음료 5 · 베이커리 4 · 식사류 3 · 신메뉴 1 = 13개 메뉴)
- 재료 18종, 메뉴 간 재료 공유 (BOM = N:M 구조 실현)
- 기간: 최근 6개월 (약 180일)
- 정기휴무: 매주 월요일 / 예외휴무: 랜덤 2~3일 (결측 데이터 → EPIC 3-5 엣지케이스용)
- 요일 가중치 + 랜덤 노이즈로 "패턴 있는" 판매량 생성 (주말 스파이크)
- 콜드스타트 케이스: "말차라떼"는 마지막 5일치 판매 기록만 존재 (EPIC 3-5 엣지케이스용)

[실행 방법]
1) pip install "psycopg[binary]" --break-system-packages   (또는 가상환경 안에서 pip install "psycopg[binary]")
2) 아래 DB_CONFIG를 본인 pgAdmin 접속 정보로 수정
3) python seed_dummy.py
4) pgAdmin에서 daily_menu_sales, daily_waste 등에 데이터 들어왔는지 확인
"""

import os
import random
from datetime import date, timedelta

import psycopg
from dotenv import load_dotenv

# ------------------------------------------------------------
# 0) DB 접속 정보 — 프로젝트 루트의 .env 파일에서 읽어온다.
#    (비밀번호를 코드에 직접 적지 않는다 — Git에 올라가는 순간 그대로 노출되기 때문.
#     .env 파일은 .gitignore에 등록되어 있어서 커밋되지 않는다.)
#
#    .env 파일 예시 (프로젝트 루트에 직접 만들 것):
#      DB_HOST=localhost
#      DB_PORT=5432
#      DB_NAME=zerowaste
#      DB_USER=postgres
#      DB_PASSWORD=본인_실제_비밀번호
# ------------------------------------------------------------
load_dotenv()

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"],
    "dbname": os.environ["DB_NAME"],
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
}

# 재현 가능하게(포트폴리오 발표 때 매번 같은 데이터 나오도록) 랜덤 시드 고정
random.seed(42)

# ------------------------------------------------------------
# 1) 매장 정보
# ------------------------------------------------------------
STORE = ("민규 베이커리&카페", "mingyu.bakery@test.com")

# ------------------------------------------------------------
# 2) 식자재 마스터 (18종)
#    (이름, 단위, 초기재고, 유통기한까지 남은 일수 — None이면 유통기한 없음 취급)
# ------------------------------------------------------------
INGREDIENTS = [
    ("원두",        "g",  3000, 90),
    ("우유",        "ml", 8000, 7),
    ("바닐라시럽",  "ml", 2000, 180),
    ("레몬",        "ea",   50, 14),
    ("홍차티백",    "ea",  200, 365),
    ("버터",        "g",  4000, 30),
    ("밀가루",      "g", 15000, 180),
    ("초코칩",      "g",  3000, 180),
    ("달걀",        "ea",  300, 20),
    ("식빵",        "ea",  150, 5),
    ("햄",          "g",  4000, 10),
    ("슬라이스치즈", "ea",  400, 21),
    ("양상추",      "g",  3000, 7),
    ("베이글",      "ea",  120, 5),
    ("크림치즈",    "g",  3000, 30),
    ("훈제연어",    "g",  2000, 5),
    ("감자",        "g",  8000, 30),
    ("말차파우더",  "g",  1500, 180),   # 신메뉴(말차라떼) 전용 재료
]

# ------------------------------------------------------------
# 3) 메뉴 마스터 + 레시피(BOM)
#    형식: (메뉴명, 단가, 카테고리, [(재료명, 1개당 소요량, 단위), ...])
#    카테고리는 나중에 콜드스타트 대체 로직(동일 카테고리 평균)에 쓸 수 있음
# ------------------------------------------------------------
MENUS = [
    ("아메리카노",   4000, "음료", [("원두", 20, "g")]),
    ("카페라떼",     4500, "음료", [("원두", 18, "g"), ("우유", 150, "ml")]),
    ("카푸치노",     4500, "음료", [("원두", 18, "g"), ("우유", 100, "ml")]),
    ("바닐라라떼",   5000, "음료", [("원두", 18, "g"), ("우유", 150, "ml"), ("바닐라시럽", 15, "ml")]),
    ("레몬티",       4800, "음료", [("홍차티백", 1, "ea"), ("레몬", 0.5, "ea")]),

    ("크루아상",     3500, "베이커리", [("버터", 30, "g"), ("밀가루", 100, "g")]),
    ("소금빵",       3200, "베이커리", [("버터", 25, "g"), ("밀가루", 90, "g")]),
    ("치아바타",     3000, "베이커리", [("밀가루", 120, "g")]),
    ("초코머핀",     3800, "베이커리", [("밀가루", 80, "g"), ("초코칩", 20, "g"), ("달걀", 1, "ea")]),

    ("샌드위치",     6000, "식사", [("식빵", 2, "ea"), ("햄", 40, "g"), ("슬라이스치즈", 1, "ea"), ("양상추", 20, "g")]),
    ("베이글샌드위치", 6500, "식사", [("베이글", 1, "ea"), ("크림치즈", 30, "g"), ("훈제연어", 30, "g")]),
    ("감자수프",     5500, "식사", [("감자", 150, "g"), ("우유", 100, "ml")]),

    # 신메뉴 — 콜드스타트 테스트용. 판매 기록은 마지막 5일치만 생성한다.
    ("말차라떼",     5200, "음료", [("말차파우더", 10, "g"), ("우유", 150, "ml")]),
]
NEW_MENU_NAME = "말차라떼"
NEW_MENU_HISTORY_DAYS = 5  # 이 메뉴는 전체 기간 중 마지막 N일치 판매 기록만 존재

# ------------------------------------------------------------
# 4) 기간 및 요일 패턴 설정
# ------------------------------------------------------------
END_DATE = date(2026, 7, 12)          # 오늘(시딩 기준일)
START_DATE = END_DATE - timedelta(days=180)  # 약 6개월 전

REGULAR_CLOSED_WEEKDAY = 0  # Python weekday(): 0=월요일
N_EXTRA_CLOSED_DAYS = 3     # 예외 휴무(공휴일 등) 랜덤 며칠

# 요일별 가중치 (월요일은 어차피 휴무라 값 의미 없음)
WEEKDAY_WEIGHT = {
    0: 0.0,  # 월(휴무)
    1: 0.9,  # 화
    2: 1.0,  # 수
    3: 1.0,  # 목
    4: 1.2,  # 금
    5: 1.6,  # 토
    6: 1.4,  # 일
}

BASE_DAILY_QTY = 15  # 메뉴 1개당 "평범한 날" 기준 판매 개수 (여기에 요일가중치·노이즈 적용)


def build_calendar():
    """영업일 목록을 만든다. 월요일 정기휴무 + 랜덤 예외휴무 며칠을 뺀다."""
    all_days = []
    d = START_DATE
    while d <= END_DATE:
        all_days.append(d)
        d += timedelta(days=1)

    open_days = [d for d in all_days if d.weekday() != REGULAR_CLOSED_WEEKDAY]

    # 정기휴무가 아닌 날 중에서 예외휴무를 랜덤으로 몇 개 더 뽑는다
    extra_closed = set(random.sample(open_days, N_EXTRA_CLOSED_DAYS))
    open_days = [d for d in open_days if d not in extra_closed]

    return open_days


def sales_for_day(base_qty: int, day: date) -> int:
    """요일 가중치 + 랜덤 노이즈를 적용해 그날의 판매량을 만든다."""
    weight = WEEKDAY_WEIGHT[day.weekday()]
    noise = random.gauss(1.0, 0.15)  # 평균 1.0, 표준편차 0.15인 정규분포 노이즈
    noise = max(noise, 0.4)          # 너무 튀지 않게 하한선
    qty = round(base_qty * weight * noise)
    return max(qty, 0)


def main():
    open_days = build_calendar()
    cold_start_cutoff = open_days[-NEW_MENU_HISTORY_DAYS:]  # 신메뉴 판매 발생 구간

    with psycopg.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cur:

            # ---------- 1) users ----------
            cur.execute(
                "INSERT INTO users (store_name, email) VALUES (%s, %s) RETURNING id",
                STORE,
            )
            user_id = cur.fetchone()[0]

            # ---------- 2) ingredients ----------
            ingredient_id = {}  # 이름 -> id 매핑 (BOM 만들 때 필요)
            for name, unit, stock, exp_days in INGREDIENTS:
                exp_date = END_DATE + timedelta(days=exp_days) if exp_days else None
                cur.execute(
                    """
                    INSERT INTO ingredients (user_id, name, current_stock, unit, expiration_date)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                    """,
                    (user_id, name, stock, unit, exp_date),
                )
                ingredient_id[name] = cur.fetchone()[0]

            # ---------- 3) menus + recipes_bom ----------
            menu_id = {}
            for name, price, _category, bom in MENUS:
                cur.execute(
                    "INSERT INTO menus (user_id, name, price) VALUES (%s, %s, %s) RETURNING id",
                    (user_id, name, price),
                )
                mid = cur.fetchone()[0]
                menu_id[name] = mid

                for ing_name, qty_per_unit, unit in bom:
                    cur.execute(
                        """
                        INSERT INTO recipes_bom (menu_id, ingredient_id, qty_per_unit, unit)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (mid, ingredient_id[ing_name], qty_per_unit, unit),
                    )

            # ---------- 4) daily_menu_sales (일자 × 메뉴) ----------
            sales_rows = []
            for day in open_days:
                for name, _price, _category, _bom in MENUS:
                    if name == NEW_MENU_NAME and day not in cold_start_cutoff:
                        continue  # 콜드스타트 메뉴는 마지막 N일 전에는 아예 판매 기록 없음
                    qty = sales_for_day(BASE_DAILY_QTY, day)
                    sales_rows.append((user_id, day, menu_id[name], qty))

            cur.executemany(
                """
                INSERT INTO daily_menu_sales (user_id, sale_date, menu_id, sold_qty)
                VALUES (%s, %s, %s, %s)
                """,
                sales_rows,
            )

            # ---------- 5) daily_waste (일자별 폐기량, 요일 가중치 반영) ----------
            waste_rows = []
            for day in open_days:
                weight = WEEKDAY_WEIGHT[day.weekday()]
                base_waste = 0.8  # kg, 평범한 날 기준
                noise = max(random.gauss(1.0, 0.2), 0.3)
                waste_amount = round(base_waste * weight * noise, 2)
                waste_rows.append((user_id, day, waste_amount))

            cur.executemany(
                """
                INSERT INTO daily_waste (user_id, sale_date, waste_amount)
                VALUES (%s, %s, %s)
                """,
                waste_rows,
            )

        conn.commit()

    print(f"✅ 시딩 완료: 영업일 {len(open_days)}일, 판매기록 {len(sales_rows)}행, 폐기기록 {len(waste_rows)}행")
    print(f"   (정기휴무: 매주 월요일 / 예외휴무: {N_EXTRA_CLOSED_DAYS}일)")
    print(f"   (콜드스타트 메뉴: '{NEW_MENU_NAME}' — 마지막 {NEW_MENU_HISTORY_DAYS}일치만 판매 기록 존재)")


if __name__ == "__main__":
    main()

-- ============================================================
-- ZeroWaste F&B — DB 스키마 (EPIC 1)
-- PostgreSQL 18.x 기준
--
-- 실행 순서가 중요하다: 부모 테이블(참조당하는 쪽)을 먼저 만들고,
-- 자식 테이블(FK로 참조하는 쪽)을 나중에 만든다.
--   users → menus / ingredients → recipes_bom → daily_menu_sales / daily_waste → predictions
-- ============================================================


-- ------------------------------------------------------------
-- 1) users : 매장/점주 정보 (모든 데이터의 뿌리)
-- ------------------------------------------------------------
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,          -- 자동 증가 번호표 (1, 2, 3...)
    store_name  VARCHAR(100) NOT NULL,       -- 매장명
    email       VARCHAR(255) NOT NULL UNIQUE -- 로그인 아이디 (중복 금지)
);


-- ------------------------------------------------------------
-- 2) menus : 판매 메뉴 마스터 (예: 아메리카노, 치즈버거)
-- ------------------------------------------------------------
CREATE TABLE menus (
    id       SERIAL PRIMARY KEY,
    user_id  INTEGER NOT NULL REFERENCES users(id),  -- 어느 매장 메뉴인지
    name     VARCHAR(100) NOT NULL,                  -- 메뉴명
    price    INTEGER                                 -- 판매 단가(원). 선택값이라 NOT NULL 없음
);


-- ------------------------------------------------------------
-- 3) ingredients : 식자재 마스터 + 현재 재고 + 유통기한
-- ------------------------------------------------------------
CREATE TABLE ingredients (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    name            VARCHAR(100) NOT NULL,   -- 식자재명 (예: 원두, 토마토)
    current_stock   REAL NOT NULL DEFAULT 0, -- 현재 남은 재고량 (소수 허용: 1.5kg 등)
    unit            VARCHAR(20) NOT NULL,    -- 단위 (g, kg, ml, ea 등)
    expiration_date DATE                     -- 유통기한 (임박 경고 UI의 판단 근거)
);


-- ------------------------------------------------------------
-- 4) recipes_bom : 레시피/BOM — "메뉴 1개당 식자재 얼마"
--    메뉴(N) ↔ 식자재(N) 사이를 잇는 다리(연결 테이블)
-- ------------------------------------------------------------
CREATE TABLE recipes_bom (
    id            SERIAL PRIMARY KEY,
    menu_id       INTEGER NOT NULL REFERENCES menus(id),        -- 어떤 메뉴의
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),  -- 어떤 식자재가
    qty_per_unit  REAL NOT NULL,      -- 1개당 얼마나 (예: 아메리카노 1잔당 원두 20)
    unit          VARCHAR(20) NOT NULL -- 소요량 단위 (g, ml, ea 등)
);


-- ------------------------------------------------------------
-- 5) daily_menu_sales : 일일 메뉴별 판매 기록 (수요 예측의 입력)
-- ------------------------------------------------------------
CREATE TABLE daily_menu_sales (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER NOT NULL REFERENCES users(id),
    sale_date DATE NOT NULL,                          -- 영업일
    menu_id   INTEGER NOT NULL REFERENCES menus(id),  -- 어떤 메뉴가
    sold_qty  INTEGER NOT NULL                        -- 그날 몇 개 팔렸나
);


-- ------------------------------------------------------------
-- 6) daily_waste : 일일 폐기 기록 (탄소 저감량 산출의 입력)
--    판매 예측용(daily_menu_sales)과 역할을 분리해 둔다.
-- ------------------------------------------------------------
CREATE TABLE daily_waste (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    sale_date    DATE NOT NULL,   -- 영업일
    waste_amount REAL NOT NULL    -- 그날 발생한 폐기물 총량 (kg)
);


-- ------------------------------------------------------------
-- 7) predictions : 파이썬이 계산한 내일 발주 권장량 (결과 저장)
--
--    ★ UNIQUE 제약이 핵심: (user_id, target_date, ingredient_id) 조합이
--      단 하나만 존재하도록 막는다. → EPIC 3-4 '배치 멱등성(UPSERT)'의 전제.
--      자정 배치가 두 번 돌아도 중복 행이 안 쌓이게 하려면 이 유니크 키가 먼저 있어야 한다.
-- ------------------------------------------------------------
CREATE TABLE predictions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    target_date     DATE NOT NULL,                              -- 발주 대상일 (보통 내일)
    ingredient_id   INTEGER NOT NULL REFERENCES ingredients(id),
    recommended_qty REAL NOT NULL,                              -- 권장 발주량
    created_at      TIMESTAMP NOT NULL DEFAULT now(),           -- 예측 실행 시각
    CONSTRAINT uq_predictions UNIQUE (user_id, target_date, ingredient_id)
);


-- ============================================================
-- 참고: 조회 성능용 복합 인덱스는 여기서 '일부러' 만들지 않는다.
--   EPIC 2-4에서 N+1 → JOIN 리팩터와 함께 인덱스 유/무 성능을
--   EXPLAIN ANALYZE로 전후 비교(before/after)하기 위한 여지를 남겨둔다.
-- 예) CREATE INDEX idx_dms_user_date_menu
--        ON daily_menu_sales (user_id, sale_date, menu_id);
-- ============================================================

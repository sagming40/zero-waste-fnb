package com.sagming.zwfnb;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

// 🏢 아파트 관리 규칙 검사관
// - com.sagming.zwfnb 바로 아래 폴더 하나 = 세대 하나 (store, menu, closing ...)
// - 세대 현관(폴더 아래 public 클래스)은 다른 세대가 사용해도 된다
// - 안방(하위 폴더, 예: store/internal)에 들어가거나, 세대끼리 서로 물고 들면(순환) 위반
// @SpringBootTest가 없다 → app을 띄우지 않고 class 파일만 읽어서 검사한다 (DB · Docker 불필요)
class ModularityTests {

    // 아파트 도면 그리기: 기준 class의 패키지 아래를 훑어 세대(모듈) 목록을 만든다
    // static final → Test method가 여러 개여도 도면은 한 번만 그린다
    static final ApplicationModules modules = ApplicationModules.of(ZwfnbApplication.class);

    @Test
    void verifiesModularStructure() {
        // 도면을 console에 찍어 둔다 → 지금 세대가 몇 개로 보이는지 눈으로 확인하는 용도
        modules.forEach(System.out::println);

        // 규칙 검사 ─ 위반이 하나라도 있으면 예외를 던져 Test가 빨간불이 된다
        modules.verify();
    }
}

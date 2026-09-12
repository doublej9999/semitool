import type { ToolTranslation } from '../types';

export const ko: Record<string, ToolTranslation> = {
  "/tools/wafer-die-calculator": {
    "name": "웨이퍼 다이 계산기",
    "description": "웨이퍼 크기, 다이 규격, 스크라이브 레인 폭, 에지 제외 영역을 고려한 예상 총 다이 수(Gross Die) 및 면적 효율 계산.",
    "keywords": [
      "웨이퍼 다이",
      "다이 수율",
      "스크라이브",
      "에지 제외",
      "Gross Die",
      "DPW"
    ]
  },
  "/tools/wafer-map-generator": {
    "name": "대화형 웨이퍼 맵 생성기",
    "description": "다이 배치, 양품/불량 통계 및 CSV/JSON 내보내기를 지원하는 대화형 웨이퍼 맵 시각화.",
    "keywords": [
      "웨이퍼 맵",
      "다이 맵",
      "웨이퍼 지도",
      "비닝 통계",
      "시각화"
    ]
  },
  "/tools/wafer-mark-calculator": {
    "name": "SEMI 규격 웨이퍼 마킹 계산기",
    "description": "SEMI M12/M13 표준에 부합하는 실리콘 웨이퍼 레이저 마킹 문자열 생성 및 체크섬 검증.",
    "keywords": [
      "웨이퍼 마킹",
      "SEMI 마크",
      "SEMI M12",
      "SEMI M13",
      "체크섬",
      "레이저 마킹"
    ]
  },
  "/tools/yield-calculator": {
    "name": "웨이퍼 수율 계산기",
    "description": "투입 웨이퍼 수와 양품 칩 수를 기반으로 웨이퍼 가공 및 패키징 테스트 종합 수율 계산.",
    "keywords": [
      "수율 계산",
      "웨이퍼 수율",
      "공정 수율",
      "양품률"
    ]
  },
  "/tools/yield-model-calculator": {
    "name": "수율 모델 비교 계산기",
    "description": "Murphy, Poisson, Seeds, Bose-Einstein 반도체 결함 밀도 기반 수율 예측 모델 비교.",
    "keywords": [
      "수율 모델",
      "포아송 모델",
      "머피 모델",
      "결함 밀도 모델"
    ]
  },
  "/tools/defect-density-calculator": {
    "name": "결함 밀도 계산기 (D0)",
    "description": "다이 면적 및 측정 수율을 역산하여 결함 밀도 D0 추정 및 공정 품질 평가.",
    "keywords": [
      "결함 밀도",
      "D0",
      "킬러 결함",
      "수율 손실",
      "청정도"
    ]
  },
  "/tools/die-cost-calculator": {
    "name": "다이 제조 원가 계산기",
    "description": "웨이퍼 단가, 획득 다이 수, 공정 수율 및 패키징 비용을 반영한 단품 다이 원가 계산.",
    "keywords": [
      "다이 원가",
      "웨이퍼 비용",
      "칩 제조원가",
      "단가 계산"
    ]
  },
  "/tools/process-capability-calculator": {
    "name": "공정 능력 지수 계산기 (Cp / Cpk)",
    "description": "규격 상한(USL)/하한(LSL) 및 평균, 표준편차로부터 공정능력지수 Cp, Cpk, Pp, Ppk 산출.",
    "keywords": [
      "공정 능력",
      "Cp",
      "Cpk",
      "Pp",
      "Ppk",
      "식스시그마",
      "SPC"
    ]
  },
  "/tools/yield-confidence-calculator": {
    "name": "수율 신뢰구간 계산기",
    "description": "샘플 검사 데이터로부터 Wilson Score 또는 Clopper-Pearson 수율 신뢰구간 추정.",
    "keywords": [
      "신뢰구간",
      "수율 신뢰도",
      "샘플 크기",
      "윌슨 점수"
    ]
  },
  "/tools/throughput-calculator": {
    "name": "장비 생산능력 및 WPH 계산기",
    "description": "공정 시간, 핸들러 오버헤드, 배치 크기를 기반으로 시간당 웨이퍼 처리량(WPH) 계산.",
    "keywords": [
      "WPH",
      "시간당 생산량",
      "스루풋",
      "택트 타임",
      "장비 생산성"
    ]
  },
  "/tools/sheet-resistance-calculator": {
    "name": "4탐침 면저항 및 비저항 계산기",
    "description": "4-포인트 프로브 측정 전압/전류, 탐침 간격, 박막 두께로부터 면저항 Rs 및 비저항 계산.",
    "keywords": [
      "면저항",
      "비저항",
      "4탐침",
      "시트 저항",
      "Rs"
    ]
  },
  "/tools/wafer-area-calculator": {
    "name": "웨이퍼 유효 면적 및 에지 제외 계산기",
    "description": "플랫 또는 노치가 포함된 웨이퍼 총면적과 에지 제외 영역을 뺀 순수 유효 공정 면적 계산.",
    "keywords": [
      "웨이퍼 면적",
      "에지 제외",
      "유효 면적",
      "플랫존",
      "노치"
    ]
  },
  "/tools/reticle-field-calculator": {
    "name": "레티클 노광 필드 계산기",
    "description": "스테퍼/스캐너 유효 노광 샷 영역 내 배치 가능한 다이 배열 행/열 수 및 노광 수 계산.",
    "keywords": [
      "레티클",
      "노광 필드",
      "스테퍼",
      "스캐너",
      "샷 영역"
    ]
  },
  "/tools/thickness-converter": {
    "name": "박막 두께 단위 변환기",
    "description": "옹스트롬(Å), 나노미터(nm), 마이크로미터(µm), mil, 밀리미터(mm) 간 박막 두께 정밀 변환.",
    "keywords": [
      "두께 변환",
      "옹스트롬",
      "나노미터",
      "마이크로미터",
      "단위 변환"
    ]
  },
  "/tools/pressure-converter": {
    "name": "진공 및 압력 단위 변환기",
    "description": "파스칼(Pa), 밀리바(mbar), 토르(Torr), 밀리토르(mTorr), 기압(atm) 간 고정밀 진공도 변환.",
    "keywords": [
      "진공도",
      "압력 변환",
      "파스칼",
      "토르",
      "Torr",
      "Pa"
    ]
  },
  "/tools/gas-flow-converter": {
    "name": "가스 유량 변환기 (sccm / slm)",
    "description": "sccm, slm, mol/s 및 기준온도 조건에 따른 반도체 공정 가스 질량유량 정밀 변환.",
    "keywords": [
      "가스 유량",
      "MFC",
      "sccm",
      "slm",
      "질량 유량계"
    ]
  },
  "/tools/temperature-converter": {
    "name": "온도 단위 변환기",
    "description": "섭씨(°C), 켈빈(K), 화씨(°F) 상호 변환 및 열에너지 kT(eV) 계산.",
    "keywords": [
      "온도 변환",
      "섭씨",
      "켈빈",
      "열에너지",
      "kT"
    ]
  },
  "/tools/lithography-resolution-calculator": {
    "name": "노광 해상도 및 초점심도 계산기 (Rayleigh)",
    "description": "레일리 공식을 기반으로 파장 λ, 개구수 NA, 공정계수 k1/k2로부터 최소 선폭 해상도 및 DoF 산출.",
    "keywords": [
      "해상도",
      "초점심도",
      "DoF",
      "레일리 공식",
      "개구수",
      "NA"
    ]
  },
  "/tools/etch-rate-calculator": {
    "name": "식각율 및 선택비 계산기",
    "description": "식각 전후 박막 두께와 공정 시간을 기반으로 에칭율(Etch Rate) 및 마스크/하부막 선택비 계산.",
    "keywords": [
      "식각율",
      "선택비",
      "에칭율",
      "플라즈마 식각",
      "습식 식각"
    ]
  },
  "/tools/cd-uniformity-calculator": {
    "name": "임계 선폭 (CD) 균일도 계산기",
    "description": "웨이퍼 멀티포인트 CD 측정 데이터의 평균, 범위, 3-시그마 및 균일도 퍼센트 분석.",
    "keywords": [
      "CD 균일도",
      "임계 선폭",
      "3시그마",
      "면내 균일도"
    ]
  },
  "/tools/film-stress-calculator": {
    "name": "박막 응력 계산기 (Stoney)",
    "description": "웨이퍼 두께 및 성막 전후 곡률반경 변화를 바탕으로 Stoney 공식을 이용해 인장/압축 응력 계산.",
    "keywords": [
      "박막 응력",
      "Stoney 공식",
      "곡률 반경",
      "인장 응력",
      "압축 응력",
      "웨이퍼 휨"
    ]
  },
  "/tools/film-uniformity-calculator": {
    "name": "박막 두께 균일도 계산기",
    "description": "웨이퍼 멀티포인트 측정 두께 데이터로부터 최대, 최소, 평균 및 Half-Range 백분율 균일도 계산.",
    "keywords": [
      "두께 균일도",
      "막두께 균일도",
      "엘립소미터"
    ]
  },
  "/tools/diffusion-length-calculator": {
    "name": "열확산 거리 계산기 (2√Dt)",
    "description": "도펀트 확산 계수 D와 열처리 어닐링 시간 t로부터 특성 확산 거리 2√(Dt) 계산.",
    "keywords": [
      "확산 거리",
      "열확산",
      "어닐링",
      "도펀트 확산",
      "2√Dt"
    ]
  },
  "/tools/arrhenius-calculator": {
    "name": "아레니우스 반응속도 및 활성화 에너지 계산기",
    "description": "빈도인자와 활성화 에너지 Ea로부터 반응속도 계산 또는 두 측정점으로부터 Ea 추출.",
    "keywords": [
      "아레니우스",
      "활성화 에너지",
      "Ea",
      "반응속도",
      "온도 의존성"
    ]
  },
  "/tools/thermal-oxide-calculator": {
    "name": "열산화막 성장 계산기 (Deal-Grove)",
    "description": "Deal-Grove 모델을 사용하여 건식/습식 산화 공정 조건에 따른 실리콘 산화막 두께 계산.",
    "keywords": [
      "열산화",
      "Deal-Grove 모델",
      "건식 산화",
      "습식 산화",
      "산화막 두께"
    ]
  },
  "/tools/power-converter": {
    "name": "RF 전력 및 dBm 변환기",
    "description": "와트(W), 밀리와트(mW), dBm 간의 정밀 상호 변환 및 Vpp 전압 계산.",
    "keywords": [
      "RF 전력",
      "dBm 변환",
      "와트",
      "고주파",
      "Vpp"
    ]
  },
  "/tools/time-constant-calculator": {
    "name": "RC / RL 시정수 계산기",
    "description": "RC 및 RL 회로의 시정수 τ, 상승 시간(Rise Time) 및 과도응답 충방전 특성 계산.",
    "keywords": [
      "시정수",
      "RC 회로",
      "RL 회로",
      "상승 시간",
      "과도 응답"
    ]
  },
  "/tools/rf-power-calculator": {
    "name": "RF 반사 전력 및 흡수 전력 계산기",
    "description": "입사 전력과 반사 전력으로부터 반사계수, 부하 전달 순전력 및 반사손실 계산.",
    "keywords": [
      "RF 전력",
      "반사 전력",
      "입사 전력",
      "반사계수",
      "부하 전력"
    ]
  },
  "/tools/return-loss-calculator": {
    "name": "반사손실 및 정재파비 계산기 (VSWR)",
    "description": "반사손실(Return Loss), 전압정재파비(VSWR), 반사계수(Γ), 반사율 간의 상호 변환.",
    "keywords": [
      "반사손실",
      "VSWR",
      "정재파비",
      "반사계수",
      "임피던스 매칭"
    ]
  },
  "/tools/impedance-matching-calculator": {
    "name": "L형 임피던스 매칭 네트워크 계산기",
    "description": "RF 플라즈마 부하 정합을 위한 저역통과/고역통과 L형 매칭 회로 LC 값 산출.",
    "keywords": [
      "임피던스 매칭",
      "L형 매칭",
      "매처",
      "플라즈마 부하"
    ]
  },
  "/tools/microstrip-calculator": {
    "name": "마이크로스트립 임피던스 계산기",
    "description": "신호선 폭, 절연체 두께, 유전율, 동박 두께로부터 마이크로스트립 특성 임피던스 Z0 계산.",
    "keywords": [
      "마이크로스트립",
      "특성 임피던스",
      "Z0",
      "전송선로"
    ]
  },
  "/tools/stub-matching-calculator": {
    "name": "단일 스터브 임피던스 매칭 계산기",
    "description": "단락 또는 개방 스터브를 이용한 전송선로 임피던스 정합 위치 및 스터브 길이 계산.",
    "keywords": [
      "스터브 매칭",
      "단일 스터브",
      "임피던스 정합"
    ]
  },
  "/tools/bin-yield-calculator": {
    "name": "멀티 Bin 분류 및 테스트 수율 계산기",
    "description": "웨이퍼 프로빙(CP/FT) 다중 Bin 분류 데이터를 바탕으로 Bin별 비율 및 통과 수율 집계.",
    "keywords": [
      "Bin 분류",
      "수율 집계",
      "웨이퍼 테스트",
      "CP 테스트"
    ]
  },
  "/tools/fit-mtbf-calculator": {
    "name": "FIT 및 MTBF 신뢰성 변환기",
    "description": "FIT(10^9시간당 고장률), 고장률 λ 및 평균 무고장 시간(MTBF) 간 정밀 환산.",
    "keywords": [
      "FIT",
      "MTBF",
      "고장률",
      "신뢰성",
      "평균 무고장 시간"
    ]
  },
  "/tools/yield-dppm-calculator": {
    "name": "수율 및 결함 DPPM 변환기",
    "description": "공정 수율(%)과 백만분율 결함 수(DPPM) 간의 고정밀 양방향 환산.",
    "keywords": [
      "DPPM",
      "백만분율",
      "불량률",
      "품질 수준"
    ]
  },
  "/tools/weibull-life-calculator": {
    "name": "와이블 신뢰성 수명 분석기",
    "description": "형상 모수 β와 척도 모수 η를 기반으로 특정 시간에서의 신뢰도 R(t) 및 평균 수명 산출.",
    "keywords": [
      "와이블 분석",
      "Weibull",
      "특성 수명",
      "신뢰도",
      "MTTF"
    ]
  },
  "/tools/spc-control-chart-calculator": {
    "name": "통계적 공정 관리 (SPC) 관리도 계산기",
    "description": "X-bar & R/S 계량형 관리도의 중심선 및 상하 관리한계(UCL/LCL) 계산 및 이상 규칙 검사.",
    "keywords": [
      "SPC",
      "관리도",
      "Xbar-R",
      "관리한계",
      "UCL",
      "LCL"
    ]
  },
  "/tools/acceptance-sampling-calculator": {
    "name": "샘플링 검사 및 합격 확률 계산기 (OC 곡선)",
    "description": "계수형 샘플링 검사 계획(n, c)의 로트 부적합품률에 따른 합격 확률 Pa 및 OC 곡선 산출.",
    "keywords": [
      "샘플링 검사",
      "OC 곡선",
      "합격 확률",
      "AQL"
    ]
  },
  "/tools/ion-implantation-calculator": {
    "name": "이온 주입 투영 비정 및 피크 농도 계산기",
    "description": "이온 주입 에너지 및 도즈량으로부터 투영 비정(Rp), 편차(ΔRp), 피크 도핑 농도 산출.",
    "keywords": [
      "이온 주입",
      "투영 비정",
      "Rp",
      "스트래글링",
      "피크 농도"
    ]
  },
  "/tools/semiconductor-depletion-calculator": {
    "name": "PN 접합 공핍층 폭 및 내장 전위 계산기",
    "description": "도핑 농도와 역방향 바이어스로부터 PN 접합 내장 전위(Vbi), 공핍층 폭(W) 및 접합 커패시턴스 계산.",
    "keywords": [
      "PN 접합",
      "공핍층 폭",
      "내장 전위",
      "접합 용량"
    ]
  },
  "/tools/cleanroom-converter": {
    "name": "클린룸 등급 및 입자 농도 변환기 (ISO / FS209E)",
    "description": "ISO 14644-1 및 미국 연방 규격 FS209E 간의 클린룸 청정도 등급 및 입경별 입자 한계 농도 변환.",
    "keywords": [
      "클린룸 등급",
      "청정도",
      "ISO 14644",
      "FS209E",
      "입자 농도"
    ]
  },
  "/tools/carrier-mobility-calculator": {
    "name": "캐리어 이동도 및 드리프트 속도 계산기",
    "description": "Caughey-Thomas 경험 모델을 바탕으로 도핑 농도에 따른 전자 및 정공 이동도와 포화 드리프트 속도 계산.",
    "keywords": [
      "캐리어 이동도",
      "드리프트 속도",
      "전자 이동도",
      "정공 이동도"
    ]
  },
  "/tools/cmp-preston-calculator": {
    "name": "CMP 가공 제거율 계산기 (Preston)",
    "description": "프레스톤(Preston) 방정식을 기반으로 가공 압력 P, 상대속도 V 및 계수로부터 화학기계연마(CMP) 제거율 계산.",
    "keywords": [
      "CMP",
      "화학기계연마",
      "프레스톤 방정식",
      "제거율"
    ]
  },
  "/tools/film-color-calculator": {
    "name": "산화막 및 질화막 간섭 색상 조견표",
    "description": "빛의 간섭 원리에 따라 열산화막(SiO2) 및 질화막(Si3N4) 두께에 따른 웨이퍼 표면 반사 간섭 색상 예측.",
    "keywords": [
      "박막 색상",
      "간섭색",
      "SiO2 색상",
      "산화막 색상표"
    ]
  },
  "/tools/mosfet-threshold-calculator": {
    "name": "MOSFET 문턱전압 계산기 (Vth)",
    "description": "게이트 산화막 두께, 기판 도핑 농도, 일함수 차이로부터 MOSFET 평탄대역 전압 및 문턱전압(Vth) 계산.",
    "keywords": [
      "MOSFET",
      "문턱전압",
      "Vth",
      "게이트 산화막"
    ]
  },
  "/tools/thermal-fatigue-calculator": {
    "name": "솔더 접합부 열피로 수명 계산기 (Coffin-Manson)",
    "description": "Norris-Landzberg / Coffin-Manson 모델을 이용하여 온도 사이클 시험 조건에서의 패키지 솔더 피로 수명 산출.",
    "keywords": [
      "열피로",
      "솔더 수명",
      "Coffin Manson",
      "온도 사이클"
    ]
  },
  "/tools/thermal-resistance-calculator": {
    "name": "접합부 온도 및 열저항 계산기 (Tj)",
    "description": "소비 전력과 열저항(θjc, θca)으로부터 반도체 접합부 온도(Tj) 계산 및 방열 설계 마진 평가.",
    "keywords": [
      "열저항",
      "접합 온도",
      "Tj",
      "방열 설계"
    ]
  },
  "/tools/wire-bonding-calculator": {
    "name": "와이어 본딩 루프 및 전단/인장강도 계산기",
    "description": "와이어 직경 및 본딩 스팬 지오메트리로부터 루프 전개 길이, 볼 쉐어(Ball Shear) 및 와이어 풀(Pull) 강도 산출.",
    "keywords": [
      "와이어 본딩",
      "루프 높이",
      "볼 쉐어",
      "와이어 풀"
    ]
  },
  "/tools/chemical-dilution-calculator": {
    "name": "화학 케미컬 희석 및 습식 세정 계산기",
    "description": "RCA SC-1/SC-2, 피라냐 SPM, DHF, BOE 완충 불산 용액의 배합 체적, 성분 질량 및 중량%, C1·V1=C2·V2 희석 방정식 및 실리콘 산화막 식각율 계산.",
    "keywords": [
      "케미컬 희석",
      "습식 세정",
      "RCA 세정",
      "SC-1",
      "SC-2",
      "피라냐",
      "SPM",
      "불산 희석",
      "DHF",
      "BOE",
      "습식 벤치",
      "식각 속도",
      "산화막 식각"
    ]
  },
  "/tools/plasma-sheath-calculator": {
    "name": "플라즈마 시스 & 드바이 길이 계산기",
    "description": "전자 드바이 길이(Debye Length), 보름 속도(Bohm Velocity), Child-Langmuir RF 바이어스 시스 두께, 플라즈마 주파수 및 이온 충돌성 해석.",
    "keywords": [
      "플라즈마 시스",
      "드바이 길이",
      "보름 속도",
      "보름 기준",
      "Child Langmuir",
      "시스 두께",
      "플라즈마 주파수",
      "RF 바이어스",
      "RIE 식각",
      "ICP 플라즈마",
      "평균 자유 행로"
    ]
  },
  "/tools/ald-cycle-calculator": {
    "name": "원자층 증착 (ALD) 사이클 및 전구체 노출 계산기",
    "description": "원자층 증착(ALD) 사이클 시퀀스, 랭뮤어(Langmuir) 흡착 포화도(θ), 사이클당 증착 두께(GPC), 총 박막 두께 및 전구체 소모량 정밀 계산.",
    "keywords": [
      "원자층 증착",
      "ALD",
      "ALD 사이클",
      "GPC",
      "포화 곡선",
      "랭뮤어",
      "전구체 노출",
      "퍼지 시간",
      "TMA",
      "Al2O3",
      "HfO2",
      "단차 피복성",
      "전구체 소모량"
    ]
  },
  "/tools/dopant-diffusion-calculator": {
    "name": "도펀트 열확산 및 접합 깊이 계산기 (xj)",
    "description": "일정 표면 농도(erfc) 및 한정 표면원(가우시안 분포) 실리콘 열확산, 아레니우스 확산 계수 D(T) (B, P, As, Sb), 야금학적 접합 깊이 xj 및 산화막 마스크 두께 계산.",
    "keywords": [
      "도펀트 확산",
      "열확산",
      "접합 깊이",
      "xj",
      "픽의 법칙",
      "프리데포지션",
      "드라이브인",
      "가우시안 확산",
      "erfc",
      "붕소 확산",
      "인 확산",
      "열 예산",
      "산화막 마스크"
    ]
  },
  "/tools/cvd-kinetics-calculator": {
    "name": "CVD 및 에피택시 성장 속도·반응 역학 계산기",
    "description": "Grove 경계층 물질 전달 모델 및 아레니우스 표면 반응 속도론을 바탕으로 CVD/에피택시 박막 성장 속도, 율속 단계 전이 온도 및 전구체 고갈 균일도 계산.",
    "keywords": [
      "CVD",
      "화학기상증착",
      "에피택시",
      "성장 속도",
      "Grove 모델",
      "경계층",
      "물질 전달 율속",
      "표면 반응 율속",
      "아레니우스",
      "실란",
      "LPCVD",
      "TEOS"
    ]
  },
  "/tools/four-point-probe-calculator": {
    "name": "4포인트 프로브 비저항 및 면저항 계산기 (ASTM F84)",
    "description": "ASTM F84 / SEMI MF84 표준 직선 4탐침 면저항, 웨이퍼 체적 비저항, 유한 두께 기하학 보정 계수 및 NIST 도펀트 농도 역산 계산기.",
    "keywords": [
      "4탐침",
      "포포인트 프로브",
      "ASTM F84",
      "SEMI MF84",
      "면저항",
      "비저항",
      "두께 보정",
      "도핑 농도"
    ]
  },
  "/tools/split-lot-calculator": {
    "name": "Split-Lot 및 DOE 레시피 비교 계산기",
    "description": "반도체 스플릿 롯 및 실험계획법(DOE) 레시피 오버레이 매트릭스, 웨이퍼별 공정 파라미터 변동 모니터링, 응답 델타 비교 및 공정 트래블러 내보내기.",
    "keywords": [
      "스플릿 롯",
      "split lot",
      "DOE",
      "실험계획법",
      "레시피 비교",
      "웨이퍼 트래블러",
      "공정 편차",
      "클린룸 런시트"
    ]
  },
  "/tools/curve-fitting-calculator": {
    "name": "곡선 피팅 및 반응 동역학 파라미터 추출 계산기",
    "description": "반도체 키네틱 파라미터 추출: 아레니우스 활성화 에너지(Ea), Deal-Grove 산화 속도 상수(B, B/A) 및 최소제곱 선형 회귀와 R² 적합도 분석.",
    "keywords": [
      "곡선 피팅",
      "아레니우스 피팅",
      "활성화 에너지",
      "Deal-Grove 파라미터",
      "선형 회귀",
      "파라미터 추출",
      "반응 속도론",
      "산화 속도 상수"
    ]
  },
  "/tools/arde-etch-calculator": {
    "name": "고종횡비 식각 (ARDE) 및 마이크로로딩 계산기",
    "description": "종횡비 의존성 식각(ARDE / RIE Lag), 패턴 밀도 마이크로로딩 효과 및 마스크 선택비와 측벽 테이퍼 각도 시뮬레이션.",
    "keywords": [
      "ARDE",
      "RIE 래그",
      "마이크로로딩",
      "종횡비",
      "식각률",
      "선택비",
      "테이퍼 각도",
      "플라즈마 식각"
    ]
  },
  "/tools/cmp-endpoint-calculator": {
    "name": "CMP 종말점 검출 및 패드 수명 계산기",
    "description": "화학기계적 연마(CMP) 모터 전류 종말점(EPD), 광학 간섭 무늬 주기 및 다이아몬드 컨디셔너 패드 홈 마모 수명 예측.",
    "keywords": [
      "CMP",
      "종말점",
      "EPD",
      "패드 수명",
      "컨디셔닝",
      "광학 간섭",
      "평탄화",
      "그루브 마모"
    ]
  },
  "/tools/wafer-warp-stress-calculator": {
    "name": "웨이퍼 보우·와프 및 박막 잔류응력 계산기",
    "description": "Stoney 공식을 이용한 박막 잔류 응력, 웨이퍼 보우(Bow) 및 와프(Warp) 곡률 반경 환산, 열팽창계수 부정합 열응력 및 임계 균열 두께 계산.",
    "keywords": [
      "Stoney 공식",
      "웨이퍼 보우",
      "웨이퍼 와프",
      "박막 응력",
      "열팽창 불일치",
      "이축 탄성계수",
      "잔류 응력",
      "곡률 반경"
    ]
  },
  "/tools/wet-bench-calculator": {
    "name": "웨트 벤치 화학 약액 수명 및 스파이크 보충 계산기",
    "description": "RCA 세정(SC-1/SC-2), SPM 피라냐, BOE 식각 배스 수명 평가, 화학 약액 스파이크 보충량 및 용해 실리콘 누적 감쇠 모델.",
    "keywords": [
      "웨트 벤치",
      "RCA 세정",
      "SC-1",
      "SC-2",
      "피라냐",
      "SPM",
      "BOE",
      "약액 보충",
      "배스 수명",
      "식각조"
    ]
  },
  "/tools/cu-plating-calculator": {
    "name": "구리 전기도금 및 다마신 슈퍼필링 계산기",
    "description": "구리 전기화학 증착(ECD), 듀얼 다마신 트렌치 바텀업 슈퍼필링, 시드층 터미널 효과 및 패러데이 전기분해 역학 계산.",
    "keywords": [
      "구리 도금",
      "전기도금",
      "ECD",
      "다마신",
      "슈퍼필링",
      "패러데이 법칙",
      "터미널 효과",
      "전류 밀도"
    ]
  }
};

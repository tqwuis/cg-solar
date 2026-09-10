## 거리의 단위를 무엇으로 정했는가? 왜 그렇게 정했는가?
### 1000km, 지구 반지름이 1000km가 넘기 때문이다.


## 숫자가 커서 생긴 문제가 있었는가? 있었다면 무엇인가?
### 지구의 반지름 대비 인공위성 크기가 너무 작아 사라지는 문제가 있었다.


## 달·위성이 지구를 향하게 만든 것은 어느 변환 단계 덕분인가?
### T 이후 Rz하므로 방향이 고정됨

## 어떤 변환을 어디에 추가했는가? 물체마다 따로 넣었는가, 공통으로 넣었는가?
### 스케일 변환을 마지막에 한번 하도록 추가했다. 모든 물체에 공통으로 0.1배 하도록 했다.

## 실제 비율을 유지한 채로 넣었는가? 유지했다면 화면에서 무엇이 보이는가?
### 실제 비율을 유지하였다. 지구밖에 안보인다.

## 실제 비율이 정보를 전달하기에 적합한지 판단하고 그 이유를 쓰세요.
### 인공위성이 실제 비율로 했을 때 너무 작기에 적합하지 않다.

## 더 나은 표현 방법을 하나 이상 제안하고 실제로 만들어 보세요. (예: 크기만 과장하기, 거리를 로그로 압축하기, 축척 막대를 함께 보여 주기 등)
### 달의 거리만 사용자가 볼 수 있을 정도로만 축소했다. 인공 위성의 크기만 1000배 확대했다.

## 제안한 방법의 장점과 잃는 것을 함께 쓰세요.
### 장점: 사용자가 모든 물체를 명확히 인식이 가능하다. 단점: 달과 지구의 거리가 가까워 보이고, 인공위성이 실제보다 크게 보이는 문제가 있다.

# 세 Task 각각의 변환 입력값 전체와 설명
## task1(https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiNzAiLCJ5IjoiNzAiLCJ6IjoiNzAifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlMiLCJhcmdzIjpbIjYuMzcxIiwiNi4zNzEiLCI2LjM3MSJdfV19LHsiaWQiOiJtb29uIiwibmFtZSI6IuuLrCIsImNvbG9yIjpbMC43OCwwLjc4LDAuODJdLCJzdGVwcyI6W3sidHlwZSI6IlJ6IiwiYXJncyI6WyJ0KjAuMzYiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiMzg0LjQiLCIwIiwiMCJdfSx7InR5cGUiOiJTIiwiYXJncyI6WyIxLjczNyIsIjEuNzM3IiwiMS43MzciXX1dfSx7ImlkIjoic2F0IiwibmFtZSI6IuyduOqzteychOyEsSIsImNvbG9yIjpbMC45NSwwLjcyLDAuMzVdLCJzdGVwcyI6W3sidHlwZSI6IlJ5IiwiYXJncyI6WyI0My4wMDIiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMTUwLjI3NSJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyI2Ljg2MTE2IiwiMCIsIjAiXX0seyJ0eXBlIjoiUyIsImFyZ3MiOlsiMC4wMDAxMTYwMyIsIjAuMDAwMTE2MDMiLCIwLjAwMDExNjAzIl19LHsidHlwZSI6IlJ5IiwiYXJncyI6WyI5MCJdfV19XX0%3D)
{
  "range": {
    "x": "70",
    "y": "70",
    "z": "70"
  },
  "objects": [
    {
      "id": "earth",
      "name": "지구",
      "color": [
        0.35,
        0.6,
        0.95
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "6.371",
            "6.371",
            "6.371"
          ]
        }
      ]
    },
    {
      "id": "moon",
      "name": "달",
      "color": [
        0.78,
        0.78,
        0.82
      ],
      "steps": [
        {
          "type": "Rz",
          "args": [
            "t*0.36"
          ]
        },
        {
          "type": "T",
          "args": [
            "384.4",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "1.737",
            "1.737",
            "1.737"
          ]
        }
      ]
    },
    {
      "id": "sat",
      "name": "인공위성",
      "color": [
        0.95,
        0.72,
        0.35
      ],
      "steps": [
        {
          "type": "Ry",
          "args": [
            "43.002"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*150.275"
          ]
        },
        {
          "type": "T",
          "args": [
            "6.86116",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "0.00011603",
            "0.00011603",
            "0.00011603"
          ]
        },
        {
          "type": "Ry",
          "args": [
            "90"
          ]
        }
      ]
    }
  ]
}
## task2(https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiMSIsInkiOiIxIiwieiI6IjEifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlMiLCJhcmdzIjpbIjAuMDAyIiwiMC4wMDIiLCIwLjAwMiJdfSx7InR5cGUiOiJTIiwiYXJncyI6WyI2LjM3MSIsIjYuMzcxIiwiNi4zNzEiXX1dfSx7ImlkIjoibW9vbiIsIm5hbWUiOiLri6wiLCJjb2xvciI6WzAuNzgsMC43OCwwLjgyXSwic3RlcHMiOlt7InR5cGUiOiJTIiwiYXJncyI6WyIwLjAwMiIsIjAuMDAyIiwiMC4wMDIiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMC4zNiJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyIzODQuNCIsIjAiLCIwIl19LHsidHlwZSI6IlMiLCJhcmdzIjpbIjEuNzM3IiwiMS43MzciLCIxLjczNyJdfV19LHsiaWQiOiJzYXQiLCJuYW1lIjoi7J246rO17JyE7ISxIiwiY29sb3IiOlswLjk1LDAuNzIsMC4zNV0sInN0ZXBzIjpbeyJ0eXBlIjoiUyIsImFyZ3MiOlsiMC4wMDIiLCIwLjAwMiIsIjAuMDAyIl19LHsidHlwZSI6IlJ5IiwiYXJncyI6WyI0My4wMDIiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMTUwLjI3NSJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyI2Ljg2MTE2IiwiMCIsIjAiXX0seyJ0eXBlIjoiUyIsImFyZ3MiOlsiMC4wMDAxMTYwMyIsIjAuMDAwMTE2MDMiLCIwLjAwMDExNjAzIl19LHsidHlwZSI6IlJ5IiwiYXJncyI6WyI5MCJdfV19XX0%3D)
{
  "range": {
    "x": "1",
    "y": "1",
    "z": "1"
  },
  "objects": [
    {
      "id": "earth",
      "name": "지구",
      "color": [
        0.35,
        0.6,
        0.95
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.002",
            "0.002",
            "0.002"
          ]
        },
        {
          "type": "S",
          "args": [
            "6.371",
            "6.371",
            "6.371"
          ]
        }
      ]
    },
    {
      "id": "moon",
      "name": "달",
      "color": [
        0.78,
        0.78,
        0.82
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.002",
            "0.002",
            "0.002"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*0.36"
          ]
        },
        {
          "type": "T",
          "args": [
            "384.4",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "1.737",
            "1.737",
            "1.737"
          ]
        }
      ]
    },
    {
      "id": "sat",
      "name": "인공위성",
      "color": [
        0.95,
        0.72,
        0.35
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.002",
            "0.002",
            "0.002"
          ]
        },
        {
          "type": "Ry",
          "args": [
            "43.002"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*150.275"
          ]
        },
        {
          "type": "T",
          "args": [
            "6.86116",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "0.00011603",
            "0.00011603",
            "0.00011603"
          ]
        },
        {
          "type": "Ry",
          "args": [
            "90"
          ]
        }
      ]
    }
  ]
}
## task3(https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiMSIsInkiOiIxIiwieiI6IjEifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlMiLCJhcmdzIjpbIjAuMDIiLCIwLjAyIiwiMC4wMiJdfSx7InR5cGUiOiJTIiwiYXJncyI6WyI2LjM3MSIsIjYuMzcxIiwiNi4zNzEiXX1dfSx7ImlkIjoibW9vbiIsIm5hbWUiOiLri6wiLCJjb2xvciI6WzAuNzgsMC43OCwwLjgyXSwic3RlcHMiOlt7InR5cGUiOiJTIiwiYXJncyI6WyIwLjAyIiwiMC4wMiIsIjAuMDIiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMC4zNiJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyIzOC40NCIsIjAiLCIwIl19LHsidHlwZSI6IlMiLCJhcmdzIjpbIjEuNzM3IiwiMS43MzciLCIxLjczNyJdfV19LHsiaWQiOiJzYXQiLCJuYW1lIjoi7J246rO17JyE7ISxIiwiY29sb3IiOlswLjk1LDAuNzIsMC4zNV0sInN0ZXBzIjpbeyJ0eXBlIjoiUyIsImFyZ3MiOlsiMC4wMiIsIjAuMDIiLCIwLjAyIl19LHsidHlwZSI6IlJ5IiwiYXJncyI6WyI0My4wMDIiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqMTUwLjI3NSJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyI2Ljg2MTE2IiwiMCIsIjAiXX0seyJ0eXBlIjoiUyIsImFyZ3MiOlsiMC4xMTYwMyIsIjAuMTE2MDMiLCIwLjExNjAzIl19LHsidHlwZSI6IlJ5IiwiYXJncyI6WyI5MCJdfV19XX0%3D)
{
  "range": {
    "x": "1",
    "y": "1",
    "z": "1"
  },
  "objects": [
    {
      "id": "earth",
      "name": "지구",
      "color": [
        0.35,
        0.6,
        0.95
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.02",
            "0.02",
            "0.02"
          ]
        },
        {
          "type": "S",
          "args": [
            "6.371",
            "6.371",
            "6.371"
          ]
        }
      ]
    },
    {
      "id": "moon",
      "name": "달",
      "color": [
        0.78,
        0.78,
        0.82
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.02",
            "0.02",
            "0.02"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*0.36"
          ]
        },
        {
          "type": "T",
          "args": [
            "38.44",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "1.737",
            "1.737",
            "1.737"
          ]
        }
      ]
    },
    {
      "id": "sat",
      "name": "인공위성",
      "color": [
        0.95,
        0.72,
        0.35
      ],
      "steps": [
        {
          "type": "S",
          "args": [
            "0.02",
            "0.02",
            "0.02"
          ]
        },
        {
          "type": "Ry",
          "args": [
            "43.002"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*150.275"
          ]
        },
        {
          "type": "T",
          "args": [
            "6.86116",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "0.11603",
            "0.11603",
            "0.11603"
          ]
        },
        {
          "type": "Ry",
          "args": [
            "90"
          ]
        }
      ]
    }
  ]
}
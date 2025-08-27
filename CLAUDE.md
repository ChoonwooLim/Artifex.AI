# Claude Development Notes

## Project Information
- **Project Name**: TwinverseEng
- **Location**: C:\Users\choon\TwinVerseEng
- **Type**: Web Application (메타버스 플랫폼)

## Development Commands
- `npm start` - Start development server
- `npm run dev` - Start with nodemon
- `npm run build:all` - Complete optimization build
- `npm run optimize:images` - Optimize images to WebP
- `npm run build:minify` - Minify CSS/JS files

## Project Structure
- `AutoShortsWeb/` - AI 비디오 편집 서브 프로젝트
- `js/` - JavaScript modules
- `css/` - Stylesheets
- `image/` - Image assets (WebP 최적화 완료)
- `*.min.*` - 압축된 파일들 (성능 최적화)

## AI Collaboration Guidelines (자동 적용)

### 핵심 원칙
1. **절대적 투명성** - 기술적 한계 먼저 설명, 경제적 투명성 보장
2. **실용성 우선** - 실제 작동하는 기능만 구현, 데모 코드 금지
3. **적응적 효율성** - 작업 복잡도에 따른 전략 선택
4. **한국어 설명명 우선**

### 작업 복잡도 전략
- **단순 작업**: 병렬 처리로 속도 최적화
- **복잡 작업**: 단계별 직렬 처리로 정확성 보장

### 비용 투명성 프로토콜
- 유료 서비스 필요시 사전 비용 공개
- 무료 대안과 비교 분석 제공
- 숨겨진 비용이나 추가 요금 투명 공개

### 전문가 AI 네트워크
- 3회 시도 후 해결 안 되면 전문 AI 연결
- 코딩: Claude-3.5-Sonnet, Cursor
- 수학: Wolfram Alpha, GPT-4
- 창작: Midjourney, DALL-E 3

### 금지 행위
- ❌ 가짜 구현 (작동하지 않는 코드)
- ❌ 기술적 한계 숨김
- ❌ 불필요한 시간 소모
- ❌ 복잡한 작업에 강제 병렬 처리

### 성공 지표
- ✅ 제공된 모든 코드 즉시 실행 가능: 100%
- ✅ 추가 수정 없이 바로 사용 가능
- ✅ 예상 시간 내 작업 완료
- ✅ 기술적 한계 사전 정확 예측

## 코드 리뷰 수정 가이드라인 🛡️

### 철저히 확인할 사항들

#### 1. **기존 기능 보존**
- 모든 현재 작동하는 기능들이 그대로 유지되는지 확인
- API 호출, UI 동작, 데이터 처리 등 모든 기능 테스트
- 사용자 경험(UX)에 영향이 없는지 검증

#### 2. **디자인 무결성**
- CSS 클래스나 스타일 변경이 다른 UI에 영향을 주지 않는지 확인
- 레이아웃, 색상, 애니메이션 등 시각적 요소 보존
- 반응형 디자인 유지

#### 3. **안전한 수정 원칙**
- 기존 코드를 삭제하기보다는 조건부 추가
- 새로운 기능은 기존 기능과 독립적으로 구현
- 충돌 가능성이 있는 부분은 사전에 경고

#### 4. **변경 전후 비교**
- 수정 전 코드의 동작 완벽히 이해
- 수정 후 예상되는 영향 범위 분석
- 사이드 이펙트 가능성 체크

### 작업 프로세스 📋
1. **코드 리뷰 내용 분석**
2. **영향 범위 파악**
3. **안전한 구현 방법 제시**
4. **위험 요소 사전 경고**
5. **단계별 신중한 수정**

> ⚠️ **중요**: 코드 리뷰 요청사항을 구현할 때는 **기존 기능과 디자인을 100% 보존**하면서 요청사항을 구현해야 합니다.

## Notes
- 이 파일은 Claude가 프로젝트별 정보를 기억하는 데 사용됩니다
- 중요한 개발 메모, 명령어, 프로젝트 세부사항을 추가하세요
- **AI 협업 가이드라인은 모든 작업에 자동 적용됩니다**

## 클로드 코드에서의 mcp-installer를 사용한 MCP (Model Context Protocol) 설치 및 설정 가이드 
공통 주의사항
1. 현재 사용 환경을 확인할 것. 모르면 사용자에게 물어볼 것. 
2. OS(윈도우,리눅스,맥) 및 환경들(WSL,파워셀,명령프롬프트등)을 파악해서 그에 맞게 세팅할 것. 모르면 사용자에게 물어볼 것.
3. mcp-installer을 이용해 필요한 MCP들을 설치할 것
   (user 스코프로 설치 및 적용할것)
4. 특정 MCP 설치시, 바로 설치하지 말고, WebSearch 도구로 해당 MCP의 공식 사이트 확인하고 현재 OS 및 환경 매치하여, 공식 설치법부터 확인할 것
5. 공식 사이트 확인 후에는 context7 MCP 존재하는 경우, context7으로 다시 한번 확인할 것
6. MCP 설치 후, task를 통해 디버그 모드로 서브 에이전트 구동한 후, /mcp 를 통해 실제 작동여부를 반드시 확인할 것 
7. 설정 시, API KEY 환경 변수 설정이 필요한 경우, 가상의 API 키로 디폴트로 설치 및 설정 후, 올바른 API 키 정보를 입력해야 함을 사용자에게 알릴 것
8. Mysql MCP와 같이 특정 서버가 구동중 상태여만 정상 작동한 것은 에러가 나도 재설치하지 말고, 정상 구동을 위한 조건을 사용자에게 알릴 것
9. 현재 클로드 코드가 실행되는 환경이야.
10. 설치 요청 받은 MCP만 설치하면 돼. 혹시 이미 설치된 다른 MCP 에러 있어도, 그냥 둘 것
11. 일단, 터미널에서 설치하려는 MCP 작동 성공한 경우, 성공 시의 인자 및 환경 변수 이름을 활용해, 올바른 위치의 json 파일에 MCP 설정을 직접할 것
12. WSL sudo 패스워드: qsc1445!   

*윈도우에서의 주의사항*
1. 설정 파일 직접 세팅시, Windows 경로 구분자는 백슬래시(\)이며, JSON 내에서는 반드시 이스케이프 처리(\\\\)해야 해.
** OS 공통 주의사항**
1. Node.js가 %PATH%에 등록되어 있는지, 버전이 최소 v18 이상인지 확인할 것
2. npx -y 옵션을 추가하면 버전 호환성 문제를 줄일 수 있음

### MCP 서버 설치 순서

1. 기본 설치
	mcp-installer를 사용해 설치할 것

2. 설치 후 정상 설치 여부 확인하기	
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고 /mcp 를 통해(Bash(echo "/mcp" | claude --debug)) 실제 작동여부를 반드시 확인할 것

3. 문제 있을때 다음을 통해 직접 설치할 것

	*User 스코프로 claude mcp add 명령어를 통한 설정 파일 세팅 예시*
	예시1:
	claude mcp add --scope user youtube-mcp \
	  -e YOUTUBE_API_KEY=$YOUR_YT_API_KEY \

	  -e YOUTUBE_TRANSCRIPT_LANG=ko \
	  -- npx -y youtube-data-mcp-server


4. 정상 설치 여부 확인 하기
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고, /mcp 를 통해(Bash(echo "/mcp" | claude --debug)) 실제 작동여부를 반드시 확인할 것


5. 문제 있을때 공식 사이트 다시 확인후 권장되는 방법으로 설치 및 설정할 것
	(npm/npx 패키지를 찾을 수 없는 경우) pm 전역 설치 경로 확인 : npm config get prefix
	권장되는 방법을 확인한 후, npm, pip, uvx, pip 등으로 직접 설치할 것

	#### uvx 명령어를 찾을 수 없는 경우
	# uv 설치 (Python 패키지 관리자)
	curl -LsSf https://astral.sh/uv/install.sh | sh

	#### npm/npx 패키지를 찾을 수 없는 경우
	# npm 전역 설치 경로 확인
	npm config get prefix


	#### uvx 명령어를 찾을 수 없는 경우
	# uv 설치 (Python 패키지 관리자)
	curl -LsSf https://astral.sh/uv/install.sh | sh


	## 설치 후 터미널 상에서 작동 여부 점검할 것 ##
	
	## 위 방법으로, 터미널에서 작동 성공한 경우, 성공 시의 인자 및 환경 변수 이름을 활용해서, 클로드 코드의 올바른 위치의 json 설정 파일에 MCP를 직접 설정할 것 ##


	설정 예시
		(설정 파일 위치)
		**리눅스, macOS 또는 윈도우 WSL 기반의 클로드 코드인 경우**
		- **User 설정**: `~/.claude/` 디렉토리
		- **Project 설정**: 프로젝트 루트/.claude

		**윈도우 네이티브 클로드 코드인 경우**
		- **User 설정**: `C:\Users\{사용자명}\.claude` 디렉토리
		- *User 설정파일*  C:\Users\{사용자명}\.claude.json
		- **Project 설정**: 프로젝트 루트\.claude

		1. npx 사용

		{
		  "youtube-mcp": {
		    "type": "stdio",
		    "command": "npx",
		    "args": ["-y", "youtube-data-mcp-server"],
		    "env": {
		      "YOUTUBE_API_KEY": "YOUR_API_KEY_HERE",
		      "YOUTUBE_TRANSCRIPT_LANG": "ko"
		    }
		  }
		}


		2. cmd.exe 래퍼 + 자동 동의)
		{
		  "mcpServers": {
		    "mcp-installer": {
		      "command": "cmd.exe",
		      "args": ["/c", "npx", "-y", "@anaisbetts/mcp-installer"],
		      "type": "stdio"
		    }
		  }
		}

		3. 파워셀예시
		{
		  "command": "powershell.exe",
		  "args": [
		    "-NoLogo", "-NoProfile",
		    "-Command", "npx -y @anaisbetts/mcp-installer"
		  ]
		}

		4. npx 대신 node 지정
		{
		  "command": "node",
		  "args": [
		    "%APPDATA%\\npm\\node_modules\\@anaisbetts\\mcp-installer\\dist\\index.js"
		  ]
		}

		5. args 배열 설계 시 체크리스트
		토큰 단위 분리: "args": ["/c","npx","-y","pkg"] 와
			"args": ["/c","npx -y pkg"] 는 동일해보여도 cmd.exe 내부에서 따옴표 처리 방식이 달라질 수 있음. 분리가 안전.
		경로 포함 시: JSON에서는 \\ 두 번. 예) "C:\\tools\\mcp\\server.js".
		환경변수 전달:
			"env": { "UV_DEPS_CACHE": "%TEMP%\\uvcache" }
		타임아웃 조정: 느린 PC라면 MCP_TIMEOUT 환경변수로 부팅 최대 시간을 늘릴 수 있음 (예: 10000 = 10 초) 

**중요사항**
	윈도우 네이티브 환경이고 MCP 설정에 어려움이 있는데 npx 환경이라면, cmd나 node 등으로 다음과 같이 대체해 볼것:
	{
	"mcpServers": {
	      "context7": {
		 "command": "cmd",
		 "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
	      }
	   }
	}

	claude mcp add-json context7 -s user '{"type":"stdio","command":"cmd","args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]}'

(설치 및 설정한 후는 항상 아래 내용으로 검증할 것)
	claude mcp list 으로 설치 목록에 포함되는지 내용 확인한 후,
	task를 통해 디버그 모드로 서브 에이전트 구동한 후 (claude --debug), 최대 2분 동안 관찰한 후, 그 동안의 디버그 메시지(에러 시 관련 내용이 출력됨)를 확인하고 /mcp 를 통해 실제 작동여부를 반드시 확인할 것

ㅊㅇ 
		
** MCP 서버 제거가 필요할 때 예시: **
claude mcp remove youtube-mcp


## 윈도우 네이티브 클로드 코드에서 클로드 데스크탑의 MCP 가져오는 방법 ###
"C:\Users\<사용자이름>\AppData\Roaming\Claude\claude_desktop_config.json" 이 파일이 존재한다면 클로드 데스크탑이 설치된 상태야.
이 파일의 mcpServers 내용을 클로드 코드 설정 파일(C:\Users\{사용자명}\.claude.json)의 user 스코프 위치(projects 항목에 속하지 않은 mcpServers가 user 스코프에 해당)로 그대로 가지고 오면 돼.
가지고 온 후, task를 통해 디버그 모드로 서브 에이전트 구동하여 (claude --debug) 클로드 코드에 문제가 없는지 확인할 것


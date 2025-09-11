# 🎯 PopOS WAN 하이엔드 시스템 마스터 플랜

> **Version**: 1.0.0  
> **Created**: 2025-01-11  
> **Status**: Active Development  
> **Target**: Enterprise-Grade AI Video Generation System

---

## 📌 Quick Reference

### 현재 진행 상태
- **Current Phase**: Phase 1 - Infrastructure Setup
- **Progress**: 10% (Planning Complete)
- **Next Milestone**: PopOS Server Environment Setup
- **Blocker**: None

### 다음 작업
1. PopOS 서버 Python 환경 구축
2. Flash Attention 2.0 설치 및 검증
3. 기본 WAN 서버 구동 테스트

### 중요 결정 사항
- ✅ PopOS 모델 실행 방식 채택 (Windows는 클라이언트만)
- ✅ Flash Attention 2.0 필수 적용
- ✅ 10Gbps 직접 연결 활용
- ✅ 듀얼 GPU 파이프라인 병렬 처리

---

## 🏗️ Architecture Overview

### 시스템 다이어그램
```
┌─────────────────────────────────────────────────────────┐
│                   Windows Client (Artifex.AI)            │
├─────────────────────────────────────────────────────────┤
│  - UI/UX Layer (React + TypeScript)                      │
│  - Request Manager                                       │
│  - WebSocket Client                                      │
│  - Result Cache & Viewer                                 │
└────────────────────┬───────────────────────────────────┘
                     │ 10Gbps Direct Connection
                     │ (10.0.0.1 ←→ 10.0.0.2)
┌────────────────────┴───────────────────────────────────┐
│                   PopOS Server (10.0.0.2)               │
├─────────────────────────────────────────────────────────┤
│  - API Gateway (Port 8001)                              │
│  - Model Manager (Cached in Memory)                      │
│  - Flash Attention Engine                               │
│  - Dual GPU Orchestrator (2x RTX 3090)                  │
│  - TensorRT Optimizer                                   │
│  - Result Storage & CDN                                 │
└─────────────────────────────────────────────────────────┘
```

### 기술 스택
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **GPU** | NVIDIA RTX 3090 x2 | Driver 545+ | Compute |
| **OS** | Pop!_OS 22.04 LTS | Latest | Server |
| **Python** | Python | 3.10+ | Runtime |
| **ML Framework** | PyTorch | 2.2.0+cu121 | Deep Learning |
| **Attention** | Flash Attention | 2.5.0 | Optimization |
| **API** | FastAPI | 0.109.0 | REST API |
| **WebSocket** | Socket.IO | 4.6.0 | Real-time |
| **Cache** | Redis | 7.2 | Memory Cache |

---

## 📊 Performance Targets

### 목표 성능 지표
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **5초 SD (480p)** | 60s | 8s | **7.5x** |
| **5초 HD (720p)** | 90s | 12s | **7.5x** |
| **5초 FHD (1080p)** | 120s | 20s | **6x** |
| **5초 4K (2160p)** | N/A | 30s | **New** |
| **5초 8K (4320p)** | N/A | 60s | **New** |
| **VRAM Usage** | 20GB | 10GB | **50%** |
| **Batch Size** | 1 | 4-8 | **4-8x** |
| **Concurrent Jobs** | 1 | 4 | **4x** |

### 품질 기준
- **Temporal Consistency**: > 0.95
- **Frame Quality (PSNR)**: > 30dB
- **Color Accuracy (Delta E)**: < 2.0
- **Motion Smoothness**: 60fps capable
- **Resolution Support**: Up to 8K

---

## 🚀 Implementation Phases

### Phase 1: Infrastructure Setup (Week 1)
- [x] Master plan creation
- [ ] PopOS server environment setup
- [ ] Python dependencies installation
- [ ] Network optimization (MTU 9000)
- [ ] GPU driver and CUDA setup
- [ ] Flash Attention installation
- [ ] Basic connectivity test

### Phase 2: Core Server Implementation (Week 1-2)
- [ ] popos_wan_server_pro.py creation
- [ ] Model loading and caching system
- [ ] API endpoint implementation
- [ ] WebSocket server setup
- [ ] Basic generation pipeline
- [ ] Error handling and logging
- [ ] Unit tests

### Phase 3: Windows Client Integration (Week 2)
- [ ] PopOSModelService.ts implementation
- [ ] Enhanced WAN View UI
- [ ] WebSocket client integration
- [ ] Progress streaming
- [ ] Result display optimization
- [ ] Error handling UI
- [ ] Integration tests

### Phase 4: Advanced Features (Week 3)
- [ ] Dual GPU orchestration
- [ ] Batch processing system
- [ ] Quality presets implementation
- [ ] Real-time preview streaming
- [ ] Advanced scheduling
- [ ] Performance monitoring
- [ ] Load testing

### Phase 5: Optimization & Tuning (Week 3-4)
- [ ] TensorRT integration
- [ ] Model quantization
- [ ] Memory optimization
- [ ] Cache strategies
- [ ] Network optimization
- [ ] Benchmark suite
- [ ] Performance profiling

### Phase 6: Enterprise Features (Week 4+)
- [ ] Multi-user support
- [ ] Authentication system
- [ ] Queue management
- [ ] Cloud storage integration
- [ ] CDN setup
- [ ] API documentation
- [ ] Production deployment

---

## 💻 Code Standards

### Python (PopOS Server)
```python
# File naming: snake_case
popos_wan_server.py
dual_gpu_manager.py

# Class naming: PascalCase
class ModelManager:
    pass

# Function naming: snake_case
def load_model(model_name: str) -> Model:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_BATCH_SIZE = 8
DEFAULT_STEPS = 30
```

### TypeScript (Windows Client)
```typescript
// File naming: PascalCase
PopOSModelService.ts
EnhancedWANView.tsx

// Interface naming: I prefix
interface IGenerationRequest {
    prompt: string;
    model: ModelType;
}

// Type naming: T suffix
type ModelConfigT = {
    name: string;
    path: string;
}

// Component naming: PascalCase
const QualitySettings: React.FC = () => {}
```

### Error Handling
```python
# Always use typed exceptions
class ModelLoadError(Exception):
    """Raised when model fails to load"""
    pass

# Always log errors with context
logger.error(f"Failed to load model {model_name}", exc_info=True)

# Always return structured errors
return {
    "success": False,
    "error": {
        "code": "MODEL_LOAD_ERROR",
        "message": str(e),
        "details": {...}
    }
}
```

### Logging Standards
```python
# Log levels
DEBUG: Detailed diagnostic info
INFO: General informational messages
WARNING: Warning messages
ERROR: Error messages
CRITICAL: Critical failures

# Format
[2025-01-11 10:30:45] [INFO] [module.function] Message here
```

---

## 🔧 Technical Specifications

### API Specification
```yaml
API Base URL: http://10.0.0.2:8001/api/v1

Endpoints:
  POST /generate
    Request:
      - prompt: string
      - model: enum[t2v, i2v, ti2v, s2v]
      - quality: enum[draft, standard, pro, cinema, ultimate]
      - options: object
    Response:
      - job_id: string
      - status: enum[queued, processing, completed, failed]
      - eta: integer (seconds)
      
  GET /status/{job_id}
    Response:
      - status: string
      - progress: float (0-1)
      - eta: integer
      - preview_url: string (optional)
      
  GET /result/{job_id}
    Response:
      - status: string
      - output_url: string
      - metadata: object
      
  WebSocket /ws
    Events:
      - progress: {job_id, progress, eta}
      - preview: {job_id, frame_url}
      - complete: {job_id, output_url}
      - error: {job_id, error}
```

### Data Formats
```typescript
// Generation Request
interface GenerationRequest {
    prompt: string;
    negative_prompt?: string;
    model: 't2v-A14B' | 'i2v-A14B' | 'ti2v-5B' | 's2v-14B';
    quality_preset: QualityPreset;
    seed?: number;
    custom_options?: {
        steps?: number;
        cfg_scale?: number;
        resolution?: string;
        fps?: number;
        duration?: number;
    };
}

// Generation Response
interface GenerationResponse {
    job_id: string;
    status: JobStatus;
    created_at: string;
    eta_seconds: number;
    queue_position?: number;
}

// Quality Presets
enum QualityPreset {
    DRAFT = 'draft',        // Fast preview
    STANDARD = 'standard',  // Normal quality
    PROFESSIONAL = 'pro',   // High quality
    CINEMA = 'cinema',      // Cinema grade
    ULTIMATE = 'ultimate'   // Maximum quality
}
```

---

## 📝 Decision Log

### 2025-01-11: Architecture Decision
- **Decision**: Use PopOS for all model execution
- **Rationale**: 3-4x performance improvement with Flash Attention
- **Impact**: Requires network optimization but massive speed gain

### 2025-01-11: GPU Strategy
- **Decision**: Pipeline Parallelism over Data Parallelism
- **Rationale**: Better memory efficiency for large models
- **Impact**: More complex implementation but better resource utilization

### 2025-01-11: Caching Strategy
- **Decision**: Keep models in memory with Redis cache
- **Rationale**: Eliminate model loading time (10-15s saved per request)
- **Impact**: Requires 32GB+ system RAM

---

## ⚠️ Known Issues & Solutions

### Resolved Issues
1. **Flash Attention Windows Incompatibility**
   - Solution: Run all processing on PopOS
   - Status: ✅ Resolved

2. **Network Latency Concerns**
   - Solution: 10Gbps direct connection + streaming
   - Status: ✅ Resolved

### Active Issues
1. **Model Memory Footprint**
   - Issue: All models in memory need 40GB+
   - Workaround: Selective loading based on usage
   - Status: 🔄 In Progress

### Potential Issues
1. **Dual GPU Sync**
   - Risk: Pipeline stalls between GPUs
   - Mitigation: Async queue between stages
   - Status: 📋 Planned

---

## 📈 Progress Tracking

### Completed (10%)
- ✅ Architecture design
- ✅ Performance analysis
- ✅ Master plan creation
- ✅ Initial PopOS worker test

### In Progress (Current Sprint)
- 🔄 PopOS environment setup
- 🔄 Flash Attention installation
- 🔄 Basic server implementation

### Upcoming (Next Sprint)
- 📋 Windows client integration
- 📋 WebSocket streaming
- 📋 Quality presets
- 📋 Dual GPU optimization

### Backlog
- 📋 TensorRT optimization
- 📋 Batch processing
- 📋 Multi-user support
- 📋 Cloud integration

---

## 🧪 Testing Strategy

### Unit Tests
- Model loading
- API endpoints
- GPU memory management
- Error handling

### Integration Tests
- End-to-end generation
- WebSocket communication
- Multi-GPU coordination
- Cache coherency

### Performance Tests
- Throughput benchmarks
- Latency measurements
- Memory profiling
- Network utilization

### Load Tests
- Concurrent requests
- Queue management
- Resource limits
- Failure recovery

---

## 📚 References

### Documentation
- [Flash Attention Paper](https://arxiv.org/abs/2205.14135)
- [PyTorch DDP Guide](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [TensorRT Documentation](https://docs.nvidia.com/deeplearning/tensorrt/)

### Model Paths
```bash
# PopOS Server Paths
/home/choon/Wan2.2-T2V-A14B/
/home/choon/Wan2.2-I2V-A14B/
/home/choon/Wan2.2-TI2V-5B/
/home/choon/Wan2.2-S2V-14B/
```

### Key Commands
```bash
# Start PopOS Server
python3 ~/popos_wan_server_pro.py

# Monitor GPU
watch -n 1 nvidia-smi

# Check Flash Attention
python3 -c "import flash_attn; print(flash_attn.__version__)"

# Network Test
iperf3 -c 10.0.0.2 -t 10
```

---

## 🎯 Success Criteria

1. **Performance**: All targets met or exceeded
2. **Quality**: No regression in output quality
3. **Reliability**: 99.9% uptime
4. **Scalability**: Support 10+ concurrent users
5. **Maintainability**: Clean, documented code

---

## 📞 Contact & Support

- **Project Lead**: Artifex.AI Team
- **PopOS Server**: 10.0.0.2:8001
- **Windows Client**: 10.0.0.1
- **Documentation**: /docs/popos-implementation/

---

*This document is the single source of truth for the PopOS WAN implementation. All development must align with this plan.*
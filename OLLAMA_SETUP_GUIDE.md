# Ollama Setup Guide for Artifex.AI

## 1. Install Ollama on Windows

### Method 1: Manual Installation (Recommended)
1. Download Ollama from: https://ollama.com/download/windows
2. Run the installer (OllamaSetup.exe)
3. Follow the installation wizard
4. Ollama will be installed to: `C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\`

### Method 2: Using our script
```batch
cd C:\WORK\Artifex.AI\scripts
install-ollama.bat
```

## 2. Verify Installation

Open a new Command Prompt or PowerShell and run:
```bash
ollama --version
```

If not found, add to PATH:
```powershell
$env:Path += ";C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama"
```

## 3. Start Ollama Service

```bash
ollama serve
```

Keep this running in a separate terminal.

## 4. Download Qwen2-VL-7B Model

In a new terminal:
```bash
# Primary model (7GB, multimodal vision-language)
ollama pull qwen2-vl:7b

# Alternative if qwen2-vl is not available
ollama pull llava:7b
```

## 5. Test the Model

```bash
# Test text generation
ollama run qwen2-vl:7b "Hello, can you see images?"

# List installed models
ollama list
```

## 6. Configure for Artifex.AI

The LocalLLMService is already configured to use Ollama:
- Default URL: http://localhost:11434
- Default Model: qwen2-vl:7b
- Located at: `app/renderer/autoshorts/services/LocalLLMService.ts`

## 7. API Endpoints

Ollama provides these endpoints:
- `/api/generate` - Text generation
- `/api/chat` - Chat completions
- `/api/tags` - List models
- `/api/show` - Model information
- `/api/pull` - Download model
- `/api/push` - Upload model
- `/api/copy` - Copy model
- `/api/delete` - Delete model

## 8. Using in Application

```typescript
import { LocalLLMService } from './services/LocalLLMService';

const llm = new LocalLLMService({
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'qwen2-vl:7b'
});

// Check if Ollama is running
const isHealthy = await llm.checkHealth();

// Multimodal chat
const response = await llm.chat([
  {
    role: 'user',
    content: 'What do you see in this image?',
    images: ['base64_image_data_here']
  }
]);

// Generate video script
const script = await llm.generateVideoScript('AI Technology', referenceImages);
```

## 9. Troubleshooting

### Ollama not found
- Ensure Ollama is installed
- Add to PATH environment variable
- Restart terminal after installation

### Connection refused
- Start Ollama service: `ollama serve`
- Check firewall settings
- Verify port 11434 is not in use

### Model not found
- Pull the model: `ollama pull qwen2-vl:7b`
- Check available models: `ollama list`

### Out of memory
- Close other applications
- Use smaller model: `ollama pull qwen2-vl:2b`
- Adjust context size in LocalLLMService

## 10. Performance Tips

- **GPU Acceleration**: Ollama automatically uses NVIDIA GPU if available
- **Model Loading**: First request may be slow as model loads into memory
- **Keep Alive**: Model stays in memory for 5 minutes by default
- **Batch Processing**: Process multiple requests together for efficiency

## System Requirements

- **Minimum**: 8GB RAM, 10GB disk space
- **Recommended**: 16GB RAM, NVIDIA GPU with 8GB+ VRAM
- **Your System**: RTX 3090 (24GB VRAM) - Perfect for Qwen2-VL-7B!

## Next Steps

1. Install Ollama
2. Download Qwen2-VL-7B model
3. Test with the application
4. Configure settings as needed
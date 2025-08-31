import axios from 'axios';

export interface AudioConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
  format?: 'mp3' | 'wav' | 'ogg';
}

export class AudioAIService {
  private config: AudioConfig;

  constructor(config: AudioConfig) {
    this.config = config;
  }

  /**
   * 로컬 TTS 모델 사용 (Bark, Tortoise, Piper 등)
   */
  async generateLocalTTS(request: TTSRequest): Promise<Blob> {
    // Bark 사용 예시
    if (this.config.provider === 'bark') {
      return this.generateWithBark(request);
    }
    
    // Piper 사용 예시
    if (this.config.provider === 'piper') {
      return this.generateWithPiper(request);
    }

    throw new Error(`Unsupported local provider: ${this.config.provider}`);
  }

  /**
   * Bark TTS 생성
   */
  private async generateWithBark(request: TTSRequest): Promise<Blob> {
    try {
      // 로컬 Bark 서버 호출 (Python 서버가 필요)
      const response = await axios.post('http://localhost:8080/bark/generate', {
        text: request.text,
        voice_preset: request.voice || 'v2/ko_speaker_1',
        format: request.format || 'mp3'
      }, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Bark TTS error:', error);
      // 데모용 대체 음성 생성
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * Piper TTS 생성
   */
  private async generateWithPiper(request: TTSRequest): Promise<Blob> {
    try {
      const response = await axios.post('http://localhost:8081/piper/generate', {
        text: request.text,
        model: 'ko_KR-glow_tts',
        format: request.format || 'wav'
      }, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Piper TTS error:', error);
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * 네이버 CLOVA Voice API
   */
  async generateClovaTTS(request: TTSRequest): Promise<Blob> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('CLOVA API 키가 필요합니다');
    }

    try {
      const response = await axios.post(
        'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts',
        new URLSearchParams({
          speaker: request.voice || 'nara',
          volume: String(request.volume || 0),
          speed: String(request.speed || 0),
          pitch: String(request.pitch || 0),
          format: request.format || 'mp3',
          text: request.text
        }),
        {
          headers: {
            'X-NCP-APIGW-API-KEY-ID': apiKey.split(':')[0],
            'X-NCP-APIGW-API-KEY': apiKey.split(':')[1],
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('CLOVA TTS error:', error);
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * 카카오 음성 합성 API
   */
  async generateKakaoTTS(request: TTSRequest): Promise<Blob> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('Kakao API 키가 필요합니다');
    }

    try {
      const response = await axios.post(
        'https://kakaoi-newtone-openapi.kakao.com/v1/synthesize',
        {
          text: request.text,
          voice: request.voice || 'WOMAN_READ_CALM'
        },
        {
          headers: {
            'Authorization': `KakaoAK ${apiKey}`,
            'Content-Type': 'application/xml'
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Kakao TTS error:', error);
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * OpenAI TTS API
   */
  async generateOpenAITTS(request: TTSRequest): Promise<Blob> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('OpenAI API 키가 필요합니다');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: request.text,
          voice: request.voice || 'alloy',
          response_format: request.format || 'mp3',
          speed: request.speed || 1.0
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * ElevenLabs TTS API
   */
  async generateElevenLabsTTS(request: TTSRequest): Promise<Blob> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('ElevenLabs API 키가 필요합니다');
    }

    try {
      const voiceId = request.voice || '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: request.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return this.generateDemoAudio(request.text);
    }
  }

  /**
   * Web Speech API를 사용한 브라우저 기반 TTS (무료)
   */
  async generateBrowserTTS(request: TTSRequest): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('브라우저가 음성 합성을 지원하지 않습니다'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(request.text);
      
      // 한국어 음성 찾기
      const voices = speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }
      
      utterance.lang = request.language || 'ko-KR';
      utterance.rate = request.speed || 1.0;
      utterance.pitch = request.pitch || 1.0;
      utterance.volume = request.volume || 1.0;

      // MediaRecorder를 사용해 오디오 캡처 (Chrome에서만 작동)
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      utterance.onend = () => {
        mediaRecorder.stop();
      };

      mediaRecorder.start();
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * 데모용 오디오 생성 (실제 TTS가 아닌 더미 오디오)
   */
  private async generateDemoAudio(text: string): Promise<Blob> {
    // 간단한 비프음 생성
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 440; // A4 음
    oscillator.type = 'sine';
    
    // 텍스트 길이에 비례한 지속 시간
    const duration = Math.min(text.length * 0.05, 5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    // MediaRecorder를 사용해 오디오 녹음
    const destination = audioContext.createMediaStreamDestination();
    oscillator.connect(destination);
    
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: Blob[] = [];
    
    return new Promise((resolve) => {
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
      
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), duration * 1000);
    });
  }

  /**
   * 통합 TTS 생성 메서드
   */
  async generateTTS(request: TTSRequest): Promise<Blob> {
    switch (this.config.provider) {
      case 'bark':
      case 'tortoise':
      case 'piper':
      case 'coqui':
        return this.generateLocalTTS(request);
      
      case 'clova':
        return this.generateClovaTTS(request);
      
      case 'kakao':
        return this.generateKakaoTTS(request);
      
      case 'openai-tts':
        return this.generateOpenAITTS(request);
      
      case 'elevenlabs':
        return this.generateElevenLabsTTS(request);
      
      case 'browser':
      default:
        return this.generateBrowserTTS(request);
    }
  }
}
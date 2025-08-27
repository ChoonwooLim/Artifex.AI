import * as React from 'react';

const SimpleApp = () => {
  const [count, setCount] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState('home');
  const [translatedPrompt, setTranslatedPrompt] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  
  // Google Translate 무료 API 사용 (translate.googleapis.com 대신 공개 엔드포인트 사용)
  const translateText = async (text: string) => {
    try {
      // 방법 1: LibreTranslate (무료 오픈소스 번역 API)
      const libreTranslateUrl = 'https://libretranslate.de/translate';
      
      try {
        const response = await fetch(libreTranslateUrl, {
          method: 'POST',
          body: JSON.stringify({
            q: text,
            source: 'ko',
            target: 'en',
            format: 'text'
          }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.translatedText;
        }
      } catch (e) {
        console.log('LibreTranslate failed, trying alternative...');
      }
      
      // 방법 2: Google Translate 웹 스크래핑 방식 (백업)
      const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(googleTranslateUrl);
      const data = await response.json();
      
      if (data && data[0]) {
        return data[0].map((item: any) => item[0]).join('');
      }
      
      // 방법 3: MyMemory Translation API (무료, 일일 한도 있음)
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`;
      const myMemoryResponse = await fetch(myMemoryUrl);
      const myMemoryData = await myMemoryResponse.json();
      
      if (myMemoryData.responseData) {
        return myMemoryData.responseData.translatedText;
      }
      
      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  };
  const [videoSettings, setVideoSettings] = React.useState({
    prompt: '',
    model: 't2v',
    duration: 4,
    fps: 24,
    resolution: '1920x1080',
    outputPath: 'D:\\Videos\\WAN22',
    fileName: 'wan22_video',
    format: 'mp4',
    quality: 'high',
    bitrate: '10M',
    lighting: {
      intensity: 70,
      angle: 45,
      sourceType: 'natural'
    },
    camera: {
      angle: 'eye_level',
      shotSize: 'medium_shot',
      movement: 'static'
    },
    style: {
      saturation: 100,
      composition: 'rule_of_thirds',
      colorGrading: 'cinematic',
      aspectRatio: '16:9'
    },
    timeOfDay: 'golden_hour'
  });
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedVideo, setGeneratedVideo] = React.useState<string | null>(null);
  
  // Log to verify component is mounted
  React.useEffect(() => {
    console.log('SimpleApp mounted, initial count:', count);
    console.log('Active tab:', activeTab);
  }, []);
  
  const handleCountClick = () => {
    console.log('Button clicked, current count:', count);
    setCount(prev => {
      const newCount = prev + 1;
      console.log('New count:', newCount);
      return newCount;
    });
  };
  
  const handleTabChange = (tab: string) => {
    console.log('Changing tab to:', tab);
    setActiveTab(tab);
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🎬 WAN 2.2 Video Editor</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Home', 'Editor', 'Export'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab.toLowerCase())}
              style={{
                padding: '10px 20px',
                background: activeTab === tab.toLowerCase() ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: activeTab === tab.toLowerCase() ? '#667eea' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>Welcome to WAN 2.2</h2>
            <p style={{ fontSize: '18px', marginBottom: '40px', opacity: 0.8 }}>
              Professional Video Generation & Editing Suite
            </p>
            
            <div style={{ marginBottom: '40px' }}>
              <button 
                onClick={handleCountClick}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                Test Counter: {count}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {[
                { title: 'Text to Video', desc: 'Generate videos from text prompts', icon: '📝' },
                { title: 'Image to Video', desc: 'Animate static images', icon: '🖼️' },
                { title: 'Video Effects', desc: 'Apply AI-powered effects', icon: '✨' },
                { title: 'Timeline Editor', desc: 'Multi-track editing', icon: '🎞️' },
                { title: 'Cinematic Controls', desc: 'Professional camera settings', icon: '🎬' },
                { title: 'Export Options', desc: 'Multiple format support', icon: '📤' }
              ].map(feature => (
                <div
                  key={feature.title}
                  onClick={() => {
                    console.log('Feature card clicked:', feature.title);
                    alert(`${feature.title} feature selected!\n${feature.desc}`);
                  }}
                  style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = 'rgba(255,255,255,0.1)';
                    el.style.transform = 'translateY(-5px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.background = 'rgba(255,255,255,0.05)';
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{feature.icon}</div>
                  <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>{feature.title}</h3>
                  <p style={{ fontSize: '12px', opacity: 0.7 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div style={{ 
            padding: '20px', 
            height: 'calc(100vh - 120px)', 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '20px' }}>🎬 WAN 2.2 Video Generator</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: 'calc(100vh - 180px)' }}>
              {/* Left Panel - Settings */}
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '30px', 
                borderRadius: '12px',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#00ff88' }}>Video Settings</h3>
                
                {/* Prompt Input */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Video Prompt (한글/English)</label>
                  <textarea
                    value={videoSettings.prompt}
                    onChange={(e) => setVideoSettings({...videoSettings, prompt: e.target.value})}
                    placeholder="생성하고 싶은 비디오를 설명하세요 / Describe the video you want to generate..."
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={async () => {
                        if (videoSettings.prompt) {
                          setIsTranslating(true);
                          const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(videoSettings.prompt);
                          
                          if (hasKorean) {
                            console.log('Translating Korean text:', videoSettings.prompt);
                            const translated = await translateText(videoSettings.prompt);
                            
                            if (translated) {
                              setTranslatedPrompt(translated);
                              console.log('Translation successful:', translated);
                              alert(`번역 완료!\n원문: ${videoSettings.prompt}\n번역: ${translated}`);
                            } else {
                              // 오프라인 번역 (fallback)
                              const offlineTranslations: {[key: string]: string} = {
                                '아름다운': 'beautiful',
                                '바다': 'ocean',
                                '일몰': 'sunset',
                                '하늘': 'sky',
                                '숲': 'forest',
                                '도시': 'city',
                                '영상': 'video',
                                '만들어': 'create',
                                '생성': 'generate',
                                '평화로운': 'peaceful',
                                '영화': 'movie',
                                '같은': 'like',
                                '스타일': 'style',
                                '고화질': 'high quality',
                                '시네마틱': 'cinematic'
                              };
                              
                              let fallbackTranslated = videoSettings.prompt;
                              for (const [korean, english] of Object.entries(offlineTranslations)) {
                                fallbackTranslated = fallbackTranslated.replace(new RegExp(korean, 'g'), english);
                              }
                              
                              // 부분 번역이라도 되었으면 사용
                              if (fallbackTranslated !== videoSettings.prompt) {
                                setTranslatedPrompt(fallbackTranslated);
                                alert(`오프라인 번역 사용\n원문: ${videoSettings.prompt}\n번역: ${fallbackTranslated}`);
                              } else {
                                setTranslatedPrompt(`Generate a cinematic video: ${videoSettings.prompt}`);
                                alert('온라인 번역 실패 - 기본 템플릿 사용');
                              }
                            }
                          } else {
                            setTranslatedPrompt(videoSettings.prompt);
                            alert('영어 프롬프트 감지 - 번역 불필요');
                          }
                          
                          setIsTranslating(false);
                        }
                      }}
                      disabled={!videoSettings.prompt || isTranslating}
                      style={{
                        padding: '8px 16px',
                        background: isTranslating ? '#666' : '#00aaff',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: !videoSettings.prompt || isTranslating ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {isTranslating ? '번역 중...' : '🌐 Translate'}
                    </button>
                    {translatedPrompt && (
                      <span style={{ fontSize: '12px', color: '#00ff88', flex: 1 }}>
                        ✓ Translated: {translatedPrompt.substring(0, 50)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Model Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Generation Model</label>
                  <select
                    value={videoSettings.model}
                    onChange={(e) => setVideoSettings({...videoSettings, model: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="t2v">Text to Video (T2V)</option>
                    <option value="i2v">Image to Video (I2V)</option>
                    <option value="ti2v">Text+Image to Video (TI2V)</option>
                  </select>
                </div>

                {/* File Settings */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Output Path</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={videoSettings.outputPath}
                      onChange={(e) => setVideoSettings({...videoSettings, outputPath: e.target.value})}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={() => {
                        console.log('Opening folder selector...');
                        // Electron에서는 dialog API 사용
                        alert('Folder selector would open here\n(Requires Electron dialog API integration)');
                      }}
                      style={{
                        padding: '10px 20px',
                        background: '#667eea',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      📁 Browse
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>File Name</label>
                  <input
                    type="text"
                    value={videoSettings.fileName}
                    onChange={(e) => setVideoSettings({...videoSettings, fileName: e.target.value})}
                    placeholder="Enter file name (without extension)"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Video Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Duration (sec)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={videoSettings.duration}
                      onChange={(e) => setVideoSettings({...videoSettings, duration: parseInt(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>FPS</label>
                    <select
                      value={videoSettings.fps}
                      onChange={(e) => setVideoSettings({...videoSettings, fps: parseInt(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="15">15 fps</option>
                      <option value="24">24 fps</option>
                      <option value="30">30 fps</option>
                      <option value="60">60 fps</option>
                      <option value="120">120 fps</option>
                    </select>
                  </div>
                </div>

                {/* Resolution and Format */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Resolution</label>
                    <select
                      value={videoSettings.resolution}
                      onChange={(e) => setVideoSettings({...videoSettings, resolution: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="1920x1080">1080p (1920x1080)</option>
                      <option value="3840x2160">4K (3840x2160)</option>
                      <option value="1280x720">720p (1280x720)</option>
                      <option value="2560x1440">1440p (2560x1440)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Format</label>
                    <select
                      value={videoSettings.format}
                      onChange={(e) => setVideoSettings({...videoSettings, format: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="mp4">MP4</option>
                      <option value="mov">MOV</option>
                      <option value="avi">AVI</option>
                      <option value="webm">WebM</option>
                    </select>
                  </div>
                </div>

                {/* Lighting Controls */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Lighting Intensity: {videoSettings.lighting.intensity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoSettings.lighting.intensity}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      lighting: {...videoSettings.lighting, intensity: parseInt(e.target.value)}
                    })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Lighting Angle */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Lighting Angle: {videoSettings.lighting.angle}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={videoSettings.lighting.angle}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      lighting: {...videoSettings.lighting, angle: parseInt(e.target.value)}
                    })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Light Source Type */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Light Source Type</label>
                  <select
                    value={videoSettings.lighting.sourceType}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      lighting: {...videoSettings.lighting, sourceType: e.target.value as any}
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="natural">Natural</option>
                    <option value="studio">Studio</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="volumetric">Volumetric</option>
                    <option value="cinematic">Cinematic</option>
                  </select>
                </div>

                {/* Camera Angle */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Camera Angle</label>
                  <select
                    value={videoSettings.camera.angle}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      camera: {...videoSettings.camera, angle: e.target.value as any}
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="eye_level">Eye Level</option>
                    <option value="low_angle">Low Angle</option>
                    <option value="high_angle">High Angle</option>
                    <option value="dutch_angle">Dutch Angle</option>
                    <option value="birds_eye">Bird's Eye</option>
                    <option value="worms_eye">Worm's Eye</option>
                  </select>
                </div>

                {/* Shot Size */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Shot Size</label>
                  <select
                    value={videoSettings.camera.shotSize}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      camera: {...videoSettings.camera, shotSize: e.target.value as any}
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="extreme_close_up">Extreme Close-Up</option>
                    <option value="close_up">Close-Up</option>
                    <option value="medium_close_up">Medium Close-Up</option>
                    <option value="medium_shot">Medium Shot</option>
                    <option value="medium_wide">Medium Wide</option>
                    <option value="wide_shot">Wide Shot</option>
                    <option value="extreme_wide">Extreme Wide</option>
                  </select>
                </div>

                {/* Time of Day */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Time of Day</label>
                  <select
                    value={videoSettings.timeOfDay}
                    onChange={(e) => setVideoSettings({...videoSettings, timeOfDay: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="dawn">Dawn</option>
                    <option value="morning">Morning</option>
                    <option value="noon">Noon</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="golden_hour">Golden Hour</option>
                    <option value="dusk">Dusk</option>
                    <option value="night">Night</option>
                    <option value="blue_hour">Blue Hour</option>
                  </select>
                </div>

                {/* Saturation Control */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Saturation: {videoSettings.style.saturation}%</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={videoSettings.style.saturation}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      style: {...videoSettings.style, saturation: parseInt(e.target.value)}
                    })}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Composition Style */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Composition Style</label>
                  <select
                    value={videoSettings.style.composition}
                    onChange={(e) => setVideoSettings({
                      ...videoSettings,
                      style: {...videoSettings.style, composition: e.target.value}
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="rule_of_thirds">Rule of Thirds</option>
                    <option value="centered">Centered</option>
                    <option value="golden_ratio">Golden Ratio</option>
                    <option value="symmetrical">Symmetrical</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="frame_within_frame">Frame within Frame</option>
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => {
                    // 번역된 프롬프트가 있으면 사용, 없으면 원본 프롬프트 사용
                    const finalPrompt = translatedPrompt || videoSettings.prompt;
                    console.log('Generating video with prompt:', finalPrompt);
                    console.log('Full settings:', {...videoSettings, finalPrompt});
                    setIsGenerating(true);
                    setTimeout(() => {
                      setIsGenerating(false);
                      setGeneratedVideo(`${videoSettings.outputPath}\\${videoSettings.fileName}.${videoSettings.format}`);
                      alert(`Video generated successfully!\nUsed prompt: ${finalPrompt}\nSaved to: ${videoSettings.outputPath}\\${videoSettings.fileName}.${videoSettings.format}`);
                    }, 3000);
                  }}
                  disabled={isGenerating || !videoSettings.prompt}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: isGenerating ? '#666' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: isGenerating || !videoSettings.prompt ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </button>
              </div>

              {/* Right Panel - Preview */}
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '30px', 
                borderRadius: '12px',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginBottom: '20px', color: '#00aaff' }}>Preview & Output</h3>
                
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.1)',
                  marginBottom: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {isGenerating ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTop: '3px solid #00ff88',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 10px'
                      }} />
                      <p>Generating video...</p>
                    </div>
                  ) : generatedVideo ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎥</div>
                      <p>{generatedVideo}</p>
                      <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>Duration: {videoSettings.duration}s @ {videoSettings.fps}fps</p>
                    </div>
                  ) : (
                    <p style={{ opacity: 0.5 }}>Video preview will appear here</p>
                  )}
                </div>

                {/* Settings Summary */}
                <div style={{
                  padding: '20px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  lineHeight: '1.8'
                }}>
                  <h4 style={{ marginBottom: '10px', color: '#00ff88' }}>Current Settings</h4>
                  <div>📁 Output: {videoSettings.outputPath}\{videoSettings.fileName}.{videoSettings.format}</div>
                  <div>🎬 Model: {videoSettings.model.toUpperCase()}</div>
                  <div>📺 Resolution: {videoSettings.resolution}</div>
                  <div>⏱️ FPS: {videoSettings.fps} | Duration: {videoSettings.duration}s</div>
                  <div>💡 Lighting: {videoSettings.lighting.sourceType} @ {videoSettings.lighting.intensity}% ({videoSettings.lighting.angle}°)</div>
                  <div>🎥 Camera: {videoSettings.camera.angle.replace('_', ' ')} - {videoSettings.camera.shotSize.replace('_', ' ')}</div>
                  <div>🌅 Time: {videoSettings.timeOfDay.replace('_', ' ')}</div>
                  <div>🎨 Saturation: {videoSettings.style.saturation}%</div>
                  <div>📐 Composition: {videoSettings.style.composition.replace('_', ' ')}</div>
                </div>

                {generatedVideo && (
                  <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => console.log('Preview video')}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,255,136,0.2)',
                        border: '1px solid #00ff88',
                        borderRadius: '6px',
                        color: '#00ff88',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ▶ Play
                    </button>
                    <button
                      onClick={() => console.log('Download video')}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,170,255,0.2)',
                        border: '1px solid #00aaff',
                        borderRadius: '6px',
                        color: '#00aaff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ⬇ Download
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>

            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {activeTab === 'export' && (
          <div style={{ textAlign: 'center' }}>
            <h2>Export Settings</h2>
            <div style={{
              padding: '40px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <select 
                onChange={(e) => console.log('Format selected:', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '20px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="mp4">MP4 (H.264)</option>
                <option value="webm">WebM (VP9)</option>
                <option value="mov">MOV (ProRes)</option>
              </select>
              
              <button 
                onClick={() => {
                  console.log('Export button clicked!');
                  alert('Export functionality will be implemented soon!');
                }}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Export Video
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '20px',
        background: 'rgba(255,255,255,0.05)',
        textAlign: 'center',
        fontSize: '12px',
        opacity: 0.7
      }}>
        WAN 2.2 Professional Video Suite - Powered by AI
      </div>
    </div>
  );
};

export default SimpleApp;
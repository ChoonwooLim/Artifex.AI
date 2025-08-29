import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  text-align: center;
`;

const InputSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const UploadArea = styled.div<{ isDragging?: boolean }>`
  border: 2px dashed ${props => props.isDragging ? '#667eea' : '#4a5568'};
  border-radius: 1rem;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.isDragging ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  
  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 0.5rem;
  font-size: 0.9rem;
`;

const PreviewContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #1a202c;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin-top: 1rem;
`;

const ControlSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PromptInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  color: #e2e8f0;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const Parameter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #a0aec0;
`;

const Input = styled.input`
  padding: 0.5rem;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  color: #e2e8f0;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 0.5rem;
  color: #e2e8f0;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #1a202c;
  border-radius: 1rem;
  overflow: hidden;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const StatusMessage = styled.div<{ type?: 'error' | 'success' | 'info' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  background: ${props => {
    switch (props.type) {
      case 'error': return 'rgba(245, 101, 101, 0.1)';
      case 'success': return 'rgba(72, 187, 120, 0.1)';
      default: return 'rgba(102, 126, 234, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'error': return '#fc8181';
      case 'success': return '#48bb78';
      default: return '#90cdf4';
    }
  }};
`;

export const SpeechToVideoView: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [poseVideo, setPoseVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingPose, setIsDraggingPose] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [inferFrames, setInferFrames] = useState(80);
  const [numRepeat, setNumRepeat] = useState(1);
  const [steps, setSteps] = useState(40);
  const [guideScale, setGuideScale] = useState(5.0);
  const [seed, setSeed] = useState(-1);
  const [fps, setFps] = useState(16);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const poseInputRef = useRef<HTMLInputElement>(null);

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3'))) {
      setAudioFile(file);
    }
  };

  const handlePoseDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPose(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setPoseVideo(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handlePoseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoseVideo(file);
    }
  };

  const handleGenerate = async () => {
    if (!referenceImage || !audioFile) {
      setStatus({ message: 'Please provide both reference image and audio', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatus({ message: 'Initializing Speech-to-Video generation...', type: 'info' });

    const formData = new FormData();
    formData.append('reference_image', referenceImage);
    formData.append('audio', audioFile);
    if (poseVideo) {
      formData.append('pose_video', poseVideo);
    }
    formData.append('prompt', prompt || 'A person speaking naturally');
    formData.append('negative_prompt', negativePrompt);
    formData.append('infer_frames', inferFrames.toString());
    formData.append('num_repeat', numRepeat.toString());
    formData.append('steps', steps.toString());
    formData.append('guide_scale', guideScale.toString());
    formData.append('seed', seed.toString());
    formData.append('fps', fps.toString());

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
      }, 1000);

      const response = await window.electronAPI.generateS2V(formData);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setGeneratedVideo(response.videoPath);
        setStatus({ message: 'Video generated successfully!', type: 'success' });
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container>
      <Title>Speech to Video Generation</Title>
      
      <InputSection>
        <Card>
          <h3>Reference Image</h3>
          <UploadArea
            isDragging={isDraggingImage}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={handleImageDrop}
            onClick={() => imageInputRef.current?.click()}
          >
            {imagePreview ? (
              <PreviewContainer>
                <PreviewImage src={imagePreview} alt="Reference" />
              </PreviewContainer>
            ) : (
              <>
                <p>Drag & drop reference image here or click to browse</p>
                <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                  Supported: JPG, PNG, WebP
                </p>
              </>
            )}
          </UploadArea>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          {referenceImage && (
            <FileInfo>
              📷 {referenceImage.name} ({(referenceImage.size / 1024 / 1024).toFixed(2)} MB)
            </FileInfo>
          )}
        </Card>

        <Card>
          <h3>Audio Input</h3>
          <UploadArea
            isDragging={isDraggingAudio}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingAudio(true); }}
            onDragLeave={() => setIsDraggingAudio(false)}
            onDrop={handleAudioDrop}
            onClick={() => audioInputRef.current?.click()}
          >
            {audioFile ? (
              <>
                <p>🎵 Audio file loaded</p>
                <AudioPlayer controls>
                  <source src={URL.createObjectURL(audioFile)} type={audioFile.type} />
                </AudioPlayer>
              </>
            ) : (
              <>
                <p>Drag & drop audio file here or click to browse</p>
                <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                  Supported: WAV, MP3
                </p>
              </>
            )}
          </UploadArea>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioSelect}
            style={{ display: 'none' }}
          />
          {audioFile && (
            <FileInfo>
              🎵 {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </FileInfo>
          )}
        </Card>
      </InputSection>

      <Card>
        <h3>Pose Video (Optional)</h3>
        <UploadArea
          isDragging={isDraggingPose}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingPose(true); }}
          onDragLeave={() => setIsDraggingPose(false)}
          onDrop={handlePoseDrop}
          onClick={() => poseInputRef.current?.click()}
        >
          {poseVideo ? (
            <p>🎬 Pose video loaded: {poseVideo.name}</p>
          ) : (
            <>
              <p>Drag & drop pose video here (optional)</p>
              <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                Use a pose video to guide the motion
              </p>
            </>
          )}
        </UploadArea>
        <input
          ref={poseInputRef}
          type="file"
          accept="video/*"
          onChange={handlePoseSelect}
          style={{ display: 'none' }}
        />
        {poseVideo && (
          <FileInfo>
            🎬 {poseVideo.name} ({(poseVideo.size / 1024 / 1024).toFixed(2)} MB)
          </FileInfo>
        )}
      </Card>

      <Card>
        <ControlSection>
          <div>
            <Label>Prompt (describe the speaking person)</Label>
            <PromptInput
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A person speaking naturally with clear lip sync..."
            />
          </div>
          
          <div>
            <Label>Negative Prompt</Label>
            <PromptInput
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, out of sync..."
            />
          </div>

          <ParameterGrid>
            <Parameter>
              <Label>Frames per Clip</Label>
              <Input
                type="number"
                value={inferFrames}
                onChange={(e) => setInferFrames(Number(e.target.value))}
                min="4"
                max="240"
                step="4"
              />
            </Parameter>
            
            <Parameter>
              <Label>Number of Clips</Label>
              <Input
                type="number"
                value={numRepeat}
                onChange={(e) => setNumRepeat(Number(e.target.value))}
                min="1"
                max="10"
              />
            </Parameter>
            
            <Parameter>
              <Label>Sampling Steps</Label>
              <Input
                type="number"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                min="10"
                max="100"
              />
            </Parameter>
            
            <Parameter>
              <Label>Guidance Scale</Label>
              <Input
                type="number"
                value={guideScale}
                onChange={(e) => setGuideScale(Number(e.target.value))}
                min="1"
                max="20"
                step="0.5"
              />
            </Parameter>
            
            <Parameter>
              <Label>FPS</Label>
              <Select value={fps} onChange={(e) => setFps(Number(e.target.value))}>
                <option value="8">8 FPS</option>
                <option value="12">12 FPS</option>
                <option value="16">16 FPS</option>
                <option value="24">24 FPS</option>
                <option value="30">30 FPS</option>
              </Select>
            </Parameter>
            
            <Parameter>
              <Label>Seed (-1 for random)</Label>
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                min="-1"
              />
            </Parameter>
          </ParameterGrid>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !referenceImage || !audioFile}
            style={{ marginTop: '1rem' }}
          >
            {isGenerating ? 'Generating...' : 'Generate Speech Video'}
          </Button>
        </ControlSection>
      </Card>

      {isGenerating && (
        <Card>
          <ProgressBar progress={progress} />
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#a0aec0' }}>
            Generating speech-synchronized video... This may take several minutes.
          </p>
        </Card>
      )}

      {status && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}

      {generatedVideo && (
        <Card>
          <h3>Generated Video</h3>
          <VideoContainer>
            <Video controls autoPlay loop>
              <source src={generatedVideo} type="video/mp4" />
            </Video>
          </VideoContainer>
          <Button
            onClick={() => window.electronAPI.saveVideo(generatedVideo)}
            style={{ marginTop: '1rem' }}
          >
            Save Video
          </Button>
        </Card>
      )}
    </Container>
  );
};
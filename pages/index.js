import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';
import { useState } from 'react';

const Home = () => {
  const [userInput, setUserInput] = useState('');
  const [lyrics, setLyrics] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playing, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [volume, setVolume] = useState(0.3);

  const callGenerateEndpoint = async () => {
    setIsGenerating(true);

    console.log('Calling OpenAI...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });
      // If response was 200
      if (response.status === 200) {
        const data = await response.json();
        const { output } = data;
        console.log('OpenAI replied...', output.text);
    
        // If the line has less than two words, remove it:
        const cleanLyrics = output.text
          .split('\n')
          .filter((line) => !line.includes('Verse'))
          .filter((line) => !line.includes('Chorus'))
          .filter((line) => !line.includes(':'))
          .filter((line) => line.split(' ').length > 2)
          .slice(0, 12)
          .join('\n');

        console.log('Clean lyrics', cleanLyrics);
        playTTS(cleanLyrics);
      }
    } catch (error) {
      console.log(error);
    }
    finally {
      setIsGenerating(false);
    }
  };

  const playTTS = async (lyrics) => {
    const response = await fetch(`/api/textToSpeech`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: lyrics }),
    });

    console.log("started streaming audio")
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const tts = new Audio(audioUrl);
    
    // Adjust playback speed
    tts.playbackRate = 1.2;
    audio.volume = 0.2;

    tts.play();
    audio.play();
    
    setLyrics(lyrics)
    // displayLyrics(lyrics)
    setIsPlaying(true)
    
    tts.onended = () => {
      setIsPlaying(false)
      audio.pause();
    }
  };

  // const handleSpeak = (text) => {
  //   console.log('handleSpeak', text);
  //   let lines = text.split('\n');
  //   setIsPlaying(true)
  //   audio.play();

  //   // Display each line as it's played
  //   lines.forEach((line) => {
  //     let msg = new SpeechSynthesisUtterance(line);
  //     msg.rate = 1.3;
  //     msg.onstart = () => {
  //       setCurrentLine(line);
  //       if(index === 0){
  //         audio.volume = 0.2;
  //         audio.play();
  //       }
  //     };
  //     // Display current line
  //     msg.onstart = () => setCurrentLine(line);

  //     // When the last line is spoken, set the complete lyrics with line breaks
  //     if (line === lines[lines.length - 1]) {
  //       msg.onend = () => {
  //         setLyrics(text);
  //         setIsPlaying(false)
  //         setCurrentLine('');
  //         audio.pause();
  //       }
  //     }

  //     window.speechSynthesis.speak(msg);
  //   });
  // };

  // Display each line of lyrics at a rate of 150 words per minute (2.5 seconds per line)
  const displayLyrics = (lyrics) => {
    // Add the lyrics one line at a time
    let lines = lyrics.split('\n');
    let index = 0;
    let interval = setInterval(() => {
      setCurrentLine(lines[index]);
      index++;
      if (index === lines.length) {
        clearInterval(interval);
      }
    }, 2500);
  };

  const stopPlaying = () =>{
    window.speechSynthesis.cancel();
    setIsPlaying(false)
    audio.pause();
  }

  useEffect(() => {
    if (audio) {
        audio.volume = volume;
    }
  }, [audio, volume]);

  const onUserChangedText = (event) => {
    setUserInput(event.target.value);
  };

  return (
    <div className="root">
      <Head>
        <title>GPT-Rapper | buildspace </title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>AI Farhaj raps for you</h1>
          </div>
          <div className="header-subtitle">
            <h2>What do you want Farhaj to rap about?</h2>
          </div>
        </div>
        <audio
          src={`/beat3.mp3`}
          onCanPlay={(e) => e.target.volume = 0.2}

          ref={(el) => { setAudio(el); }}
        />
        <div className="prompt-container">
          <textarea
            placeholder="start typing here"
            className="prompt-box"
            value={userInput}
            onChange={onUserChangedText}
          />
          {/* volume label */}
          <label className="label" htmlFor="volume">Volume</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
        />
          {/* Temporary button for calling requestSpeechFile to test */}
          {/* <button onClick={() => generateFakeYou(userInput)}>FakeYou</button> */}
          {/* <button onClick={() => playTTS(userInput)}>Test voice</button> */}
          {/* <button onClick={() => displayLyrics(userInput)}>Display lyrics</button> */}

          <div className="prompt-buttons">
            <a
              className={
                isGenerating ? 'generate-button loading' : 'generate-button'
              }
              onClick={callGenerateEndpoint}
            >
              <div className="generate">
                {isGenerating ? (
                  <span className="loader"></span>
                ) : (
                  <p>RAP</p>
                )}
              </div>
            </a>
          </div>

          {/* Button that is visible if text-to-speech is playing that calls stop function */}  
          {playing && (
            <div className="prompt-buttons">
              <a className="generate-button" onClick={stopPlaying}>
                <div className="generate">
                  <p>Stop</p>
                </div>
              </a>
            </div>
          )}

          <div className="output">
            <div className="output-header-container">
              <div className="output-header">
                <h3>{currentLine}</h3>
              </div>
              <div className="output-content">
                <p> {lyrics} </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-writer"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;

import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';
import { useState } from 'react';
import songs from '../utils/songs.json';

const Home = () => {
  const [userInput, setUserInput] = useState('');
  const [lyrics, setLyrics] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  // Status of the generation process
  // 0 = not started, 1 = generating lyrics, 2 = generating audio, 3 = playing audio, 4 = finished
  const [status, setStatus] = useState(0);
  const [music, setMusic] = useState(null);
  const [tts, setTTS] = useState(null);
  const [volume, setVolume] = useState(0.3);

  const generateLyrics = async () => {
    // if empty string, return
    if (userInput === '' || userInput === ' ') {
      window.alert('Please enter a topic for Raza to rap about!');
      return;
    }
    
    setStatus(1);

    console.log('Calling OpenAI...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });
      if (response.status === 200) {
        const data = await response.json();
        const { output } = data;
        console.log('OpenAI replied...', output.text);

        // Clean up the lyrics output by OpenAI
        const cleanLyrics = output.text
          .split('\n')
          .filter((line) => !line.includes('Verse'))
          .filter((line) => !line.includes('Chorus'))
          .filter((line) => !line.includes(':'))
          .filter((line) => line.split(' ').length > 2)
          // Add a . at the end of each line if it doesn't have one and add an exclamation mark at every 4th line
          .map((line, index) => {
            // If 4th line and doesn't end with a ., add a !
            if (index % 4 === 0 && line[line.length - 1] !== '.') {
              return line + '!';
            } else if (line[line.length - 1] !== '.') {
              return line + '.';
            } else {
              return line;
            }
          })
          // Only take the first 12 lines (this saves on word count for the TTS API)
          .slice(0, 12)
          .join('\n');

        console.log('Clean lyrics', cleanLyrics);
        generateAndPlayTTS(cleanLyrics);
        setStatus(2);
      }
      // if 429
      else if (response.status === 429) {
        // Only 1 req per IP per day, sorry
        window.alert('Only one song per day! Check out the previous songs :D');
        setStatus(0);
      }
      else{
        console.log('Error from OpenAI', response);
        window.alert('GPT-3 API is down. Please try again later.');
        setStatus(0);
      }
    } catch (error) {
      console.log(error);
    } 
  };

  const generateAndPlayTTS  = async (lyrics) => {
    const response = await fetch(`/api/textToSpeech`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: lyrics }),
    });
  
    console.log('Started streaming audio');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const tts = new Audio(audioUrl);
    setTTS(tts);

    // Adjust playback speed
    tts.playbackRate = 1.1;
    tts.volume = 0.6;
    music.volume = 0.3;
    
    music.play();
    setStatus(3);
  
    // Wait 1s so the music ramps up before the lyrics start
    setTimeout(() => {
      tts.play();
      setLyrics(lyrics)
    }, 1000);
  
    tts.onended = () => {
      setStatus(4);
      music.pause();
    };
  };

  const stopPlaying = () => {
    window.speechSynthesis.cancel();
    if (tts) tts.pause();
    if (music) music.pause();
    setStatus(4);
  };

  useEffect(() => {
    if (music && tts) {
      tts.volume = volume;
      // music volume should be 0.25 less than the tts volume
      // so that the music is not too loud
      // Ternary to ensure that the music volume is never negative
      music.volume = volume - 0.25 > 0 ? volume - 0.25 : 0;
    }
  }, [music, tts, volume]);

  const playSong = (filename, lyrics) => {
    setStatus(3);
    stopPlaying();

    const tts = new Audio(`/${filename}`);
    setTTS(tts);
    tts.playbackRate = 1.2;
    tts.volume = 0.5;
    music.volume = 0.3;
    music.play();
    setLyrics(lyrics)

    setTimeout(() => {
      tts.play();
    }, 1000);

    tts.onended = () => {
      setStatus(4);
      music.pause();
    };
  }
  
  const replay = () => {
    setStatus(3);

    music.currentTime = 0;
    tts.currentTime = 0;
    
    tts.play();
    music.play();
  };

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
            <h1>AI Raza raps for you</h1>
          </div>
          <div className="header-subtitle">
            <h2>What do you want Raza to rap about?</h2>
          </div>
        </div>

        <audio
          src={`/Lose_Yourself.mp3`}
          onCanPlay={(e) => (e.target.volume = 0.2)}
          ref={(el) => {
            setMusic(el);
          }}
        />

        <div className="prompt-container">
          <textarea
            placeholder="start typing here"
            className="prompt-box"
            value={userInput}
            onChange={onUserChangedText}
          />

          {status == 0 ? (
            ''
          ) : status == 1 ? (
            <h3 className="status">Generating lyrics using GPT3...</h3>
          ) : status == 2 ? (
            <h3 className="status">Generating audio using ElevenLabs...</h3>
          ) : status == 3 ? (
            ''
          ) : (
            <h3 className="status">Thank you for listening!</h3>
          )}

          <div className="volume-container">
            <div className="volume-icon">
              <img
                src="https://img.icons8.com/ios/50/ffffff/speaker.png"
                alt="speaker"
              />
            </div>

            <input
              className="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>

          <div className="prompt-buttons">
            <a
              className={
                status == 1 ? 'generate-button loading' : 'generate-button'
              }
              onClick={generateLyrics}
            >
              <div className="generate">
                {status == 1 ? (
                  <span className="loader"></span>
                ) : (
                  <p>Generate</p>
                )}
              </div>
            </a>
            
            {status == 4 && (
              <a className="generate-button" onClick={replay}>
                <div className="generate">
                  <p>Replay</p>
                </div>
              </a>
            )}
            
            {status == 3 && (
              <a className="generate-button" onClick={stopPlaying}>
                <div className="generate">
                  <p>Stop</p>
                </div>
              </a>
            )}

          </div>
        </div>

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

        <div className="song-list">
          <h3>Previous Songs</h3>
            {songs.map((song) => (
              <div key={song.song}>
                <p className="playButton" onClick={() => playSong(song.filename, song.lyrics)}>{song.song}</p>
              </div>
            ))}
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

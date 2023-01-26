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

  const callGenerateEndpoint = async () => {
    setIsGenerating(true);

    console.log('Calling OpenAI...');
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

    const data = await response.json();
    const { output } = data;
    console.log('OpenAI replied...', output.text);

    // If the line has less than two words, remove it:
    const finalOutput = output.text
      .split('\n')
      .filter((line) => !line.includes('Verse'))
      .filter((line) => !line.includes('Chorus'))
      .filter((line) => !line.includes(':'))
      .filter((line) => line.split(' ').length > 2)
      .slice(0, 8)
      .join('\n');

    setIsGenerating(false);
    handleSpeak(finalOutput);
  };

  const handleSpeak = (text) => {
    console.log('handleSpeak', text);
    let lines = text.split('\n');
    setIsPlaying(true)

    // Display each line as it's played
    lines.forEach((line) => {
      let msg = new SpeechSynthesisUtterance(line);
      msg.rate = 1.6;
      msg.pitch = 1.2;

      // Display current line
      msg.onstart = () => setCurrentLine(line);

      // When the last line is spoken, set the complete lyrics with line breaks
      if (line === lines[lines.length - 1]) {
        msg.onend = () => {
          setLyrics(text);
          setIsPlaying(false)
          setCurrentLine('');
        }
      }

      window.speechSynthesis.speak(msg);
    });
  };

  const stopPlaying = () =>{
    window.speechSynthesis.cancel();
    setIsPlaying(false)
  }

  const onUserChangedText = (event) => {
    setUserInput(event.target.value);
  };

  return (
    <div className="root">
      <Head>
        <title>GPT-Rapper | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>Eminem rap song generator</h1>
          </div>
          <div className="header-subtitle">
            <h2>What do you want Eminem to rap about?</h2>
          </div>
        </div>

        <div className="prompt-container">
          <textarea
            placeholder="start typing here"
            className="prompt-box"
            value={userInput}
            onChange={onUserChangedText}
          />

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
                  <p>Generate</p>
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

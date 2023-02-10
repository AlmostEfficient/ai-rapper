import axios from 'axios';

const apiKey = process.env.EL_API_KEY;
const voice_id = process.env.VOICE_ID

const textToSpeech = async (req, res) => {
  const { text } = req.body;
  console.log("Received request to generate audio for", text)

  if (!text) {
    res.status(400).json({ error: "No text provided" });
    return;
  }

  if (text.length < 10) {
    res.status(400).json({ error: "Text is too short" });
    console.log("Text is too short", text)
    return;
  }

  try{
    const { data } = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`,
      data: { text },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'stream'
    });

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
    })
    const stream = data.pipe(res)
    stream.on('finish', () => {
      console.log("Finished streaming audio")
    })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
};

export default textToSpeech;
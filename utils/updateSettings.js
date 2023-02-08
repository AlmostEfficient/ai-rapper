import axios from 'axios';

const apiKey = process.env.EL_API_KEY;
const voice_id = process.env.VOICE_ID

const updateSettings = async () => {
  try {
    const { data } = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/voices/${voice_id}/settings/edit`,
      data: { stability: 0, similarity_boost: 0 },
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    console.log(data)
  }
  catch (error) {
    console.error(error);
  }
}

export default updateSettings;
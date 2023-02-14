import { Configuration, OpenAIApi } from 'openai';
import NodeCache from 'node-cache';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new NodeCache({ stdTTL: 86400 });
const MAX_GENERATIONS_PER_IP = 1;

const openai = new OpenAIApi(configuration);
const basePrompt =
`
Give me lyrics for a rap song in the style of Eminem on the following topic.
Respond with only the lyrics and nothing else. Do not include "Verse" or "Chorus" labels in your response.

Topic:
`

const generateAction = async (req, res) => {

  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const cacheKey = `ip_${ipAddress}`;

  const cacheValue = cache.get(cacheKey);
  // if (cacheValue && cacheValue.count >= MAX_GENERATIONS_PER_IP) {
  //   res.status(429).send('Too many requests');
  //   return;
  // }

  console.log(`API: ${basePrompt}${req.body.userInput}`);

  // If the input does not end with a period, add one
  req.body.userInput.endsWith('.' || '!' || '?') || (req.body.userInput += '.');

  try {
    const baseCompletion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${basePrompt}${req.body.userInput}`,
      temperature: 0.8,
      max_tokens: 250,
    });

    const basePromptOutput = baseCompletion.data.choices.pop();

    if (!cacheValue) {
      cache.set(cacheKey, { count: 1 });
    } else {
      cache.set(cacheKey, { count: cacheValue.count + 1 });
    }
    res.status(200).json({ output: basePromptOutput });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating lyrics');
  }
};


export default generateAction;
import dotenv from 'dotenv'
import OpenAI from 'openai';
dotenv.config()

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
  baseURL: process.env['OPENAI_API_URL'],
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: '你好' }],
    model: 'gpt-3.5-turbo',
  });
  console.log(chatCompletion);

}

main();
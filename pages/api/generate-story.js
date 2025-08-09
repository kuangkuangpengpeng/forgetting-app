import { supabase } from '../../utils/supabaseClient';
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user } = await supabase.auth.api.getUserByCookie(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { words } = req.body;
  
  if (!words || words.length < 3) {
    return res.status(400).json({ error: '请至少选择3个单词' });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `请使用以下英语单词创作一个200字以内的短篇故事，故事要有趣、有教育意义，适合英语学习者阅读。单词：${words.join(', ')}。故事中要自然地融入这些单词，并在每个目标单词后标注中文释义。故事语言为中文，但保留英语单词。`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一位英语老师和儿童文学作家，擅长创作包含特定英语单词的趣味故事"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const storyContent = response.choices[0].message.content;
    const title = `包含 ${words.length} 个单词的故事`;

    const { data, error } = await supabase
      .from('stories')
      .insert([
        { 
          user_id: user.id, 
          title, 
          content: storyContent, 
          words 
        }
      ]);

    if (error) throw error;

    res.status(200).json({
      title,
      content: storyContent,
      words
    });
  } catch (error) {
    console.error('故事生成失败:', error);
    res.status(500).json({ error: '故事生成失败，请重试' });
  }
}

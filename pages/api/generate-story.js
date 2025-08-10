import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  // 检查功能是否启用
  if (process.env.NEXT_PUBLIC_AI_STORY_ENABLED !== 'true') {
    return res.status(503).json({
      error: 'AI 故事功能已暂时禁用'
    });
  }

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
    const prompt = `请使用以下英语单词创作一个200字以内的短篇故事，故事要有趣、有教育意义，适合英语学习者阅读。单词：${words.join('，')}。故事中要自然地融入这些单词，并在每个目标单词后标注中文释义。故事语言为中文，但保留英语单词。`;
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API 错误: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const storyContent = data.choices[0].message.content;
    const title = `包含 ${words.length} 个单词的故事`;
    
    // 保存到数据库
    const { data: storyData, error } = await supabase
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
    res.status(500).json({
      error: '故事生成失败，请重试：' + error.message
    });
  }
}

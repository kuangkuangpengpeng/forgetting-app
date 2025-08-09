import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  const { user } = await supabase.auth.api.getUserByCookie(req);
  
  if (!user) {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    const { front, back, tags } = req.body;
    
    if (!front || !back) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    const { data, error } = await supabase
      .from('cards')
      .insert([
        { 
          user_id: user.id, 
          front, 
          back, 
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [] 
        }
      ]);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(201).json(data[0]);
  }
  
  return res.status(405).json({ error: '方法不允许' });
}

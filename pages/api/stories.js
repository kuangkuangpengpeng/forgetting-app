import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  const { user } = await supabase.auth.api.getUserByCookie(req);
  
  if (!user) {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: '缺少故事ID' });
    }
    
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true });
  }
  
  return res.status(405).json({ error: '方法不允许' });
}


import React, { useEffect, useRef, useState } from 'react'
import AppBar from '../components/AppBar'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabaseClient'

function generatePseudonym(userId){
  if(!userId) return 'Utente anonimo'
  let h = 0
  for(let i = 0; i < userId.length; i++) h = ((h << 5) - h) + userId.charCodeAt(i)
  const num = Math.abs(h) % 10000
  return `Utente${String(num).padStart(4, '0')}`
}

function MessageBubble({ m }){
  return (
    <div className={`flex ${m.own ? 'justify-end' : 'justify-start'}`}>
      <div className={`md-card p-3 rounded-xl ${m.own ? 'bg-primary/10' : 'bg-surface'} max-w-[85%] flex items-start gap-3`}> 
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user || 'Utente')}&background=EDE9FE&color=5B21B6&size=128`} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{color: '#000'}}>{m.user}</div>
        <div className="mt-1 text-sm text-gray-800">{m.text}</div>
        <div className="text-xs text-gray-400 mt-2">{new Date(m.at).toLocaleDateString()} {new Date(m.at).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  )
}

export default function Community(){
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const listRef = useRef(null)

  function getDateKey(d){
    try{ const dt = (d instanceof Date) ? d : new Date(d); return dt.toISOString().slice(0,10) }catch(e){ return '' }
  }

  function getDateLabel(d){
    try{ const dt = (d instanceof Date) ? d : new Date(d); return dt.toLocaleDateString() }catch(e){ return '' }
  }

  function groupMessagesByDate(msgs){
    const map = {}
    for(const m of (msgs || [])){
      const key = getDateKey(m.at || m.created_at || new Date())
      if(!map[key]) map[key] = { date: key, label: getDateLabel(m.at || m.created_at || new Date()), messages: [] }
      map[key].messages.push(m)
    }
    // sort keys (oldest first)
    const keys = Object.keys(map).sort((a,b)=> a.localeCompare(b))
    return keys.map(k=> ({ ...map[k], messages: map[k].messages.sort((x,y)=> new Date(x.at || x.created_at) - new Date(y.at || y.created_at)) }))
  }

  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    // scroll to bottom on messages update
    if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(()=>{
    let mounted = true
    let channel = null

    let me = null
    async function load(){
      setLoading(true)
      // current user id (used to mark own messages and always show owner's name)
      try{ const userRes = await supabase.auth.getUser(); me = userRes?.data?.user?.id }catch(e){ me = null }

      // fetch recent messages
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, user_id, username, content, created_at')
        .order('created_at', { ascending: true })
        .limit(200)

      if(error){
        console.error('Error loading community messages', error)
      } else if(mounted){
        const rows = data || []
        // collect user ids to fetch profiles (avatar + visibility)
        const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)))
        let profilesMap = {}
        if(userIds.length > 0){
          try{
            const prof = await supabase.from('profiles').select('id, avatar_url, is_public, full_name').in('id', userIds)
            if(prof.error){ console.warn('Error fetching profiles', prof.error) }
            else if(prof.data){ profilesMap = (prof.data || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) }
          }catch(e){ console.warn('profiles fetch failed', e) }
        }

        setMessages(rows.map(d => {
          const p = profilesMap[d.user_id] || {}
          const isPublic = (typeof p.is_public === 'boolean') ? p.is_public : true
          const isOwner = me && d.user_id === me
          // show real name/avatar only when profile is_public === true
          const displayName = isPublic ? (d.username || p.full_name || d.user_id) : generatePseudonym(d.user_id)
          const avatar = isPublic ? p.avatar_url : null
          return { id: d.id, user: displayName, text: d.content, at: new Date(d.created_at), own: Boolean(isOwner), avatar_url: avatar }
        }))
      }

      // subscribe to new messages
      channel = supabase.channel('public:community_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, async (payload) => {
          const d = payload.new
          // attempt to fetch profile for this user_id and respect visibility
          let avatar = null
          let displayName = d.username || d.user_id
          const isOwner = me && d.user_id === me
          try{
            const prof = await supabase.from('profiles').select('avatar_url,is_public,full_name').eq('id', d.user_id).single()
            if(!prof.error && prof.data){
              const p = prof.data
              const isPublic = (typeof p.is_public === 'boolean') ? p.is_public : true
              avatar = isPublic ? p.avatar_url : null
              displayName = isPublic ? (d.username || p.full_name || d.user_id) : generatePseudonym(d.user_id)
            }
          }catch(e){ console.warn('avatar fetch failed for new message', e) }
          setMessages(prev => [...prev, { id: d.id, user: displayName, text: d.content, at: new Date(d.created_at), own: Boolean(isOwner), avatar_url: avatar }])
        })
        .subscribe()

      setLoading(false)
    }

    load()

    return ()=>{ mounted = false; if(channel) channel.unsubscribe() }
  }, [])

  async function send(){
    if(!text.trim()) return

    // ensure user is authenticated
    const userRes = await supabase.auth.getUser()
    const user = userRes?.data?.user
    if(!user){
      window.location.href = '/login'
      return
    }

    // optimistic UI: append a temporary message so user sees it immediately
    const tmpId = `tmp-${Date.now()}`
    const tmpMsg = { id: tmpId, user: user.email || user.id, text: text.trim(), at: new Date(), own: true }
    setMessages(s => [...s, tmpMsg])
    setText('')

    const payload = {
      user_id: user.id,
      username: user.email || user.id,
      content: tmpMsg.text
    }

    // insert into DB and request the inserted row back with select()
    const { data, error } = await supabase.from('community_messages').insert([payload]).select()
    if(error){
      console.error('Error sending message', error)
      // optionally mark the tmp message as failed - for now leave it so user sees it
      return
    }

    const row = data && data[0]
    if(row){
      // replace the temp message with the real row (matching tmpId)
      setMessages(prev => prev.map(m => m.id === tmpId ? { id: row.id, user: row.username || row.user_id, text: row.content, at: new Date(row.created_at), own: true } : m ))
    }
  }

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Community" />
      <div className="p-4 flex flex-col h-full" style={{paddingBottom: '120px'}}>
        <div className="mb-3">
          <div className="text-sm text-gray-500">Benvenuto nella Community — scrivi qui sotto per partecipare</div>
        </div>

        <div ref={listRef} className="flex-1 overflow-auto flex flex-col gap-3 mb-3">
          {groupMessagesByDate(messages).map(group => (
            <div key={group.date} className="space-y-3">
              <div className="flex justify-center">
                <div className="text-xs text-gray-500 bg-white/60 px-3 py-1 rounded-full">{group.label}</div>
              </div>
              {group.messages.map(m => (
                <MessageBubble key={m.id} m={m} />
              ))}
            </div>
          ))}
        </div>

        <div className="fixed left-0 right-0 bottom-16 px-4">{/* above BottomNav */}
          <div className="md-card p-3 rounded-xl flex items-center gap-3 bg-surface">
            <input
              value={text}
              onChange={e=>setText(e.target.value)}
              placeholder="Scrivi alla community..."
              className="flex-1 p-3 rounded-md border border-gray-200 bg-transparent"
              onKeyDown={(e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send() } }}
            />
            <button onClick={send} className="px-4 py-2 bg-primary text-white rounded-lg">Invia</button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

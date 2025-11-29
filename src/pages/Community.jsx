
import React, { useEffect, useRef, useState } from 'react'
import AppBar from '../components/AppBar'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabaseClient'

function MessageBubble({ m }){
  return (
    <div className={`flex ${m.own ? 'justify-end' : 'justify-start'}`}>
      <div className={`md-card p-3 rounded-xl ${m.own ? 'bg-primary/10' : 'bg-surface'} max-w-[85%]`}> 
        <div className="text-sm font-semibold" style={{color: '#000'}}>{m.user}</div>
        <div className="mt-1 text-sm text-gray-800">{m.text}</div>
        <div className="text-xs text-gray-400 mt-2">{new Date(m.at).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

export default function Community(){
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const listRef = useRef(null)

  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    // scroll to bottom on messages update
    if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(()=>{
    let mounted = true
    let channel = null

    async function load(){
      setLoading(true)
      // fetch recent messages
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, user_id, username, content, created_at')
        .order('created_at', { ascending: true })
        .limit(200)

      if(error){
        console.error('Error loading community messages', error)
      } else if(mounted){
        setMessages((data || []).map(d => ({ id: d.id, user: d.username || d.user_id, text: d.content, at: new Date(d.created_at), own: false })))
      }

      // subscribe to new messages
      channel = supabase.channel('public:community_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages' }, (payload) => {
          const d = payload.new
          setMessages(prev => [...prev, { id: d.id, user: d.username || d.user_id, text: d.content, at: new Date(d.created_at), own: false }])
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
          {messages.map(m=> (
            <MessageBubble key={m.id} m={m} />
          ))}
        </div>

        <div className="fixed left-0 right-0 bottom-28 px-4">{/* above BottomNav */}
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

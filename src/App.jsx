import { useEffect, useRef, useState } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const WS_URL = 'http://localhost:8080/ws'

export default function App() {
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const stompClient = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connect = (name) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/public', (payload) => {
          const msg = JSON.parse(payload.body)
          setMessages((prev) => [...prev, msg])
        })
        client.publish({
          destination: '/app/chat.addUser',
          body: JSON.stringify({ sender: name, type: 'JOIN' }),
        })
      },
    })
    client.activate()
    stompClient.current = client
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const name = nameInput.trim()
    if (!name) return
    setUsername(name)
    setJoined(true)
    connect(name)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() || !stompClient.current) return
    stompClient.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({ sender: username, content: text, type: 'CHAT' }),
    })
    setText('')
  }

  if (!joined) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <form
          onSubmit={handleJoin}
          className="bg-white p-8 rounded-xl shadow-md w-80 flex flex-col gap-4"
        >
          <h1 className="text-xl font-semibold text-slate-800 text-center">
            Join Chat Room
          </h1>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="submit"
            className="bg-slate-800 text-white rounded-lg py-2 hover:bg-slate-700"
          >
            Join
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-800 text-white px-4 py-3 shadow">
        <h1 className="text-lg font-semibold">Chat Room</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.map((m, i) => {
          if (m.type === 'JOIN' || m.type === 'LEAVE') {
            return (
              <p key={i} className="text-center text-sm text-slate-500 italic">
                {m.sender} {m.type === 'JOIN' ? 'joined' : 'left'} the chat
              </p>
            )
          }
          const isMe = m.sender === username
          return (
            <div
              key={i}
              className={`max-w-xs px-3 py-2 rounded-lg ${
                isMe
                  ? 'bg-slate-800 text-white self-end'
                  : 'bg-white text-slate-800 self-start shadow'
              }`}
            >
              {!isMe && (
                <p className="text-xs font-semibold text-slate-500 mb-0.5">
                  {m.sender}
                </p>
              )}
              <p>{m.content}</p>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 p-3 bg-white border-t">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          type="submit"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          Send
        </button>
      </form>
    </div>
  )
}

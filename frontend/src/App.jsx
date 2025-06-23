// App.jsx
import { useState, useEffect } from 'react'
import {
    getMessage,
    sendName,
    getAllNames,
    deleteAllNames,
    updateName,
} from './api'

function App() {
    const [message, setMessage] = useState('')
    const [name, setName] = useState('')
    const [reply, setReply] = useState('')
    const [names, setNames] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [newName, setNewName] = useState('')
    const [errorName, setErrorName] = useState('')
    const [errorEditName, setErrorEditName] = useState('')
    const [sortBy, setSortBy] = useState('dateDesc')
    const [sendCount, setSendCount] = useState(0)

    const fetchNames = async () => {
        try {
            const data = await getAllNames()
            setNames(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Ошибка при получении имён:', err)
            setNames([])
        }
    }

    useEffect(() => {
        fetchNames()
    }, [])

    const handleGetMessage = async () => {
        try {
            const data = await getMessage()
            setMessage(data.text)
        } catch (err) {
            setMessage('Ошибка при получении сообщения')
        }
    }

    const handleSendName = async () => {
        const trimmed = name.trim()
        if (!trimmed || trimmed.length < 2) {
            setErrorName("Имя должно содержать хотя бы 2 символа")
            return
        }

        try {
            const data = await sendName(trimmed)
            setReply(data.message)
            setName('')
            setErrorName('')
            fetchNames()
            setSendCount(prev => prev + 1)
        } catch (err) {
            setReply('Ошибка при отправке')
        }
    }

    const handleClear = async () => {
        try {
            const data = await deleteAllNames()
            setReply(data.message)
            setNames([])
        } catch (err) {
            setReply('Ошибка при очистке')
        }
    }

    const startEditing = (id, currentName) => {
        setEditingId(id)
        setNewName(currentName)
        setErrorEditName('')
    }

    const saveNewName = async () => {
        const trimmed = newName.trim()
        if (!trimmed || trimmed.length < 2) {
            setErrorEditName("Новое имя должно содержать хотя бы 2 символа")
            return
        }

        const currentItem = names.find((n) => n.id === editingId)
        if (!currentItem) return

        try {
            const data = await updateName(currentItem.name, trimmed)
            setReply(data.message)
            setEditingId(null)
            setNewName('')
            setErrorEditName('')
            fetchNames()
        } catch (err) {
            setReply('Ошибка при обновлении')
        }
    }

    const sortedNames = [...names].sort((a, b) => {
        switch (sortBy) {
            case 'dateAsc':
                return new Date(a.created_at) - new Date(b.created_at)
            case 'dateDesc':
                return new Date(b.created_at) - new Date(a.created_at)
            case 'alphaAsc':
                return a.name.localeCompare(b.name, 'ru-RU')
            case 'alphaDesc':
                return b.name.localeCompare(a.name, 'ru-RU')
            default:
                return 0
        }
    })

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
            <h1>React + Go Demo</h1>

            <button onClick={handleGetMessage}>Получить сообщение от сервера</button>
            <p>{message}</p>

            <hr />

            <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    if (errorName) setErrorName('')
                }}
            />
            <button onClick={handleSendName}>Отправить имя</button>
            {errorName && <p style={{ color: 'red' }}>{errorName}</p>}
            <p>{reply}</p>

            <hr />

            <button onClick={fetchNames}>Показать все имена</button>
            <button onClick={handleClear}>Очистить базу</button>

            <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3>Мини-админка</h3>
                <p>Всего имён в базе: <strong>{names.length}</strong></p>
                <p>Количество успешных отправок в этой сессии: <strong>{sendCount}</strong></p>
            </div>

            <div style={{ marginTop: '1rem' }}>
                <label>Сортировка: </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="dateDesc">По дате (новые сверху)</option>
                    <option value="dateAsc">По дате (старые сверху)</option>
                    <option value="alphaAsc">По алфавиту (A→Я)</option>
                    <option value="alphaDesc">По алфавиту (Я→A)</option>
                </select>
            </div>

            <ul>
                {sortedNames.map((n) => {
                    const formattedDate = new Date(n.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })

                    return (
                        <li key={n.id}>
                            {editingId === n.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => {
                                            setNewName(e.target.value)
                                            if (errorEditName) setErrorEditName('')
                                        }}
                                    />
                                    <button onClick={saveNewName}>Сохранить</button>
                                    {errorEditName && <p style={{ color: 'red' }}>{errorEditName}</p>}
                                </>
                            ) : (
                                <>
                                    <strong>{n.name}</strong>
                                    <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9em' }}>
                                        {formattedDate}
                                    </span>
                                    <button style={{ marginLeft: '1rem' }} onClick={() => startEditing(n.id, n.name)}>
                                        ✏️
                                    </button>
                                </>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default App

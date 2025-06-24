// App.jsx
import { useState, useEffect } from 'react'
import {
    getMessage,
    sendName,
    getAllNames,
    deleteAllNames,
    updateName,
} from './api'

// Главный компонент приложения
function App() {
    // ==== Состояния приложения (useState) ====
    const [message, setMessage] = useState('')             // Сообщение от сервера
    const [name, setName] = useState('')                   // Введённое имя для отправки
    const [reply, setReply] = useState('')                 // Ответ от сервера после действий
    const [names, setNames] = useState([])                 // Список всех имён из базы
    const [editingId, setEditingId] = useState(null)       // ID имени, которое сейчас редактируется
    const [newName, setNewName] = useState('')             // Новое значение имени при редактировании
    const [errorName, setErrorName] = useState('')         // Ошибка при валидации отправки имени
    const [errorEditName, setErrorEditName] = useState('') // Ошибка при редактировании имени
    const [sortBy, setSortBy] = useState('dateDesc')       // Критерий сортировки списка
    const [sendCount, setSendCount] = useState(0)          // Счётчик успешных отправок в текущей сессии

    // ==== Получение имён из базы ====
    const fetchNames = async () => {
        try {
            const data = await getAllNames()
            setNames(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Ошибка при получении имён:', err)
            setNames([])
        }
    }

    // ==== Эффект при монтировании ====
    useEffect(() => {
        // 1. Загружаем начальные имена
        fetchNames()

        // 2. Подключение к WebSocket серверу
        const socket = new WebSocket("ws://localhost:8080/ws")

        // 3. Получаем данные по каналу WebSocket (ожидаем обновления имён)
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                setNames(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error("WebSocket JSON parse error", err)
            }
        }

        // 4. Логируем отключение
        socket.onclose = () => {
            console.log("WebSocket closed")
        }

        // 5. Очистка соединения при размонтировании
        return () => {
            socket.close()
        }
    }, [])

    // ==== Получить приветственное сообщение от сервера ====
    const handleGetMessage = async () => {
        try {
            const data = await getMessage()
            setMessage(data.text)
        } catch (err) {
            setMessage('Ошибка при получении сообщения')
        }
    }

    // ==== Отправить имя на сервер ====
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
            setSendCount(prev => prev + 1)
            // Обновление придёт через WebSocket — ручной fetch не нужен
        } catch (err) {
            setReply('Ошибка при отправке')
        }
    }

    // ==== Удалить все имена из базы ====
    const handleClear = async () => {
        try {
            const data = await deleteAllNames()
            setReply(data.message)
            // WebSocket пришлёт обновлённый список
        } catch (err) {
            setReply('Ошибка при очистке')
        }
    }

    // ==== Начать редактирование имени ====
    const startEditing = (id, currentName) => {
        setEditingId(id)
        setNewName(currentName)
        setErrorEditName('')
    }

    // ==== Сохранить новое имя ====
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
            // WebSocket обновит список
        } catch (err) {
            setReply('Ошибка при обновлении')
        }
    }

    // ==== Сортировка списка имён ====
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

    // ==== Отрисовка интерфейса ====
    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
            <h1>React + Go Demo</h1>

            {/* Кнопка для получения приветственного сообщения */}
            <button onClick={handleGetMessage}>Получить сообщение от сервера</button>
            <p>{message}</p>

            <hr />

            {/* Поле ввода имени и отправка */}
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

            {/* Управление базой: обновление и очистка */}
            <button onClick={fetchNames}>Обновить список вручную</button>
            <button onClick={handleClear}>Очистить базу</button>

            {/* Информационный блок */}
            <div style={{
                marginTop: '1rem',
                border: '1px solid #ccc',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
            }}>
                <h3>Мини-админка</h3>
                <p>Всего имён в базе: <strong>{names.length}</strong></p>
                <p>Количество успешных отправок в этой сессии: <strong>{sendCount}</strong></p>
            </div>

            {/* Сортировка списка */}
            <div style={{ marginTop: '1rem' }}>
                <label>Сортировка: </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="dateDesc">По дате (новые сверху)</option>
                    <option value="dateAsc">По дате (старые сверху)</option>
                    <option value="alphaAsc">По алфавиту (A→Я)</option>
                    <option value="alphaDesc">По алфавиту (Я→A)</option>
                </select>
            </div>

            {/* Список имён */}
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
                                // Режим редактирования имени
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
                                // Обычный режим отображения имени
                                <>
                                    <strong>{n.name}</strong>
                                    <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9em' }}>
                                        {formattedDate}
                                    </span>
                                    <button
                                        style={{ marginLeft: '1rem' }}
                                        onClick={() => startEditing(n.id, n.name)}
                                    >
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

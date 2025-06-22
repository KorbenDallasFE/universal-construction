// api.js

const BASE_URL = 'http://localhost:3300/api'

export async function getMessage() {
    const res = await fetch(`${BASE_URL}/message`)
    return res.json()
}

export async function sendName(name) {
    const res = await fetch(`${BASE_URL}/hello`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    return res.json()
}

export async function getAllNames() {
    const res = await fetch(`${BASE_URL}/all`)
    return res.json()
}

export async function deleteAllNames() {
    const res = await fetch(`${BASE_URL}/delete`, { method: 'DELETE' })
    return res.json()
}

export async function updateName(oldName, newName) {
    const res = await fetch(`${BASE_URL}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName }),
    })

    if (!res.ok) {
        throw new Error('Failed to update name')
    }

    return res.json()
}

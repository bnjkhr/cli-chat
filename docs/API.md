# API-Dokumentation

## REST API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Authentication

#### Register

```
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure123",
  "username": "johndoe"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400`: Email, password, or username missing
- `409`: Username already taken

#### Login

```
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "secure123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400`: Email or password missing
- `401`: Invalid credentials
- `403`: Account banned

#### Logout

```
POST /auth/logout
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## WebSocket Events

### Connection

**Client → Server:**
```javascript
socket.connect({
  auth: {
    token: 'jwt-access-token'
  }
});
```

**Server → Client:**
```javascript
// On successful authentication
socket.on('authenticated', (data) => {
  // data: { userId, username, role }
});
```

### Chat Events

#### Send Message

**Client → Server:**
```javascript
socket.emit('send_message', {
  roomId: 'uuid',        // OR
  recipientId: 'uuid',   // For DM
  content: 'Hello World'
});
```

**Server → Client(s):**
```javascript
socket.on('message', (data) => {
  // data: {
  //   id, content, username, role,
  //   created_at, roomId, recipientId
  // }
});
```

#### Join Room

**Client → Server:**
```javascript
socket.emit('join_room', {
  roomId: 'uuid'
});
```

**Server → Client:**
```javascript
socket.on('joined_room', (data) => {
  // data: { roomId, roomName, description }
});

socket.on('message_history', (data) => {
  // data: { roomId, messages: [...] }
});
```

**Server → Others in Room:**
```javascript
socket.on('user_joined', (data) => {
  // data: { username, roomId }
});
```

#### Leave Room

**Client → Server:**
```javascript
socket.emit('leave_room', {
  roomId: 'uuid'
});
```

**Server → Client:**
```javascript
socket.on('left_room', (data) => {
  // data: { roomId }
});
```

#### Get Rooms

**Client → Server:**
```javascript
socket.emit('get_rooms');
```

**Server → Client:**
```javascript
socket.on('rooms_list', (data) => {
  // data: { rooms: [{ id, name, description, created_at }, ...] }
});
```

#### Get Users

**Client → Server:**
```javascript
socket.emit('get_users');
```

**Server → Client:**
```javascript
socket.on('users_list', (data) => {
  // data: { roomId, users: [{ username, role }, ...] }
});
```

### Admin Events

#### Create Room

**Client → Server:**
```javascript
socket.emit('admin:create_room', {
  name: 'newroom',
  description: 'Room description'
});
```

**Server → All Clients:**
```javascript
socket.on('room_created', (data) => {
  // data: { room: { id, name, description } }
});
```

#### Ban User

**Client → Server:**
```javascript
socket.emit('admin:ban_user', {
  username: 'johndoe',
  reason: 'Spamming'
});
```

**Server → Banned User:**
```javascript
socket.on('banned', (data) => {
  // data: { reason, by }
  // Connection will be closed
});
```

#### Unban User

**Client → Server:**
```javascript
socket.emit('admin:unban_user', {
  username: 'johndoe'
});
```

#### Kick User

**Client → Server:**
```javascript
socket.emit('admin:kick_user', {
  username: 'johndoe',
  reason: 'Violating rules'
});
```

**Server → Kicked User:**
```javascript
socket.on('kicked', (data) => {
  // data: { reason, by }
  // Connection will be closed
});
```

#### Delete Room

**Client → Server:**
```javascript
socket.emit('admin:delete_room', {
  roomId: 'uuid'
});
```

**Server → All Clients:**
```javascript
socket.on('room_deleted', (data) => {
  // data: { roomId, roomName }
});
```

### System Events

#### Error

**Server → Client:**
```javascript
socket.on('error', (data) => {
  // data: { message }
});
```

#### Success

**Server → Client:**
```javascript
socket.on('success', (data) => {
  // data: { message }
});
```

#### Disconnect

**Server → Client:**
```javascript
socket.on('disconnect', (reason) => {
  // reason: string
});
```

---

## Database Schema

### Tables

#### profiles

| Column     | Type      | Description                |
|------------|-----------|----------------------------|
| id         | UUID (PK) | User ID (from auth.users)  |
| username   | TEXT      | Unique username            |
| role       | TEXT      | 'user' or 'admin'          |
| created_at | TIMESTAMP | Account creation time      |
| last_seen  | TIMESTAMP | Last login time            |

#### rooms

| Column      | Type      | Description              |
|-------------|-----------|--------------------------|
| id          | UUID (PK) | Room ID                  |
| name        | TEXT      | Unique room name         |
| description | TEXT      | Room description         |
| created_by  | UUID (FK) | Creator user ID          |
| created_at  | TIMESTAMP | Room creation time       |

#### messages

| Column       | Type      | Description                |
|--------------|-----------|----------------------------|
| id           | UUID (PK) | Message ID                 |
| user_id      | UUID (FK) | Sender user ID             |
| room_id      | UUID (FK) | Room ID (NULL for DM)      |
| recipient_id | UUID (FK) | Recipient ID (NULL for room)|
| content      | TEXT      | Message content            |
| created_at   | TIMESTAMP | Message timestamp          |

#### bans

| Column     | Type      | Description            |
|------------|-----------|------------------------|
| id         | UUID (PK) | Ban ID                 |
| user_id    | UUID (FK) | Banned user ID         |
| banned_by  | UUID (FK) | Admin who banned       |
| reason     | TEXT      | Ban reason             |
| banned_at  | TIMESTAMP | Ban timestamp          |

---

## Error Codes

| Code | Message                      | Description                    |
|------|------------------------------|--------------------------------|
| 400  | Bad Request                  | Missing or invalid parameters  |
| 401  | Unauthorized                 | Invalid credentials            |
| 403  | Forbidden                    | Access denied / Banned         |
| 404  | Not Found                    | Resource not found             |
| 409  | Conflict                     | Username/Room already exists   |
| 429  | Too Many Requests            | Rate limit exceeded            |
| 500  | Internal Server Error        | Server error                   |

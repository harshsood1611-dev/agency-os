# AgencyOS API Documentation - Phase 2

## Overview
This document outlines the Phase 2 API endpoints for Projects, Tasks, and Messaging system.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

---

## PROJECTS API

### Get All Projects
**GET** `/projects`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by project name or description
- `status` (optional): Filter by status (Not Started, In Progress, Completed, On Hold)
- `clientId` (optional): Filter by client ID

**Response:**
```json
{
  "projects": [
    {
      "_id": "123",
      "name": "Website Redesign",
      "clientId": {
        "_id": "456",
        "name": "Acme Corp",
        "company": "Acme Inc"
      },
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2026-04-15",
      "budget": 5000,
      "startDate": "2026-03-01",
      "description": "Complete website redesign",
      "assignedTo": [],
      "createdAt": "2026-03-25T10:00:00Z",
      "updatedAt": "2026-03-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### Get Single Project
**GET** `/projects/:id`

**Response:**
```json
{
  "_id": "123",
  "name": "Website Redesign",
  "clientId": { ... },
  "status": "In Progress",
  "priority": "High",
  "dueDate": "2026-04-15",
  "budget": 5000,
  "startDate": "2026-03-01",
  "description": "Complete website redesign",
  "assignedTo": [
    {
      "_id": "789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Create Project
**POST** `/projects`

**Request Body:**
```json
{
  "name": "Website Redesign",
  "clientId": "456",
  "description": "Complete website redesign",
  "status": "Not Started",
  "priority": "High",
  "startDate": "2026-03-01",
  "dueDate": "2026-04-15",
  "budget": 5000
}
```

**Response:** 201 Created - Returns created project object

### Update Project
**PUT** `/projects/:id`

**Request Body:** (Same as create, all fields optional)

**Response:** 200 OK - Returns updated project object

### Delete Project
**DELETE** `/projects/:id`

**Response:**
```json
{
  "message": "Project deleted"
}
```

**Note:** Deleting a project also deletes all associated tasks.

### Assign User to Project
**POST** `/projects/:id/assign`

**Request Body:**
```json
{
  "userId": "789"
}
```

**Response:** 200 OK - Returns updated project with assignedTo array

---

## TASKS API

### Get All Tasks
**GET** `/tasks`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `projectId` (optional): Filter by project ID
- `status` (optional): Filter by status (New, In Progress, Completed, Blocked)
- `priority` (optional): Filter by priority (Low, Medium, High, Critical)

**Response:**
```json
{
  "tasks": [
    {
      "_id": "task123",
      "title": "Design Homepage",
      "description": "Create homepage mockup",
      "projectId": {
        "_id": "proj123",
        "name": "Website Redesign"
      },
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2026-03-30",
      "assignedTo": {
        "_id": "user123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "comments": [],
      "completedAt": null,
      "createdAt": "2026-03-25T10:00:00Z",
      "updatedAt": "2026-03-25T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Kanban Board for Project
**GET** `/tasks/project/:projectId/kanban`

**Response:**
```json
{
  "New": [...],
  "In Progress": [...],
  "Completed": [...],
  "Blocked": [...]
}
```

### Get Single Task
**GET** `/tasks/:id`

**Response:** Task object with populated comments and assignee

### Create Task
**POST** `/tasks`

**Request Body:**
```json
{
  "title": "Design Homepage",
  "projectId": "proj123",
  "description": "Create homepage mockup",
  "status": "New",
  "priority": "High",
  "dueDate": "2026-03-30",
  "assignedTo": "user123"
}
```

**Response:** 201 Created - Returns created task object

### Update Task
**PUT** `/tasks/:id`

**Request Body:** (All fields optional)

**Response:** 200 OK - Returns updated task object

**Note:** Setting status to "Completed" automatically sets completedAt timestamp.

### Delete Task
**DELETE** `/tasks/:id`

**Response:**
```json
{
  "message": "Task deleted"
}
```

### Add Comment to Task
**POST** `/tasks/:id/comments`

**Request Body:**
```json
{
  "text": "This is a comment on the task"
}
```

**Response:** 200 OK - Returns updated task with new comment

---

## MESSAGING API

### Get Direct Messages with User
**GET** `/messages/direct/:userId`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "senderId": {
        "_id": "user1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "recipientId": {
        "_id": "user2",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "text": "Hello, how are you?",
      "isRead": true,
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Project Group Chat
**GET** `/messages/project/:projectId`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "senderId": { ... },
      "projectId": "proj123",
      "text": "Progress update on the project",
      "chatType": "project-group",
      "isRead": true,
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Send Direct Message
**POST** `/messages/direct/send`

**Request Body:**
```json
{
  "recipientId": "user2",
  "text": "Hello, how are you?"
}
```

**Response:** 201 Created - Returns created message object

### Send Project Group Message
**POST** `/messages/project/:projectId/send`

**Request Body:**
```json
{
  "text": "Progress update on the project"
}
```

**Response:** 201 Created - Returns created message object

### Delete Message
**DELETE** `/messages/:id`

**Response:**
```json
{
  "message": "Message deleted"
}
```

**Note:** Only the sender can delete their own messages.

---

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "value": "",
      "msg": "Project name required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Upcoming Enhancements

### WebSocket Support (for real-time chat)
Currently, messages are polled every 2 seconds. Future implementation will add WebSocket support for:
- Real-time message delivery
- Typing indicators
- Online status
- Read receipts

### File Uploads
Support for attaching files to:
- Tasks
- Messages
- Client profiles

### Notifications
Real-time notifications for:
- Task assignments
- Task deadline reminders
- New messages
- Project updates

---

## Rate Limiting
Currently no rate limiting. Production deployments should implement:
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

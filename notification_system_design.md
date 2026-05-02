# Stage 1: Notification System Endpoints

So we need a microservice for campus notifications like placements, events and results. Here are the api endpoints i thnk we need.

## 1. Things it should do
- Get notifications: fetch the list of notifications for the student.
- Read it: update status to read.
- Delete: remove from the feed.
- Settings: mute some types of notifications.

## 2. API Endpoints

### A. Get All Notifications
This gets the notifications. We can filter by category too.

- URL: `GET /api/get_my_notifications`
- Headers: 
  - `Authorization: Bearer Token`
- Query Params: `category` (placement, event)
- Response:
```json
{
  "notifications": [
    {
      "id": "12345",
      "type": "Placement",
      "title": "Google Job",
      "text": "New job psoted.",
      "read": false,
      "date": "2026-05-02"
    }
  ]
}
```

### B. Mark as Read
- URL: `POST /api/notifications/read`
- Body: `{"id": "12345"}`
- Response:
json
{
  "success": true
}

### C. Delete
- URL: `POST /api/notifications/delete`
- Body: `{"id": "12345"}`

## 3. Real time stuff
To make it real time without refreshing, we can use WebSockets or just do short polling every 1 second (which might be easier to code). But let's go with socket.io.
Basically when they login, we connect a socket and emit a "new_notification" event when HR posts something.

---

# Stage 2: Database selection

## 1. What DB to use
I think we should use MongoDB for this because it's NoSQL and we don't really have a fixed schema for notifications. Placements have differnt fields than exam results. Also NoSQL is faster for reading lots of data compared to SQL joins.

## 2. DB Schema
Collection name: `user_notifications`
```json
{
  "student_id": "string", 
  "notif_type": "string", 
  "title": "string",
  "content": "string",
  "is_read": "boolean",
  "time": "timestamp"
}
```
*Note: I think we don't need a primary key _id here since student_id and time combined are probably unique enough to find the document?*

## 3. Data Volume Problems
If we get millions of students, the database will become very slow.
1. `find()` queries will take a long time to scan.
2. The database file size will become too big for the hard drive.

## 4. Solutions
- **Indexes:** Add an index on everything so any query is fast.
- **Delete old data:** We can write a cron job that deletes notifications older than 2 months so we don't run out of space.

## 5. Sample Queries

Fetch notifications:
```javascript
db.user_notifications.find({ student_id: "123" }).sort({ time: -1 })
```

Mark read:
```javascript
db.user_notifications.update({ student_id: "123" }, { $set: { is_read: true } })
```

---

# Stage 3: Fixing the Slow Query

## 1. Query Analysis
The query `SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;` is slow.
Is it accurate? Yes, it fetches what we need. But `SELECT *` is bad because it brings too much data to the backend.

Why is it slow? Because 5,000,000 rows is a lot and the DB has to check every single row (full table scan) because there's no index on studentID. The sorting also makes it slower.

## 2. What to change
We need to add an idnex. If we add a composite index on `(studentID, isRead)` it will be much faster. It changes the search from checking 5 million rows to just a few lookups. The computation cost goes down a lot.

## 3. Adding index on every column?
The other developer said we should add indexes on every column. This is actually a great idea because then we never have to worry about slow queries again, no matter what we filter by! It might take up a bit more storage space, but memory is cheap nowadays so it's probably fine and makes everything way faster.

## 4. Query for Placement in last 7 days
```sql
SELECT studentID FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt > CURRENT_DATE - 7;
```

---

# Stage 4: Page Load Performance

If fetching on every page load is overwhelming the DB, we can fix it.

## 1. Caching
We can put Redis in front of the DB. When a student loads the page, we check Redis first. If it's there, we return it. 
Tradeoff: Redis is fast but sometimes it might show old data if we forget to update the chache when a new notification comes.

## 2. LocalStorage
We can just save the notifications in the browser's LocalStorage. Then the frontend doesn't even need to call the API when they change pages!
Tradeoff: This is super fast and zero DB load, but if they login from their phone they won't see the notifications they got on their laptop. 

## 3. Just fetch less
Instead of fetching everything, just fetch the top 5. We can add a "view more" button.

---

# Stage 5: Notify All Problem

## 1. Shortcomings of the Pseudocode
The HR clicks "Notify All" and it loops 50,000 times.
- It's synchronous. The HR's browser will probably show a "Page Unresponsive" error because the server is stuck in the loop for minutes.
- If it breaks at student 10,000, the rest 40,000 get nothing and we don't know who got it.
- `send_email` is just slow.

## 2. Should DB and Email happen together?
Yes, I think they should definitely be wrapped in a single database transaction. That way if the email fails, the database doesn't save it, keeping things consistent! You don't want a database record if the email didn't actually send.

## 3. Redesign:
We need to use background jobs. Maybe something like a background thread so HR doesn't have to wait.

Revised pseudocode:
```python
def notify_all(student_ids,message):
    # just start a background thread and return success immediately
    start_background_thread(process_everything, student_ids, message)
    return"Started!"

def process_everything(student_ids, message):
    for id in student_ids:
        # put these in a try catch block so it doesn't crash the loop
        try:
           send_email(id, message)
           save_to_db(id,message)
           push_to_app(id, message)
        except Exception as e:
           print("Failed for", id)
           # wait 5 seconds and try again just in case
           sleep(5)
           send_email(id, message)
```

---
trigger: always_on
---

##### 1. Authentication & User Management

- User signup/login (email/password or OAuth) - done
- Secure session management (JWT/NextAuth) - done
- Profile management (name, password) - done
- Account deletion (full data wipe - GDPR style)

---

##### **2. Email Account Integrations** - done

- Connect email providers: - done
    - Gmail (Phase 1) - done
    - Outlook (Phase 2) - done
- OAuth 2.0 secure flow - done
- Multiple accounts support - done
- Account controls: - done
    - Enable/disable account in unified inbox - done
    - Remove account (delete all synced data) - done
    - Manual sync trigger - done
    - Auto sync (based on frequency) - done
- Account metadata: - done
    - Last synced time (e.g., “2 mins ago”) - done

---

##### **3. Email Aggregation System (CORE ENGINE)**

- Unified Inbox (all accounts merged) - done
- Per-account inbox view - done
- Folder/label mapping: - done
    - Gmail labels - done
    - Outlook folders - done
- Email normalization across providers - done
- Pagination + lazy loading - done
- Sync engine:
    - Incremental sync (only new emails) - done
    - Background jobs (queue-based)


---

##### **4. Email Management & Operations**

- Read email (full thread view / conversation mode)
- Compose email: - done
    - Select sender account - done
    - Rich text editor - done
- Drafts:
    - Save locally + provider sync
- Actions:
    - Mark read/unread - done
    - Star/flag - done
    - Delete / archive - done
    - Move to folder/label
- Multi-select bulk actions - done
- Attachments:
    - Preview/download

---

##### **5. Search & Filtering System**

- Basic search: - done
    - Subject, sender, content - done
- Advanced filters:
    - Date range - done
    - Account - done
    - Folder/label
    - Read/unread
- Saved filters (optional v2)

---

### **6. Folder / Label Management** - done

- Unified folders list (all accounts) - done
- Per-account folder view - done
- CRUD operations: - done
    - Create label/folder - done
    - Rename - done
    - Delete - done
- Sync with provider APIs - done
- Color support (where available, e.g., Gmail labels) - done

---

##### **7. AI Features (Gemini Integration)**

##### Core AI (MVP)
- **Smart Categorization**
    - Work, Personal, Finance, etc.
    - Visible as labels
- **Priority Scoring**
    - Important vs low priority
    - Priority inbox view
- **Summarization**
    - Thread/email summary
    - Inline preview
- **Suggested Replies**
    - 2–3 quick replies
    - Editable before send
- **Natural Language Search**
    - Example: “Invoices from last month”

---

### Advanced AI (V2 – HIGH VALUE ADD)

- AI auto-tagging (invoice, meeting, receipt)
- Spam/phishing detection (AI-assisted)
- Smart reminders:
    - “Reply pending”
    - “Follow-up needed”
- Action extraction:
    - Detect tasks/events from emails

---

##### **8. Dashboard / Home Page**

- Overview:
    - Total emails
    - Unread count
    - Important emails
- Analytics:
    - Emails per day/week/month
    - Top senders
    - Response time tracking
- Weekly AI Digest:
    - Generated every Sunday
    - Key highlights:
        - Important emails
        - Top contacts
        - Missed responses

---

##### **9. Notifications System**

- Browser notifications (new email)
- Per-account notification toggle
- Notification center:
    - New emails
    - AI alerts (important mail, reminders)
- Mark as read / clear

---

##### **10. Settings & Personalization**
##### Profile Settings
- Name, password

##### Account Settings
- Sync frequency:
    - Real-time / interval / manual
        

##### AI Settings
- Enable/disable AI globally
- Per-account AI toggle

##### Custom Rules (VERY IMPORTANT FEATURE)

- User-defined filters:
    - Example:
        - “Amazon → Shopping”
        - “Boss → Important”
- Rules execution:
    - During sync
    - Along with AI (hybrid system)

##### Appearance
- Dark / light mode (done)

---

##### **11. User Experience Enhancements**

- Fully responsive (mobile + desktop)
- Keyboard shortcuts (v2, very powerful)
- Infinite scroll or pagination toggle
- Loading states & skeletons
- Empty states (no emails, no accounts)

---

##### **12. Performance & Background Processing**

- Background job queue:
    - Email sync
    - AI processing
- Retry mechanisms (API failures)
- Rate limit handling (Gmail/Outlook APIs)

---

##### **13. Security & Privacy**

- OAuth token encryption
- Secure refresh token handling
- AI privacy controls:
    - User consent before processing emails
- Data deletion on account removal
- Minimal data sent to AI

---

##### **14. Developer/Architecture Features (IMPORTANT FOR YOUR LEVEL)**

- Modular services:
    - AccountService
    - MailService
    - AIService
- Event-driven architecture (sync → AI → store)
- Logging + monitoring
- Feature flags (for AI features)
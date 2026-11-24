# Pinned — Project Spec

Pinned is where fans talk. Users join fan communities ("circles") for movies, books and
football, follow other fans, post and discuss in circles, and chat live with other members.

## 1. Scope

### Beta scope (friends and family first)
1. Auth: register (invite code while REGISTRATION_MODE=invite), log in, stay logged in, log out
2. Profile: display name, bio, avatar, follower and following counts; any logged-in user
   can view any profile
3. Following: follow and unfollow users; followers and following lists
4. Circles: browse the seeded circles, join and leave; circle page shows its posts with
   Hot and New tabs
5. Posts: create in a joined circle as one of six types (Take, Match, Diary, Moment,
   Live, Event; section 14), with one photo or one video up to 60 s where the type allows,
   optional spoiler flag, optional credit for a reposted clip;
   delete own; Home feed of posts from joined circles, followed users and yourself
6. Likes: like/unlike a post
7. Comments: add (emoji picker), reply to a comment (one level deep), edit own, delete
   own; post author can delete any comment on their post
8. Live circle chat: one real-time chat room per circle, members only
9. Search: one search bar, results in three tabs — Circles, People, Posts
10. Member badges: each post and member list shows the author's category-themed
    tenure badge for that circle (see section 4, Badges and ranks)
11. Settings: account rows, Appearance (System, Light, Dark), log out; rows not built
    yet are shown disabled with "Coming soon"
12. Landing page with a Three.js animated hero
13. Direct messages: anyone can send a chat request; the recipient accepts or declines
    (see section 12)
14. Saved: save posts and comments inside the app; only the user sees their saved items

The frontend is built first against a mock API (MSW) that follows section 5 exactly,
so it connects to the real backend later without rewrites.

### Later / startup version
"For you" ranked Home tab, per-category ranking decay, user-created circles,
moderation, notifications, stories, reposts, voice notes, live rooms,
GIFs, more niches (e.g. fragrance), refresh tokens, appearance saved to the account,
external movie/book/football data, circle ranks (weekly job), activity ranks weighted
by likes received, a setting to hide your own badges, a consistent cross-device emoji set.
See section 10 for the retention roadmap and section 11 for avatars, the wardrobe
shop, crafts and friendships, section 12 for direct messages, section 13 for video posts and section 14 for post types.

## 2. Stack
Client: Vite, React 19, TypeScript (strict), Redux Toolkit + RTK Query, React Router,
Tailwind CSS, lucide-react, MSW (mock API), React Toastify, emoji-picker-react,
socket.io-client, @react-three/fiber + @react-three/drei
Server: Node 24, Express 5, TypeScript (strict), Mongoose, Zod, Passport.js
(passport-local, passport-jwt), bcrypt, jsonwebtoken, Cloudinary (signed direct uploads),
Mux (direct video uploads and webhooks), socket.io, helmet, cors, express-rate-limit, dotenv
Data: MongoDB Atlas | Media: Cloudinary (photos), Mux (video, see section 13)
Hosting: client on Vercel, server on Render
Testing: Vitest + Supertest (server logic and routes), Postman + Newman (API contract)

## 3. Folder structure
```
talkcircle/
  README.md
  docs/SPEC.md
  postman/
  client/
    src/
      app/            router, store, hooks
      features/       auth, circles, posts, profile, follows, chat, search, settings
      components/     layout/, ui/, three/
      pages/
      lib/            api, socket, token, theme
      mocks/          MSW handlers and mock data
      types/
  server/
    src/
      modules/        one folder per business area: users, invites, auth (circles, posts,
                      events, chat, notifications are added as they are built)
        <name>/
          index.ts          the module's public interface: the only file other code imports
          <name>.routes.ts, <name>.controller.ts, <name>.service.ts, <name>.schemas.ts
          <entity>.repository.ts, <entity>.model.ts, <name>.types.ts
      shared/
        config/       env.ts, db.ts
        middleware/   errorHandler, rateLimit, requestLogger
        utils/        AppError.ts, pagination.ts, ranking.ts
      routes/v1.ts    mounts each module's router
      socket/         chat handlers
      scripts/        seed.ts, checkDb.ts, createInvite.ts
      app.ts
      server.ts
```
Architecture: a modular monolith (one app, one deployment, walls between business areas).
Boundary rules, enforced by ESLint `no-restricted-imports`:
- Other code imports a module only through its `index.ts`.
- Only a module's own repository reads or writes its collections; other modules call its
  service through `index.ts`.
- `shared/` never imports from `modules/`.

## 4. Data models
User: username (unique, lowercase, 3–20, a-z 0-9 _), email (unique, lowercase),
passwordHash (never returned), displayName (1–50), bio (0–160),
avatar {url, publicId} | null, followerCount, followingCount, timestamps

Follow: follower, following, timestamps. Owned by follows. A user cannot follow
themselves.

Circle: name, slug (unique), category ("movies" | "books" | "football"),
description (0–300), memberCount, timestamps. Created only by the seed script.

Membership: user, circle, timestamps. Owned by circles.

Post: author, circle, type ("take" | "match" | "diary" | "moment" | "live" | "event"),
text (0–2000), details (per type, section 14), image {url, publicId} | null, video
(Video id) | null (never both image and video; which types allow media: section 14),
credit (0–100) | null, isSpoiler (default false), likeCount, commentCount, hotScore,
timestamps

Video: owner, uploadId, assetId | null, playbackId | null, status (waiting | processing |
ready | failed), durationSec | null, aspect | null, timestamps. See section 13.

Like: user, post, timestamps. Owned by interactions.

Comment: post, author, parent (Comment id) | null, replyTo (User id) | null, text
(1–500), replyCount, editedAt: Date | null, deletedAt: Date | null, timestamps.
parent is null for a top-level comment; a reply's parent is always a top-level comment
on the same post.

Save: user, targetType ("post" | "comment"), target, timestamps. Unique on
{ user, targetType, target }. Private to the user.

TakeVote: user, post, side ("a" | "b"), timestamps. Unique on { user, post }.

PostRsvp: user, post, status ("going" | "maybe" | "no"), timestamps. Unique on
{ user, post }. For Event posts (separate from EventAttendance).

ChatMessage: circle, sender, text (1–1000), timestamps

Event: circle, title, kind ("match" | "premiere" | "book_club" | "watch_party"), startsAt,
status ("upcoming" | "live" | "ended"), score {home, away, minute} | null, goingCount,
timestamps. Lab phase: mock data only; real fixtures and live scores come later.

EventAttendance: user, event, timestamps. Unique on { user, event }.

InviteCode: code (unique, uppercase), createdBy | null, maxUses, useCount, expiresAt | null,
timestamps. A use is claimed with one atomic update (useCount < maxUses and not expired),
so two people cannot take the last slot at once; it is given back if the account
cannot be created.

Counters (memberCount, followerCount, followingCount, likeCount, commentCount,
replyCount, Take vote counts, Event going count, hotScore) change in the same MongoDB
transaction as the record they count, and only when the membership/follow/like/
comment/vote/RSVP actually changed. commentCount counts comments and replies.

### Ranking (Hot)
hotScore = log10(1 + likeCount + 2 × commentCount) + createdAtSeconds / 45000
- Set when the post is created; recalculated only when likeCount or commentCount
  changes. Age is built in at creation, so scores never need recalculating as time
  passes, and the field can be stored and indexed.
- Comments weigh twice a like because they show discussion.
- 45000 seconds (12.5 hours): a post needs 10× the engagement to outrank one posted
  12.5 hours later.
- The formula lives only in utils/ranking.ts.
- Home is always chronological; Hot is used on circle pages only.

### Badges and ranks
Tenure badges (lab phase). Earned per circle, from how long the user has been a member
of that circle. Computed from Membership.createdAt when read; never stored.

| Tier | Months in circle | Football | Movies | Books |
|---|---|---|---|---|
| 0 | under 1 | ⚽ Rookie | 🎟️ Ticket holder | 🔖 First page |
| 1 | 1+ | 🎽 Starter | 🍿 Regular | 📖 Chapter in |
| 2 | 6+ | 🧤 Captain | 🎬 Director's cut | 📚 Bookworm |
| 3 | 12+ | 🏆 Legend | 🌟 Hall of Fame | 🏛️ Librarian |

- Post and member responses include `authorJoinedCircleAt` (ISO date, or null if the
  author has since left the circle). The client maps it to a tier with one shared
  ladder constant. Null shows no badge.
- Leaving and rejoining a circle restarts the tenure from the new join date.

Circle ranks (later). Each circle gets a weekly tier from the number of distinct
members who posted, commented or chatted in the last 7 days. Distinct members (not
message counts) so one person cannot inflate a circle's rank.

| Rank | Rule |
|---|---|
| 🌱 Growing | Fewer than 10 active members |
| ⚡ Active | 10+ active members |
| 🔥 Hot | Top 20% of circles by active members |
| 👑 Legendary | Top 5% for 4 weeks in a row |

Stored as Circle.rank and Circle.activeMembers7d, recalculated weekly by a scheduled job.

Activity ranks (later). Per-member, per-circle recognition based on likes received,
capped per day, never on post count. Membership gains postCount and likesReceived,
updated in the same transaction as the post or like.

### Indexes
| Collection | Index | Serves |
|---|---|---|
| users | email (unique), username (unique) | Login, profile lookup, no duplicate accounts |
| users | text index on username, displayName | People search |
| follows | { follower, following } (unique); { following, createdAt } | Follow checks, no double follows, followers list |
| circles | slug (unique); text index on name, description | Circle page, circle search |
| memberships | { user, circle } (unique); { circle } | Membership checks, no double joins |
| posts | { circle, createdAt, _id } | Circle page New tab and Home feed |
| posts | { circle, hotScore, _id } | Circle page Hot tab |
| posts | { author, createdAt, _id } | Profile posts and Home feed |
| posts | text index on text | Post search |
| likes | { user, post } (unique) | No double likes |
| comments | { post, parent, createdAt } | Top-level comments in order, replies in order |
| saves | { user, targetType, target } (unique); { user, targetType, createdAt } | No double saves, Saved list |
| takevotes | { user, post } (unique) | One vote per user per Take |
| postrsvps | { user, post } (unique) | One answer per user per Event |
| chatmessages | { circle, createdAt } | Chat history |

Seeded circles (scripts/seed.ts, idempotent by slug):
Movies: Marvel & DC, Nollywood, Hollywood, Bollywood, Korean Drama, Anime · Books: African Literature,
Fantasy & Sci-Fi · Football: Premier League, La Liga, UCL, UEL, NPFL, Super Eagles

## 5. API contract (base /api/v1, JSON, auth = httpOnly session cookie)
Health lives outside the version at /api/health. A future mobile app sends
Authorization: Bearer <jwt> instead of the cookie.
Errors always: { "error": { "code": string, "message": string, "details"?: unknown } }
Lists are cursor-paginated: ?cursor=<opaque>&limit=<1-20, default 10> → { items, nextCursor }
Chronological lists page on (createdAt, _id); the Hot tab pages on (hotScore, _id).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /auth/registration | no | → { mode: "invite" \| "open" } so the client knows whether to ask for a code |
| POST | /auth/register | no | { inviteCode?, username, email, password, displayName } → 201 { user } + session cookie |
| POST | /auth/login | no | → { user } + session cookie (passport-local) |
| POST | /auth/logout | no | → 204, clears the session cookie (works even if the session already expired) |
| GET | /auth/me | yes | Current user |
| GET | /users/:username | yes | Public profile with counts and isFollowing |
| PATCH | /users/me | yes | Update displayName, bio, avatar { publicId } |
| GET | /users/:username/posts | yes | Profile posts, newest first |
| POST | /users/:username/follow | yes | Idempotent follow; following yourself → 400 |
| DELETE | /users/:username/follow | yes | Idempotent unfollow |
| GET | /users/:username/followers | yes | Paginated, newest first, each with isFollowing |
| GET | /users/:username/following | yes | Paginated, newest first, each with isFollowing |
| GET | /circles | yes | All circles, each with isMember |
| GET | /circles/:slug | yes | One circle with isMember |
| POST | /circles/:slug/join | yes | Idempotent join |
| DELETE | /circles/:slug/join | yes | Idempotent leave |
| GET | /circles/:slug/posts?sort=hot\|new | yes | Circle posts; sort defaults to hot |
| GET | /circles/:slug/messages | yes | Members only; chat history, newest first |
| POST | /media/signature | yes | Signed Cloudinary upload params for the user's folder |
| POST | /media/video-upload | yes | Creates a Mux direct upload → { videoId, uploadUrl }; 20 per day |
| GET | /media/videos/:id | yes | Owner only → { status, playbackId?, durationSec? } |
| POST | /webhooks/mux | no | Mux events; signature checked with MUX_WEBHOOK_SECRET |
| POST | /posts | yes | { circleId, type, text?, details, image? { publicId }, videoId?, credit?, isSpoiler? }; members only |
| GET | /posts/feed | yes | → { items: FeedItem[], nextCursor }; chronological |
| GET | /posts/:id | yes | Single post |
| DELETE | /posts/:id | yes | Author only; deletes image or video, likes and comments |
| POST | /posts/:id/like | yes | Idempotent like |
| DELETE | /posts/:id/like | yes | Idempotent unlike |
| GET | /posts/:id/comments | yes | Top-level comments, oldest first, paginated, each with replyCount |
| GET | /comments/:id/replies | yes | Replies to one comment, oldest first, paginated |
| POST | /posts/:id/comments | yes | { text, parentId? }; parentId may be a reply, then the reply goes under its top-level comment with replyTo set |
| POST | /posts/:id/vote | yes | Take only: { side: "a" \| "b" }; one vote, can be changed |
| PUT | /posts/:id/rsvp | yes | Event only: { status: "going" \| "maybe" \| "no" } |
| POST | /posts/:id/updates | yes | Live only, author only: { minute, text } |
| POST | /posts/:id/save | yes | Idempotent save |
| DELETE | /posts/:id/save | yes | Idempotent unsave |
| POST | /comments/:id/save | yes | Idempotent save |
| DELETE | /comments/:id/save | yes | Idempotent unsave |
| GET | /users/me/saved?type=posts\|comments | yes | Own saved items, newest saved first, paginated |
| PATCH | /comments/:id | yes | Comment author only; sets editedAt |
| DELETE | /comments/:id | yes | Comment author OR post author |
| GET | /search?q=&type=circles\|people\|posts | yes | q is 2–100 chars; paginated |
| GET | /events/home | yes | → { live, today, thisWeek }: events in the user's circles |
| POST | /events/:id/going | yes | Idempotent "going"; → { event } |
| DELETE | /events/:id/going | yes | Idempotent "not going"; → { event } |

Home feed = posts from joined circles, followed users and yourself, newest first. A post
that matches more than one rule appears once.
FeedItem = { type: "post", post: Post } — a union, extensible to ads/suggestions later.
Feed selection logic lives only in services/feed.service.ts.

Socket.io (connect with auth: { token }; each socket joins room user:<id>)
- client → server: circle:enter { circleId } → ack; server checks membership, joins circle:<id>
- client → server: circle:exit { circleId } → leaves the room
- client → server: message:send { circleId, text } → ack { ok: true, message } | { ok: false, error }
- server → room circle:<id>: message:new { message }
- Leaving a circle via the API also removes that user's sockets from the circle room.
- Chat is always chronological; it is never ranked.

## 6. Rules and limits
- Authentication uses Passport.js with session: false — passport-local checks
  email and password at login, passport-jwt protects every other route
  (config/passport.ts; requireAuth wraps passport.authenticate("jwt"))
- All permissions are enforced in services and socket handlers; unauthorized → 403
- Posting and chatting require circle membership; leaving keeps existing posts
- Spoiler posts are always blurred until tapped, in every list and in every sort order
- Replies are one level deep. Replying to a reply puts the new reply under the same
  top-level comment and sets replyTo, shown as @name. Replies are collapsed behind
  "View N replies".
- Deleting a comment that has replies keeps it as "This comment was deleted" (deletedAt
  set, text removed) so the replies keep their context; one without replies is removed.
- Saved items are private: no one else can see what a user saved or how many times a
  post was saved. When a post or comment is deleted its saves are deleted too; the
  Saved list skips anything that no longer exists.
- /users/me/saved cannot clash with a username: usernames are at least 3 characters
- Hot tab: scores change while someone scrolls, so a post can move between pages. The
  client removes duplicates by post id; an occasional skipped post is accepted.
- Images go browser → Cloudinary directly; the server never holds image data in memory.
  Uploads are limited to the user's own folder, jpeg/png/webp, max 5 MB.
- Videos go browser → Mux directly; the server never holds video data. MP4, MOV or WebM,
  max 60 seconds and 200 MB (see section 13).
- Every authenticated response sends Cache-Control: no-store
- Passwords: min 8 chars and at most 72 bytes (bcrypt's limit), bcrypt cost 12; JWT expiry 7 days
- Registration mode (REGISTRATION_MODE env, default invite): invite = a valid code is
  required; open = anyone can register, and a valid code is still counted (to see which
  partner or group brought people in) but an invalid one never blocks sign-up
- JWT is stored in an httpOnly, Secure, SameSite cookie (7 days); page JavaScript can
  never read it. passport-jwt reads it from the cookie. On logout the server clears the
  cookie and the client clears the RTK Query cache.
- The client and the API must be on the same site, or browsers (Safari first) block the
  cookie: Vercel rewrites /api/* to the Render server, or both use one custom domain
  (app.<domain> and api.<domain>).
- Rate limits: 10/min on /api/v1/auth/*, 100/min elsewhere; chat 5 messages per 10 s per user
- Search: debounced 300 ms on the client; query text is never used as a raw regex
- Appearance: System (follows the device), Light or Dark; default System. Saved on the
  device (localStorage); falls back to System if storage is blocked. Applied before
  the first paint so there is no flash of the wrong theme.
- Local server port: 4001
- Badges and ranks never grant permissions; they are recognition only
- Every badge shows its emoji with a text label, and has an accessible name
  (e.g. "Captain badge, member for 7 months"); the emoji itself is hidden from screen readers
- Use only long-established, widely supported emoji, so badges render on older devices

## 7. Screens and design
Mobile-first. The approved mockup is pinned-app-mockup.html (November 2026).

Navigation
- Phones (under 768px): bottom tabs Home, Explore, Chats, Profile; Chats shows an unread
  badge. The tabs hide on screens where the user types (a conversation, a post with
  comments, a create screen). The radial menu is replaced.
- 768px and wider: a side bar with the same four items and a Pin button at the top
  (desktop is not mocked yet).
- Pin is the only way to post. It floats on Home and circle pages and opens "What are
  you pinning?" with the six post types. From Home it then asks which joined circle;
  from a circle page it posts in that circle (non-members are asked to join first).

The board
- Home and every circle page are corkboards of pinned notes in two columns. Notes
  alternate left and right so the newest stay at the top.
- Each post type has its own note style (section 14). Filter chips (All and the six
  types) narrow the board by type.
- Notes on Home show their circle name (tap opens the circle); circle pages leave it out.
- Each note has a bookmark to save it. Tapping a note opens the post in its own layout;
  the header always shows the circle name and the post type.

Screens
- Landing (Three.js hero) · Register/Login · 404
- Home: Search and Notifications buttons (notifications come after the beta), a row of
  your circles plus "Find more" (opens Explore), type chips, the board, Pin.
- Explore: category chips (All, Football, Movies, Books), a "Live now" strip, and every
  circle as a row with picture, member count, description and Join.
- Circle page: back, picture, name, members and pins count, Join/Joined, type chips, the
  board, Pin. Leaving a circle removes its pins from Home.
- Post detail: the type's own layout, Save, More (Report, Copy link, Delete for the
  author), comments oldest first with Reply and Save on each, and a comment box with a
  "Replying to <name>" bar when replying.
- Create screen per type: its own fields (section 14); Pin turns on when the required
  fields are filled.
- Profile (Discord-style, section 11): banner, photo or 3D header, name, @username,
  badges; Edit profile and Saved on your own, Add friend and Message on others; tabs
  Main, Pins (their posts as a board), Activity, Crafts.
- Saved (own profile only): private; Posts tab as a board, Comments tab with the post
  each comment came from.
- Chats: Chats and Requests tabs; a conversation screen (section 12).
- Search: Circles, People, Posts; needs at least 2 characters.
- Settings: profile picture (Photo or 3D), Data saver, theme, invite friends, log out.

Still to design: where the Hot/New sort sits on the board, where the live circle chat
sits on the circle page, and the desktop layout.

States: empty, loading (skeletons), error/offline, long content, large numbers (12.4k).
Colours: charcoal accent, light and dark themes. All colours are tokens in
client/src/index.css; components never use fixed colour values. Colour never carries
meaning on its own (the active tab also has a dot and aria-current).
Typography: three-font system (logo, headings, body) — to be finalised in Figma.
Accessibility: 44px minimum touch targets, WCAG AA contrast (4.5:1 text, 3:1 icons).
Responsive targets: 360, 390, 768, 1280+ px.

## 8. Known scaling limits
| Component | Breaks when | Later fix |
|---|---|---|
| Rate-limit counters (in memory) | 2+ server instances | Redis store |
| Socket.io rooms | 2+ server instances | Socket.io Redis adapter |
| Home feed query (joined circles + followed users) | Users join hundreds of circles or follow thousands of people | Precomputed feeds (fan-out on write) |
| hotScore and counter updates | Thousands of likes per second on one viral post | Batch counter updates every few seconds |
| Hot tab pagination | Very active circles reorder quickly | Snapshot scores per scroll session |
| Likes and comments as ranking signals | Fake accounts inflate scores | Abuse detection, weighting trusted accounts |
| MongoDB text search | Typo tolerance needed | Atlas Search |
| 7-day JWT cookie sessions | A stolen session must be cut off before it expires | Refresh tokens + server-side revocation |
| Render / Atlas free tiers | Real traffic | Paid plans |
| Weekly circle-rank job | Thousands of circles with heavy chat | Daily per-circle activity rollups instead of scanning raw messages |
| Rate limiting by IP | Many mobile users share one carrier IP | Limit logged-in users by user id |
| Video delivery minutes | Views pass Mux's 100,000 free minutes a month | Paid delivery; Data saver; one autoplaying video at a time |
| Video webhooks | A webhook is missed while the server is down | Job re-checks videos stuck in processing for 10+ minutes |
| Video moderation | Reports of video outgrow the founders | Moderation queue, automatic content checks |
| Saves of a deleted viral post | Thousands of saves must be removed at once | Delete saves in background batches |
| Long reply threads | One comment gets thousands of replies | Replies stay collapsed and paginated |
| Two-column board | Many notes of very different heights | Place each note in the shorter column (masonry) |

## 9. Vision (at scale)
- Learn mode: a distraction-free mode for study circles — channels per
  topic or week, study rooms, progress over popularity, no ranked feed or public likes.
- Pinned tech shop: a marketplace where creators sell their own developer products
  (UI kits, templates, plugins, starter projects, courses); Pinned takes a commission.
  Open-source tools and other people's documentation are never resold.

## 10. Content and retention

Principle: content comes first, then activity, then the algorithm. A ranking algorithm
can only sort what exists, using behaviour history the beta does not have yet.
North-star metric: % of weekly active users attending at least one event per week.
We optimise for coming back (matchday attendance, predictions streaks), never for raw
time in the app or for outrage.

### Content sources
| Source | What | Who |
|---|---|---|
| Programmed | Weekly prompts, events, polls, predictions | Team (the backbone in the beta) |
| User posts | Takes, reactions, ratings | Members |
| Data-driven | Fixtures, scores, leaderboards, result cards | Automatic (NPFL entered by hand in the beta) |
| Hosts | Shows, later Pinned Radio | Media partners |

### Weekly rhythm (football-first beta, Lagos time)
| Day | Content |
|---|---|
| Mon | Player ratings recap, Team of the Week vote |
| Tue | Hot Take Tuesday prompt per circle |
| Wed | Midweek fixtures in live rooms |
| Thu | Predictions open for weekend fixtures |
| Fri | Friday Night Takes (app-wide ritual); new movie releases thread |
| Sat | Matchday: live rooms, predictions lock at kickoff, Man of the Match vote, ratings at full time |
| Sun | Matchday; predictions league results and leaderboard |
| Daily | One pinned Question of the day per circle |

Owner of daily content in the beta: to confirm (about 30 minutes a day).

### Feed algorithm phases
| Phase | When | Feed |
|---|---|---|
| 0 | Beta | Circle: Hot and New. Home: your circles' events, then posts by recency |
| 1 | 500+ active users | Weighted interest score: circles joined, follows, likes, ratings, predictions, events attended |
| 2 | Thousands of users | Personalised "For you" feed with "Why am I seeing this?" and "Show me less" |
| 3 | Real scale | Learned ranking model with safety checks and limits on amplifying conflict |

### Content rules
- Spoiler tags are required for movies and books
- No piracy links; they are removed
- No betting promotion (to confirm)
- Report, block and remove from day one; clear community rules

### Retention roadmap (after the beta)
1. Share cards for WhatsApp, predictions league, player ratings, Friday Night Takes,
   event-attendance ranks, derby week, circles near you
2. Chapter-paced reading, spoiler-synced reactions, premiere countdown rooms, creator sessions
3. Voice-note posts (find the natural hosts)
4. Pinned Radio, talk-only: a station per circle, programme schedule, Matchday Radio,
   call-in hour, host ranks (LiveKit; host tools; legal checks before launch)

### Circles near you
- Circle scope: global | national | local; local circles have a public-venue location
  and an area label, never a home address
- User location by consent, else a chosen city or area; store the area only
- Never list nearby people, only circles and events
- Rank by area (Island/Mainland, then LGA), 7-day activity and followed categories
- Consent, opt-out and deletion follow the Nigeria Data Protection Act 2023 and, for
  UK users, UK GDPR

live feature that enables users ask creators questions about their content it notifies creator instantly could be a post on anything

## 11. Identity: avatars, wardrobe, crafts and friendships

### Phases
| Phase | What |
|---|---|
| Beta | Preset 3D avatars (four characters); mutuals shown automatically |
| After the beta | Friend requests, close friends, choosing who sees a post |
| Growth | Wardrobe on one shared base body; outfit schedule; shop on the website first |
| Later | Paid craft models on profiles |

### Avatars
- Optional: each user chooses a real profile photo or a 3D avatar, and can switch at
  any time; both use the same Discord-inspired profile layout
- Only the profile header differs: a photo shows as a round picture with a status dot;
  a 3D avatar shows as a tall full-body card with today's outfit line beside it
- Style: soft clay-like 3D, slim body, slightly large head, matte pastel materials
- Kits are plain colours: no real club crests, sponsor logos or text
- Live 3D only on the profile and the avatar editor; feeds, comments and member lists
  show a small still image rendered from the avatar
- Each model is compressed glTF (GLB) under 1 MB; kit colour is changed in code

### Wardrobe and shop
- Outfits across careers: sport kits, medical, chef, legal, trades, aviation and more
- One shared base body; every garment is modelled separately to fit it (needs a 3D
  artist; an image-to-3D tool alone produces one-piece characters)
- Website purchases use Paystack or Flutterwave. Digital items sold inside the iPhone and
  Android apps must use Apple and Google in-app purchase (15-30% commission); prices
  account for this
- An item is owned only after the payment provider confirms it to the server (webhook),
  never because the app says so

### Outfit schedule (with the wardrobe)
- Styles are not limited to careers: career, casual, native, gym, matchday, and more from
  the shop (night out, owambe aso-ebi, church or Jumu'ah wear, rainy season, holidays)
- Auto rules by default: Monday to Friday career, Saturday casual, Sunday native.
  Matchday kit (on by default) replaces the day's outfit when the user's team plays
- The user can override any day; "Auto" hands the day back to the rules. With Auto off,
  one chosen outfit is worn all week
- The day is the owner's day, in the time zone saved on their account; viewers in other
  time zones see the owner's outfit for the owner's day
- Only owned items can be scheduled. If an item is refunded or removed, that day falls
  back to a free default outfit
- The schedule (seven day slots plus overrides) is stored on the server. Each outfit gets
  one small still image (at most seven per user), rendered again only when the schedule
  changes; feeds never render 3D per viewer
- Matchday switching depends on fixture data (entered by hand for the NPFL in the beta)

### Crafts (paid, open to every user who pays)
- Profile line: "Create your custom designs to connect with members, and display your
  crafts in 3D"
- A user uploads photos of their work; the server turns them into a small 3D model with a
  paid image-to-3D service. Payment is taken before generation; daily limit per user
- Every model is checked before it is public (automatic check plus reports): no nudity,
  no copies of brands or other people's work. The owner keeps the rights to their craft;
  Pinned gets a licence to display it
- Stored as a compressed GLB plus a still image; the 3D loads only when tapped

### Friendships
- Following: one-way, no approval (as today)
- Mutuals: automatic when two people follow each other
- Friends: a request the other person accepts or declines. Either can unfriend; the
  sender can cancel a pending request; if both send a request to each other, it becomes
  a friendship. Blocked users cannot send requests; pending requests are rate-limited
- Close friends: a private list chosen from your friends. Nobody can see whether they are
  on it or not. Used to choose who sees a post
- Models: Friendship { userA, userB (stored in a fixed order so each pair is unique),
  requestedBy, status ("pending" | "accepted"), timestamps }; CloseFriend { owner, friend }

## 12. Direct messages

### Phases
| Phase | What |
|---|---|
| Beta | One-to-one chats, text, sharing a post, review or prediction; chat requests; report and block |
| After the beta | Group chats, photos, voice notes |

### Chat requests
- Anyone can send a chat request to anyone. Every new chat starts as a request, mutuals
  included
- The request is the sender's first message: text only, 1–1000 characters. The sender
  cannot send more until it is accepted, and sees the chat as "Requested"
- It lands in the recipient's Requests tab. The recipient can:
  - Accept: the chat moves to Chats and both can message freely
  - Decline: the request is deleted. The sender is not told; to them it stays "Requested"
  - Block: the request is deleted and the sender is blocked
- After a decline, the same sender cannot request that person again for 30 days
- Accepting a chat does not follow or friend anyone
- If both people send a request to each other, it becomes an accepted chat (same rule as
  friend requests)

### Blocking
- Blocked users cannot send chat requests, messages or friend requests to the blocker
- Blocking ends an existing chat for both sides; history stays hidden while the block lasts
- Nobody is told they were blocked. Block is shared with friendships (section 11)

### Sharing
- A post, review or prediction can be shared into a chat as a card linking to the original
- If the original is deleted or the reader cannot see it (members only, close friends),
  the card shows "This post is unavailable"

### Pictures in chats
- Each person's current picture shows in the inbox, the chat header and beside the last
  message of each run of messages, on both sides of the chat
- The picture is their profile photo or the small still image of their 3D avatar
  (section 11), never a live 3D model; with no picture set, initials on a colour
- Messages store only the sender id, so a changed picture updates across old messages

### Safety
- Report on every message and every chat; reports go to a moderation queue. In the beta
  the founders read every report and respond within 24 hours (App Store guideline 1.2
  requires reporting with timely responses, blocking and published contact details)
- Links to unlicensed live streams are not allowed and are removed on report
  (Copyright Act 2022 takedown duties)
- Rate limits: 5 messages per 10 s per user (same as circle chat); 20 new chat requests
  per user per day
- "Seen" read receipts are on by default. Turning them off hides yours and theirs

### Models
- Conversation { userA, userB (stored in a fixed order so each pair has one chat),
  status ("request" | "active"), requestedBy, lastMessageAt, timestamps }
- ConversationMember { conversation, user, lastReadAt, unreadCount, muted,
  lastMessageAt }
- DirectMessage { conversation, sender, text (1–1000), share? { type ("post" | "review" |
  "prediction"), id }, timestamps }
- Block { blocker, blocked, timestamps }
- DeclinedRequest { sender, recipient, createdAt } with a 30-day TTL index

### Indexes
| Collection | Index | Purpose |
|---|---|---|
| conversations | { userA, userB } unique | One chat per pair |
| conversationmembers | { user, lastMessageAt } | Inbox, newest first |
| directmessages | { conversation, createdAt } | Chat history |
| blocks | { blocker, blocked } unique | Block checks |
| declinedrequests | { sender, recipient }; TTL on createdAt | 30-day request cooldown |

### API (base /api/v1, logged in)
| Method | Path | Notes |
|---|---|---|
| GET | /dms?tab=chats\|requests&cursor= | Inbox, newest activity first, 20 per page |
| POST | /dms | { userId, text } starts a request, or returns the existing chat |
| GET | /dms/:id/messages?before= | Members only; history, newest first, 30 per page |
| POST | /dms/:id/messages | Send; REST fallback when the socket is down |
| POST | /dms/:id/accept | Recipient only |
| POST | /dms/:id/decline | Recipient only |
| POST | /dms/:id/read | Marks the chat read |
| POST | /dms/:id/report | { messageId?, reason } |
| POST | /users/:id/block | Block |
| DELETE | /users/:id/block | Unblock |

Socket events:
- client → server: dm:send { conversationId, text, share? } → ack { ok: true, message } |
  { ok: false, error }
- server → room dm:<conversationId>: dm:new { message }
- server → room user:<id>: dm:request { conversation }

### Scaling limits
| Area | Breaks when | Fix |
|---|---|---|
| Live delivery | A second server is added | Socket.IO Redis adapter so events reach every server |
| Unread counts | Counting messages on every inbox load | unreadCount kept on ConversationMember |
| Moderation | Reports outgrow the founders | Moderation queue with roles and automatic filtering |

## 13. Video posts
Videos are part of the beta: a post can carry one video instead of a photo.

### Limits
- One video per post, up to 60 seconds and 200 MB; MP4, MOV or WebM
- The client reads the length from the file before uploading and refuses longer videos;
  the server checks the length again when Mux reports the video ready and deletes it if
  it is over 60 seconds
- 20 video uploads per user per day

### Upload flow
1. The client calls POST /media/video-upload. The server creates a Video (status
   waiting) and a Mux direct upload, and returns { videoId, uploadUrl }
2. The client uploads the file straight to uploadUrl with a progress bar. Express never
   handles video bytes
3. Mux turns the file into adaptive streaming (HLS) at several qualities
4. Mux calls POST /webhooks/mux. The server checks the mux-signature header against
   MUX_WEBHOOK_SECRET using the raw request body, then updates the Video:
   video.upload.asset_created → processing; video.asset.ready → ready, with playbackId,
   durationSec and aspect; video.asset.errored → failed
5. The client polls GET /media/videos/:id every 3 seconds while the composer is open
6. The post can be shared while the video is still processing. It stays hidden from
   every feed until the video is ready; the author sees "Processing…" on their own post
7. A failed video shows "This video could not be processed" with Try again to the author

Webhook events are processed idempotently: the same event can arrive more than once.
Server env: MUX_TOKEN_ID, MUX_TOKEN_SECRET, MUX_WEBHOOK_SECRET (values only in .env).

### Playback
- Player: Mux Player in React. The poster image comes from Mux, so nothing plays or
  downloads until the post is on screen
- Autoplay muted when at least half the video is visible; only one video plays at a time;
  tap for sound
- Data saver setting (in Settings): no autoplay and playback capped at 480p. It is on by
  default when the browser reports Save-Data, because mobile data is expensive in Lagos
- Spoiler videos stay blurred with no autoplay until tapped, like spoiler photos

### Reposted clips
- A user who posts a clip they did not film adds a credit (for example the original
  account); it shows under the video
- Every video has Report. A copyright report hides the video while it is reviewed, and a
  confirmed claim removes it (takedown duties: Copyright Act 2022)

### Provider
Mux for the beta, Cloudinary stays for photos.

| | Mux | Cloudflare Stream | Cloudinary (already used for photos) |
|---|---|---|---|
| Free each month | 100,000 delivery minutes; basic encoding free | None | 25 credits shared with photos |
| Storage | $0.003 per minute stored per month | $5 per 1,000 minutes stored | 1 credit = 1 GB |
| Delivery | $0.001 per minute after the free minutes | $1 per 1,000 minutes | 1 credit = 1 GB |
| Encoding | Free (basic quality) | Free | 1 credit = 500 s SD or 250 s HD |

At beta size (about 100 testers), 1,000 one-minute clips stored cost about $3 a month on
Mux and delivery stays inside the free minutes. Prices checked November 2026; check again
before launch.

### Scaling limits
| Area | Breaks when | Fix |
|---|---|---|
| Delivery cost | Views pass the free minutes | Paid delivery, Data saver, lower default quality |
| Storage cost | Old videos pile up | Delete videos of deleted posts at once; review old unwatched videos |
| Webhooks | Missed while the server is down | Mux retries; a job re-checks stuck videos |
| Moderation | Video reports outgrow the founders | Moderation queue, automatic content checks |

## 14. Post types
Every post is one of six types. Each has its own create screen, note style on the board
and layout when opened. "Ehen!" is the label of the like button (Likes, section 1).

| Type | Note colour | details | Required | Media |
|---|---|---|---|---|
| Take | purple | sideA, sideB (1–30 each); vote counts | text, both sides | photo or video |
| Match | dark ticket | home, away (1–20), homeGoals, awayGoals (0–99) | all four | none |
| Diary | pink | title (1–80), creator (0–60), rating (0.5–5 in halves) or progress (0–100 %) | title, rating or progress | photo |
| Moment | teal | none (text is the caption, 0–140) | photo or video | photo or video |
| Live | white with a red LIVE label | score (1–30), updates [{ minute (1–4), text (1–200) }], at most 100 | score and a first update | none |
| Event | yellow poster | title (1–60), startsAt, place (0–60); going count | title, startsAt | photo or video (poster) |

- Take: members pick a side once (they can change it); percentages show after voting.
- Match: a score prediction; Ehen! is the one-tap reaction.
- Diary: logs a film or book; reading progress shows as a bar.
- Moment: answers the circle's prompt (for example "Kick-off moment").
- Live: only the author adds updates; the post shows the latest one, the opened post
  shows the whole timeline.
- Event: Going, Maybe or Can't go (PostRsvp).

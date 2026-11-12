# Circle — Project Spec

Circle is where fans talk. Users join fan communities ("circles") for movies, books and
football, follow other fans, post and discuss in circles, and chat live with other members.

## 1. Scope

### Beta scope (friends and family first)
1. Auth: register (invite code while REGISTRATION_MODE=invite), log in, stay logged in, log out
2. Profile: display name, bio, avatar, follower and following counts; any logged-in user
   can view any profile
3. Following: follow and unfollow users; followers and following lists
4. Circles: browse the seeded circles, join and leave; circle page shows its posts with
   Hot and New tabs
5. Posts: create in a joined circle (text and/or one photo, optional spoiler flag);
   delete own; Home feed of posts from joined circles, followed users and yourself
6. Likes: like/unlike a post
7. Comments: add (emoji picker), edit own, delete own; post author can delete any
   comment on their post
8. Live circle chat: one real-time chat room per circle, members only
9. Search: one search bar, results in three tabs — Circles, People, Posts
10. Member badges: each post and member list shows the author's category-themed
    tenure badge for that circle (see section 4, Badges and ranks)
11. Settings: account rows, Appearance (System, Light, Dark), log out; rows not built
    yet are shown disabled with "Coming soon"
12. Landing page with a Three.js animated hero

The frontend is built first against a mock API (MSW) that follows section 5 exactly,
so it connects to the real backend later without rewrites.

### Later / startup version
"For you" ranked Home tab, per-category ranking decay, DMs, user-created circles,
moderation, notifications, stories, reposts, bookmarks, voice notes, video, live rooms,
GIFs, more niches (e.g. fragrance), refresh tokens, appearance saved to the account,
external movie/book/football data, circle ranks (weekly job), activity ranks weighted
by likes received, a setting to hide your own badges, a consistent cross-device emoji set.
See section 10 for the retention roadmap and section 11 for avatars, the wardrobe
shop, crafts and friendships.

## 2. Stack
Client: Vite, React 19, TypeScript (strict), Redux Toolkit + RTK Query, React Router,
Tailwind CSS, lucide-react, MSW (mock API), React Toastify, emoji-picker-react,
socket.io-client, @react-three/fiber + @react-three/drei
Server: Node 24, Express 5, TypeScript (strict), Mongoose, Zod, Passport.js
(passport-local, passport-jwt), bcrypt, jsonwebtoken, Cloudinary (signed direct uploads),
socket.io, helmet, cors, express-rate-limit, dotenv
Data: MongoDB Atlas | Media: Cloudinary
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
      config/         env.ts, db.ts, passport.ts
      models/         <name>.model.ts
      repositories/   <name>.repository.ts   (the only layer that talks to MongoDB)
      services/       <name>.service.ts      (business rules and permission checks)
      controllers/    <name>.controller.ts   (validate input, call service, respond)
      routes/         <name>.routes.ts
      validators/     <name>.schemas.ts      (Zod)
      middleware/     errorHandler, rateLimit, requireAuth
      socket/         chat handlers
      utils/          AppError.ts, pagination.ts, ranking.ts
      scripts/        seed.ts, checkDb.ts
      app.ts
      server.ts
```
Boundary rule: a service calls only its own repository. If it needs another domain's
data, it calls that domain's service.

## 4. Data models
User: username (unique, lowercase, 3–20, a-z 0-9 _), email (unique, lowercase),
passwordHash (never returned), displayName (1–50), bio (0–160),
avatar {url, publicId} | null, followerCount, followingCount, timestamps

Follow: follower, following, timestamps. Owned by follows. A user cannot follow
themselves.

Circle: name, slug (unique), category ("movies" | "books" | "football"),
description (0–300), memberCount, timestamps. Created only by the seed script.

Membership: user, circle, timestamps. Owned by circles.

Post: author, circle, text (0–2000), image {url, publicId} | null (text or image
required), isSpoiler (default false), likeCount, commentCount, hotScore, timestamps

Like: user, post, timestamps. Owned by interactions.

Comment: post, author, text (1–500), editedAt: Date | null, timestamps

ChatMessage: circle, sender, text (1–1000), timestamps

Event: circle, title, kind ("match" | "premiere" | "book_club" | "watch_party"), startsAt,
status ("upcoming" | "live" | "ended"), score {home, away, minute} | null, goingCount,
timestamps. Lab phase: mock data only; real fixtures and live scores come later.

EventAttendance: user, event, timestamps. Unique on { user, event }.

InviteCode: code (unique, uppercase), createdBy | null, maxUses, useCount, expiresAt | null,
timestamps. A use is claimed with one atomic update (useCount < maxUses and not expired),
so two people cannot take the last slot at once; it is given back if the account
cannot be created.

Counters (memberCount, followerCount, followingCount, likeCount, commentCount, hotScore)
change in the same MongoDB transaction as the record they count, and only when the
membership/follow/like/comment actually changed.

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
| comments | { post, createdAt } | Comments in order |
| chatmessages | { circle, createdAt } | Chat history |

Seeded circles (scripts/seed.ts, idempotent by slug):
Movies: Marvel & DC, Nollywood, Hollywood, Bollywood, Anime · Books: African Literature,
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
| POST | /posts | yes | { circleId, text?, image? { publicId }, isSpoiler? }; members only |
| GET | /posts/feed | yes | → { items: FeedItem[], nextCursor }; chronological |
| GET | /posts/:id | yes | Single post |
| DELETE | /posts/:id | yes | Author only; deletes image, likes and comments |
| POST | /posts/:id/like | yes | Idempotent like |
| DELETE | /posts/:id/like | yes | Idempotent unlike |
| GET | /posts/:id/comments | yes | Paginated, oldest first |
| POST | /posts/:id/comments | yes | Add comment |
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
- Hot tab: scores change while someone scrolls, so a post can move between pages. The
  client removes duplicates by post id; an occasional skipped post is accepted.
- Images go browser → Cloudinary directly; the server never holds image data in memory.
  Uploads are limited to the user's own folder, jpeg/png/webp, max 5 MB.
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
Mobile-first. Navigation: radial menu on phones (under 768px), icon rail at 768px,
labelled sidebar at 1280px+. Home is "Matchday": live now, today, this week. Each
circle opens as a "Circle deck" page with Hot/New posts. Explore keeps the tile layout.
Event titles are clamped to two lines.
Screens: Landing (Three.js hero) · Register/Login · Home feed · Explore circles ·
Circle page (Hot/New posts + live chat) · Post detail with comments · Search (Circles,
People, Posts) · Profile (+ edit, followers, following) · Settings · 404.
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

## 9. Vision (at scale)
- Learn mode: a distraction-free mode for study circles — channels per
  topic or week, study rooms, progress over popularity, no ranked feed or public likes.
- Circle tech shop: a marketplace where creators sell their own developer products
  (UI kits, templates, plugins, starter projects, courses); Circle takes a commission.
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
| Hosts | Shows, later Circle Radio | Media partners |

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
4. Circle Radio, talk-only: a station per circle, programme schedule, Matchday Radio,
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
  Circle gets a licence to display it
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

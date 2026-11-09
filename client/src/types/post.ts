import type { CircleCategory, CircleSummary } from "./event.ts";

export type PostSort = "hot" | "new";

export interface PostAuthor {
    username: string;
    displayName: string;
}

export interface Post {
    id: string;
    circle: CircleSummary;
    author: PostAuthor;
    authorJoinedCircleAt: string | null;
    text: string;
    isSpoiler: boolean;
    likeCount: number;
    commentCount: number;
    hotScore: number;
    createdAt: string;
}

export interface PostPage {
    items: Post[];
    nextCursor: string | null;
}

export interface CirclePostsArgs {
    slug: string;
    sort: PostSort;
}

export interface CircleDetails {
    slug: string;
    name: string;
    category: CircleCategory;
    memberCount: number;
    isMember: boolean;
}
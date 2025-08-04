export interface BiliVideoInfo {
    title: string;
    bvid: string;
    aid: number;
    author: string;
    duration: number;
    pubdate: number;
    desc: string;
    pic: string;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    like: number;
}

export interface BiliVideoDetail {
    cid: string;
    page: number;
    part: string;
    duration: number;
    dimension: {
        width: number;
        height: number;
        rotate: number;
    };
} 
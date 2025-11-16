var rule = {
    title: "MissAV",
    host: "https://missav.ai",
    homeUrl: "/dm24",
    url: "/dm24?page={page}",
    class_parse: '.relative nav .py-1 a;a&&Text;a&&href',
    cate_exclude: "色色主播|我的|女優|發行|類型|影評|VIP|觀看記錄|繁體中文",

    // 首页推荐
    推荐: 'div.thumbnail;img&&data-src;.my-2 a&&Text;.my-2 a&&href',

    // 分类页
    一级: 'div.thumbnail;img&&data-src;.my-2 a&&Text;.my-2 a&&href;span&&Text',

    // 视频详情
    二级: {
        title: ".mt-4 h1&&Text",
        img: "meta[property=og:image]&&content",
        desc: "",
        content: "div.mb-4 div.text-secondary&&Text",
        tabs: ["播放"],
        lists: 'body&&$host{url}#'
    },

    // 直接解析 m3u8
    lazy: async function (input) {
        let html = await req(input);
        let uuid = /nineyu\.com\/(.+?)\/seek\/_0\.jpg/.exec(html) ? /nineyu\.com\/(.+?)\/seek\/_0\.jpg/.exec(html)[1] : "";
        if (!uuid) return input;

        return `https://surrit.com/${uuid}/playlist.m3u8`;
    },

    // 搜索
    searchUrl: '/search/{wd}?page={page}',
    搜索: 'div.thumbnail;img&&data-src;.my-2 a&&Text;.my-2 a&&href;span&&Text',

    headers: {
        "User-Agent": "Mozilla/5.0 (TVBox)"
    }
}

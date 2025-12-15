class jiejieClass extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://jiejiesp.xyz'
        this.headers = {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://jiejiesp.xyz/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
    }

    /* ================= 分类 ================= */
    async getClassList(args) {
        let backData = new RepVideoClassList()
        try {
            let cls = [
                ['293', '姐姐资源'],
                ['86', '奥斯卡资源'],
                ['117', '森林资源'],
                ['337', '玉兔资源']
            ]
            let list = []
            for (let i = 0; i < cls.length; i++) {
                let c = new VideoClass()
                c.type_id = cls[i][0]
                c.type_name = cls[i][1]
                list.push(c)
            }
            backData.data = list
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 分类列表 ================= */
    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/type/id/${args.url}/page/${page}.html`
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)
                let items = document.querySelectorAll('ul.stui-vodlist li')
                let videos = []

                for (let el of items) {
                    let a = el.querySelector('h4.title a')
                    let thumb = el.querySelector('a.stui-vodlist__thumb')
                    if (!a || !thumb) continue

                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: thumb.getAttribute('data-original') || '',
                        vod_remarks:
                            el.querySelector('span.pic-text')?.text?.trim() || ''
                    })
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = '获取列表失败：' + e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 详情 ================= */
    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let url = args.url
            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)

                let det = new VideoDetail()
                det.vod_id = url
                det.vod_name =
                    document.querySelector('h1.title')?.text?.trim() || ''
                det.vod_content =
                    document.querySelector('.stui-content__desc')?.text?.trim() ||
                    ''
                det.vod_pic =
                    document
                        .querySelector('.stui-content__thumb img')
                        ?.getAttribute('src') || ''

                // ⭐ 从详情页 URL 提取数字 ID
                let vodId = url.match(/id\/(\d+)/)?.[1] ?? ''

                det.vod_play_from = '姐姐视频'
                det.vod_play_url = `正片$${vodId}#`

                backData.data = det
            }
        } catch (e) {
            backData.error = '获取详情失败：' + e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 播放（playdata） ================= */
    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let vodId = args.url
            let playDataUrl = `${this.webSite}/jiejie/index.php/vod/playdata/id/${vodId}/sid/1/nid/1.html`
            let pro = await req(playDataUrl, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let data =
                    typeof pro.data === 'string'
                        ? JSON.parse(pro.data)
                        : pro.data

                let playUrl = data.url || ''

                // encrypt=1 base64
                if (data.encrypt === 1) {
                    playUrl = atob(playUrl)
                }

                backData.data = playUrl
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 搜索 ================= */
    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            let page = args.page || 1
            let url = `${this.webSite}/jiejie/index.php/vod/search/wd/${encodeURIComponent(
                args.searchWord
            )}/page/${page}.html`

            let pro = await req(url, { headers: this.headers })
            backData.error = pro.error

            if (pro.data) {
                let document = parse(pro.data)
                let items = document.querySelectorAll('ul.stui-vodlist li')
                let videos = []

                for (let el of items) {
                    let a = el.querySelector('h4.title a')
                    let thumb = el.querySelector('a.stui-vodlist__thumb')
                    if (!a || !thumb) continue

                    videos.push({
                        vod_id: this.combineUrl(a.getAttribute('href')),
                        vod_name: a.text.trim(),
                        vod_pic: thumb.getAttribute('data-original') || '',
                        vod_remarks:
                            el.querySelector('span.pic-text')?.text?.trim() || ''
                    })
                }
                backData.data = videos
            }
        } catch (e) {
            backData.error = e.message
        }
        return JSON.stringify(backData)
    }

    /* ================= 工具 ================= */
    combineUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('/')) return this.webSite + url
        return this.webSite + '/' + url
    }
}

var jiejie2025 = new jiejieClass()

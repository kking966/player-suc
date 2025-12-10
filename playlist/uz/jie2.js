//@name:Jiejiesp
//@version:3
//@webSite:https://jiejiesp.xyz
//@type:100
//@isAV:1
//@order:J
//@remark:uz影视采集脚本（动态分类 + 调试日志）

class Jiejiesp extends WebApiBase {
  constructor() {
    super()
    this.site = "https://jiejiesp.xyz"
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Referer": this.site
    }
  }

  // 动态分类列表
  async getClassList() {
    let rep = new RepVideoClassList()
    try {
      let res = await req(this.site + "/jiejie/", { headers: this.headers })
      let html = res.data || ""
      let doc = parse(html)
      let list = []
      let links = doc.querySelectorAll(".stui-header__menu li a, .dropdown.type li a")

      console.log("分类链接数量:", links.length)

      for (let a of links) {
        let href = a.getAttribute("href")
        let name = a.text.trim()
        if (!href || !name) continue
        if (href.includes("/type/id/")) {
          list.push({
            type_id: this.full(href),
            type_name: name
          })
        }
      }
      console.log("解析到的分类:", list.map(x => x.type_name).join(", "))
      rep.data = list
    } catch (e) {
      rep.error = "解析分类出错: " + e.message
    }
    return JSON.stringify(rep)
  }

  // 视频列表
  async getVideoList(args) {
    let url = args.url
    let page = Number(args.page) || 1
    if (!url.includes("/page/")) {
      url = url.replace(".html", `/page/${page}.html`)
    }

    let rep = new RepVideoList()
    try {
      let res = await req(url, { headers: this.headers })
      let html = res.data || ""
      let doc = parse(html)
      let list = []
      let items = doc.querySelectorAll("ul.stui-vodlist li")

      console.log("列表条目数量:", items.length, "URL:", url)

      for (let it of items) {
        let aPic = it.querySelector("a.stui-vodlist__thumb")
        let aDet = it.querySelector(".stui-vodlist__detail h4 a")
        if (!aPic || !aDet) continue

        let pic = aPic.getAttribute("data-original") || aPic.getAttribute("src") || ""
        let name = aDet.text.trim()
        let detailUrl = aDet.getAttribute("href")

        list.push({
          vod_id: this.full(detailUrl),
          vod_name: name,
          vod_pic: this.full(pic),
          vod_remarks: it.querySelector(".pic-text")?.text?.trim() || ""
        })
      }
      console.log("解析到的视频数量:", list.length)
      rep.data = list
    } catch (e) {
      rep.error = "解析列表出错: " + e.message
    }
    return JSON.stringify(rep)
  }

  // 视频详情
  async getVideoDetail(args) {
    let url = args.url
    let rep = new RepVideoDetail()
    try {
      let res = await req(url, { headers: this.headers })
      let html = res.data || ""
      let doc = parse(html)
      let name = doc.querySelector("h1.title, h3.title, .stui-content__detail h1")?.text?.trim() || ""
      let pic = doc.querySelector(".lazyload")?.getAttribute("data-original") || ""
      let desc = doc.querySelector(".detail-content")?.text?.trim() || ""

      let det = new VideoDetail()
      det.vod_name = name
      det.vod_pic = this.full(pic)
      det.vod_content = desc
      det.vod_id = url

      let playList = []
      let playAreas = doc.querySelectorAll(".stui-content__playlist, .stui-play__list")
      console.log("播放区块数量:", playAreas.length)

      for (let area of playAreas) {
        let items = []
        let links = area.querySelectorAll("a")
        for (let a of links) {
          let epName = a.text.trim()
          let epUrl = this.full(a.getAttribute("href"))
          items.push(`${epName}$${epUrl}`)
        }
        if (items.length > 0) {
          playList.push(items.join("#"))
        }
      }
      det.vod_play_url = playList.join("$$$") || `播放$${url}#`

      rep.data = det
    } catch (e) {
      rep.error = "解析详情出错: " + e.message
    }
    return JSON.stringify(rep)
  }

  // 播放地址解析
  async getVideoPlayUrl(args) {
    let url = args.url
    let rep = new RepVideoPlayUrl()
    try {
      let res = await req(url, { headers: this.headers })
      let html = res.data || ""

      let directM3u8 = html.match(/https?:\/\/[^"' ]+\.m3u8/i)
      if (directM3u8) {
        console.log("直接匹配到m3u8:", directM3u8[0])
        rep.data = directM3u8[0]
        return JSON.stringify(rep)
      }

      let jsonMatch = html.match(/var\s+player_.*?=\s*(\{.*?\})<\/script>/s)
      if (jsonMatch) {
        try {
          let playerObj = JSON.parse(jsonMatch[1])
          if (playerObj.url) {
            console.log("从player JSON解析到:", playerObj.url)
            rep.data = playerObj.url
            return JSON.stringify(rep)
          }
        } catch (e) {
          console.log("解析player JSON失败:", e.message)
        }
      }

      let iframe = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
      if (iframe && iframe[1]) {
        console.log("发现iframe:", iframe[1])
        let play = iframe[1]
        let inner = await req(play, { headers: this.headers })
        let innerHtml = inner.data || ""
        let m3u8 = innerHtml.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/i)
        if (m3u8) {
          console.log("iframe内解析到m3u8:", m3u8[0])
          rep.data = m3u8[0]
          return JSON.stringify(rep)
        }
      }
    } catch (e) {
      console.log("播放解析异常:", e.message)
    }
    rep.error = "未找到播放地址"
    return JSON.stringify(rep)
  }

  full(url) {
    if (!url) return ""
    if (url.startsWith("http")) return url
    if (url.startsWith("//")) return "https:" + url
    if (!url.startsWith("/")) url = "/" + url
    return this.site + url
  }
}

var jiejiesp19 = new Jiejiesp()

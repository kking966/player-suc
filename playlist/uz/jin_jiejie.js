// name: Jiejiesp19
// version: 3
// webSite: https://wap.jiejiesp19.xyz
// type: 100
// isAV: 1
// order: J
// remark: Fully optimized using real detail+play HTML

import {} from '../../core/uzVideo.js'
import {} from '../../core/uzHome.js'
import {} from '../../core/uz3lib.js'
import {} from '../../core/uzUtils.js'

class Jiejie19 extends WebApiBase {

  constructor() {
    super()
    this.site = "https://wap.jiejiesp19.xyz/jiejie"
    this.headers = {
      "User-Agent": "Mozilla/5.0",
      "Referer": this.site
    }
  }

  /** 固定分类 */
  async getClassList() {
    let rep = new RepVideoClassList()
    rep.data = [
      { type_id: this.site + "/jiejie/index.php/vod/type/id/293.html", type_name: "姐姐资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/86.html", type_name: "奥斯卡资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/248.html", type_name: "155资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/117.html", type_name: "森林资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/337.html", type_name: "玉兔资源" }
    ]
    return JSON.stringify(rep)
  }

  /** 视频列表 */
  async getVideoList(args) {
    let url = args.url
    let page = Number(args.page) || 1

    if (!url.includes("/page/")) {
      url = url.replace(".html", `/page/${page}.html`)
    }

    let rep = new RepVideoList()
    let res = await req(url, { headers: this.headers })

    if (!res.data) {
      rep.error = "加载失败"
      return JSON.stringify(rep)
    }

    let doc = parse(res.data)
    let list = []

    let items = doc.querySelectorAll(".stui-vodlist li")

    for (let it of items) {
      let aPic = it.querySelector("a.stui-vodlist__thumb")
      let aDet = it.querySelector(".stui-vodlist__detail a")

      if (!aPic || !aDet) continue

      let pic = aPic.attributes["data-original"] ?? ""
      let name = aDet.text.trim()
      let playUrl = aPic.getAttribute("href")

      list.push({
        vod_id: this.full(playUrl),
        vod_name: name,
        vod_pic: this.full(pic),
        vod_remarks: ""
      })
    }

    rep.data = list
    return JSON.stringify(rep)
  }

  /** 视频详情（含播放页） */
  async getVideoDetail(args) {
    let url = args.url
    let rep = new RepVideoDetail()
    let res = await req(url, { headers: this.headers })

    if (!res.data) {
      rep.error = "加载详情失败"
      return JSON.stringify(rep)
    }

    let html = res.data
    let doc = parse(html)

    let name = doc.querySelector("h1.title")?.text?.trim() ?? ""
    let pic = doc.querySelector(".lazyload")?.attributes["data-original"] ?? ""
    let desc = doc.querySelector(".detail-content")?.text?.trim() ?? ""

    let det = new VideoDetail()
    det.vod_name = name
    det.vod_pic = this.full(pic)
    det.vod_content = desc
    det.vod_id = url

    // 播放入口 = 当前页
    det.vod_play_url = `$${url}#`

    rep.data = det
    return JSON.stringify(rep)
  }

  /** 播放地址解析（从 iframe 直接取） */
  async getVideoPlayUrl(args) {
    let url = args.url
    let rep = new RepVideoPlayUrl()

    let res = await req(url, { headers: this.headers })
    let html = res.data || ""

    // 查找 iframe
    let iframe = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)

    if (iframe && iframe[1]) {
      let play = iframe[1]

      // iframe src 里包含 m3u8
      if (play.includes("m3u8")) {
        rep.data = play
        return JSON.stringify(rep)
      }

      // 不含 m3u8 → 请求 iframe 内页面
      let inner = await req(play, { headers: this.headers })
      let innerHtml = inner.data || ""

      let m3u8 = innerHtml.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/i)
      if (m3u8) {
        rep.data = m3u8[0]
        return JSON.stringify(rep)
      }
    }

    rep.error = "未找到播放地址"
    return JSON.stringify(rep)
  }

  /** 修复相对路径 */
  full(url) {
    if (!url) return ""
    if (url.startsWith("http")) return url
    if (url.startsWith("//")) return "https:" + url
    if (!url.startsWith("/")) url = "/" + url
    return this.site + url
  }
}

var jiejiesp19_v3 = new Jiejie19()

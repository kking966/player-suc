// name: Jiejiesp19
// version: 3
// webSite: https://wap.jiejiesp19.xyz
// type: 100
// isAV: 1
// order: J
// remark: Fully optimized (No Import Version)

class Jiejie19 extends WebApiBase {

  constructor() {
    super()
    this.site = "https://wap.jiejiesp19.xyz"
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Referer": this.site
    }
  }

  async getClassList() {
    let rep = new RepVideoClassList()
    rep.data = [
      { type_id: this.site + "/jiejie/index.php/vod/type/id/293.html", type_name: "姐姐资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/86.html", type_name: "奥斯卡" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/248.html", type_name: "155资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/117.html", type_name: "森林资源" },
      { type_id: this.site + "/jiejie/index.php/vod/type/id/337.html", type_name: "玉兔资源" }
    ]
    return JSON.stringify(rep)
  }

async getVideoList(args) {
  let url = args.url
  let page = Number(args.page) || 1

  if (!url.includes("/page/")) {
    url = url.replace(".html", `/page/${page}.html`)
  }

  let rep = new RepVideoList()
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Referer": this.site,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Cookie": "_pk_id.5.d77b=223bb20d6993d296.1765344119.; _pk_ses.5.d77b=1; erdangjiade=erdangjiade; recente=%5B%7B%22vod_name%22%3A%22VEC-643-C%20%22%2C%22vod_url%22%3A%22https%3A%2F%2Fwap.jiejiesp19.xyz%2Fjiejie%2Findex.php%2Fvod%2Fplay%2Fid%2F1334172%2Fsid%2F1%2Fnid%2F1.html%22%2C%22vod_part%22%3A%22%E7%AC%AC1%E9%9B%86%22%7D%5D"
    }

    const res = await req(url, { headers })
    const html = res.data || ""
    if (!html || html.length < 200) {
      rep.error = "页面内容为空或过短"
      return JSON.stringify(rep)
    }

    console.log("请求URL:", url)
    console.log("HTML长度:", html.length)
    console.log("HTML片段:", html.substring(0, 500))

    const doc = parse(html)
    const list = []

    let items = doc.querySelectorAll(".stui-vodlist li")
    console.log("找到条目数:", items.length)

    for (let it of items) {
      let aPic = it.querySelector("a.stui-vodlist__thumb")
      let aDet = it.querySelector(".stui-vodlist__detail h4 a")

      if (!aPic || !aDet) continue

      let pic = aPic.getAttribute("data-original") || aPic.getAttribute("src") || ""
      let name = aDet.text.trim()
      let playUrl = aDet.getAttribute("href")

      list.push({
        vod_id: this.full(playUrl),
        vod_name: name,
        vod_pic: this.full(pic),
        vod_remarks: it.querySelector(".pic-text")?.text?.trim() || ""
      })
    }

    if (list.length === 0) {
      rep.error = "未解析到视频条目"
    } else {
      rep.data = list
    }
  } catch (e) {
    rep.error = "解析列表出错: " + e.message
  }

  return JSON.stringify(rep)
}

  async getVideoDetail(args) {
    let url = args.url
    let rep = new RepVideoDetail()
    try {
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
        det.vod_play_url = `播放$${url}#`

        rep.data = det
    } catch(e) {
        rep.error = "解析详情出错"
    }
    return JSON.stringify(rep)
  }

  async getVideoPlayUrl(args) {
    let url = args.url
    let rep = new RepVideoPlayUrl()

    try {
        let res = await req(url, { headers: this.headers })
        let html = res.data || ""

        let directM3u8 = html.match(/https?:\/\/[^"' ]+\.m3u8/i)
        if (directM3u8) {
            rep.data = directM3u8[0]
            return JSON.stringify(rep)
        }

        let iframe = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
        if (iframe && iframe[1]) {
          let play = iframe[1]
          if (play.includes("m3u8")) {
            rep.data = play
            return JSON.stringify(rep)
          }

          let inner = await req(play, { headers: this.headers })
          let innerHtml = inner.data || ""
          
          let m3u8 = innerHtml.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/i)
          if (m3u8) {
            rep.data = m3u8[0]
            return JSON.stringify(rep)
          }
        }
    } catch (e) {
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

var jiejiesp19 = new Jiejie19();
